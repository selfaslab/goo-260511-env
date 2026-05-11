import path from "node:path";
import { existsSync, statSync } from "node:fs";
import type {
  Finding,
  RepositoryInfo,
  ScanResult,
} from "../types/index.js";
import { discoverFiles, safeFileSizeMb, safeReadFile } from "../utils/fs.js";
import { scanFileWithRegex } from "../scanner/regexScanner.js";
import { scanEnvFile } from "../scanner/envScanner.js";
import { buildDependencyGraph } from "../scanner/dependencyTrace.js";
import { applyRiskEngine, emptyResult } from "../scanner/riskEngine.js";
import { detectFrameworks } from "../scanner/frameworkDetector.js";
import {
  detectHasEnvExample,
  detectHasGitignore,
  detectUsesSecretManager,
  scanRiskyConfigs,
} from "../scanner/configScanner.js";

/**
 * In-memory cache of the latest scan result keyed by the *display* identifier
 * (absolute local path or `github:owner/repo`). Used by /api/report so the UI
 * can re-hydrate without re-scanning. Capped at 16 entries to avoid leaks.
 */
const lastResultsByKey = new Map<string, ScanResult>();
const MAX_CACHE = 16;

interface InternalScanInput {
  projectPath: string;
  repository: RepositoryInfo;
}

/**
 * Public entry point — local path scan. Resolves the path, validates it, then
 * delegates to the shared internal pipeline.
 */
export async function scanProject(rawPath: string): Promise<ScanResult> {
  const projectPath = path.resolve(rawPath);
  if (!existsSync(projectPath)) {
    throw new Error(`Folder not found: ${projectPath}`);
  }
  if (!statSync(projectPath).isDirectory()) {
    throw new Error(`Path is not a directory: ${projectPath}`);
  }
  const repository: RepositoryInfo = { source: "local", projectPath };
  return runScan({ projectPath, repository });
}

/**
 * Internal pipeline. Used by both the local path scan and the GitHub clone
 * scan (which prepares a temp folder and constructs its own RepositoryInfo).
 */
export async function runScan({
  projectPath,
  repository,
}: InternalScanInput): Promise<ScanResult> {
  const files = await discoverFiles(projectPath);
  if (files.length === 0) {
    const empty = emptyResult(projectPath) as ScanResult;
    empty.repository = repository;
    cache(repository, empty);
    return empty;
  }

  const fileContents = new Map<string, string>();
  const allFindings: Finding[] = [];
  let totalSizeMb = 0;

  for (const file of files) {
    const content = await safeReadFile(file.absolutePath);
    if (content == null) continue;
    fileContents.set(file.absolutePath, content);
    totalSizeMb += safeFileSizeMb(file.absolutePath);

    const relativePath = file.relativePath;
    const findingsFromFile = file.isEnvFile
      ? scanEnvFile({ filePath: relativePath, content })
      : scanFileWithRegex({
          filePath: relativePath,
          content,
          isEnvFile: false,
        });

    allFindings.push(...findingsFromFile);
  }

  const dependencies = buildDependencyGraph({ files, fileContents });
  const frameworks = detectFrameworks(files, fileContents);
  const riskyConfigs = scanRiskyConfigs({ files, fileContents });

  const hasGitignore = detectHasGitignore(files);
  const hasEnvExample = detectHasEnvExample(files);
  const secretMgr = detectUsesSecretManager(files, fileContents);
  const noClientExposure =
    !dependencies.some((d) => d.clientExposed) &&
    !allFindings.some((f) => f.clientExposed);

  const engine = applyRiskEngine({
    findings: allFindings,
    dependencies,
    riskyConfigs,
    hasGitignore,
    hasEnvExample,
    usesSecretManager: secretMgr.uses,
    noClientExposure,
  });

  const repoInfo: RepositoryInfo = {
    ...repository,
    cloneSizeMb: Number(totalSizeMb.toFixed(2)),
    fileCount: files.length,
  };

  const result: ScanResult = {
    findings: dedupe(engine.findings),
    totalFiles: files.length,
    scannedFiles: fileContents.size,
    severityScore: engine.score.finalScore,
    riskBreakdown: engine.riskBreakdown,
    dependencies,
    summary: engine.summary,
    scannedAt: new Date().toISOString(),
    projectPath,
    repository: repoInfo,
    frameworks,
    score: engine.score,
    recommendations: engine.recommendations,
    riskyConfigs,
  };

  cache(repository, result);
  return result;
}

export function getLastResult(key?: string): ScanResult | null {
  if (!key) {
    const values = Array.from(lastResultsByKey.values());
    return values.length > 0 ? values[values.length - 1] : null;
  }
  // Try as-is first, then resolved local path.
  if (lastResultsByKey.has(key)) return lastResultsByKey.get(key) ?? null;
  try {
    const resolved = path.resolve(key);
    return lastResultsByKey.get(resolved) ?? null;
  } catch {
    return null;
  }
}

function cache(repository: RepositoryInfo, result: ScanResult): void {
  const key =
    repository.source === "github" && repository.repoUrl
      ? `github:${repository.repoUrl}`
      : repository.projectPath;
  lastResultsByKey.set(key, result);
  if (lastResultsByKey.size > MAX_CACHE) {
    const first = lastResultsByKey.keys().next().value;
    if (first) lastResultsByKey.delete(first);
  }
}

function dedupe(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  const out: Finding[] = [];
  for (const f of findings) {
    const key = `${f.filePath}:${f.lineNumber}:${f.type}:${f.valueMasked}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out.sort((a, b) => severityRank(b.risk) - severityRank(a.risk));
}

function severityRank(risk: Finding["risk"]): number {
  return { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }[risk];
}
