import {
  CLIENT_EXPOSED_PREFIXES,
  GENERIC_KEYWORDS,
  SECRET_PATTERNS,
} from "../constants/patterns.js";
import type { Finding, RiskLevel } from "../types/index.js";
import { maskLine, maskValue, stableId } from "../utils/mask.js";

interface RegexScanInput {
  filePath: string;
  content: string;
  isEnvFile: boolean;
}

/**
 * Run all provider regexes plus generic keyword detection over a single file.
 * Each finding is emitted with a masked value and an `id` derived from the
 * file/line/value tuple so reruns produce stable identifiers.
 */
export function scanFileWithRegex({
  filePath,
  content,
  isEnvFile,
}: RegexScanInput): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line || line.trim().startsWith("#") || line.trim().startsWith("//")) {
      continue;
    }

    for (const pattern of SECRET_PATTERNS) {
      pattern.regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.regex.exec(line)) !== null) {
        const value = match[0];
        const masked = maskValue(value);
        findings.push({
          id: stableId([filePath, i + 1, pattern.type, value]),
          type: pattern.type,
          risk: refineRisk(pattern.baseRisk, { isEnvFile, line }),
          valueMasked: masked,
          filePath,
          lineNumber: i + 1,
          snippet: maskLine(line, [value]).slice(0, 240),
          variableName: extractVariableName(line),
          hardcoded: !isEnvFile,
          clientExposed: detectClientExposure(line),
        });
      }
    }

    // Generic KEY=value detection (mainly for .env-style files)
    const declaration = parseDeclaration(line);
    if (declaration) {
      for (const { keyword, type } of GENERIC_KEYWORDS) {
        if (!keyword.test(declaration.key)) continue;
        if (!declaration.value || declaration.value.length < 4) continue;
        // Skip if a more specific provider pattern already matched this value.
        const alreadyCovered = findings.some(
          (f) => f.lineNumber === i + 1 && f.filePath === filePath,
        );
        if (alreadyCovered) continue;
        findings.push({
          id: stableId([filePath, i + 1, type, declaration.value]),
          type,
          risk: refineRisk("MEDIUM", { isEnvFile, line }),
          valueMasked: maskValue(declaration.value),
          filePath,
          lineNumber: i + 1,
          snippet: maskLine(line, [declaration.value]).slice(0, 240),
          variableName: declaration.key,
          hardcoded: !isEnvFile,
          clientExposed: declaration.key
            ? CLIENT_EXPOSED_PREFIXES.some((p) => declaration.key.startsWith(p))
            : false,
        });
      }
    }
  }

  return findings;
}

function refineRisk(
  base: RiskLevel,
  ctx: { isEnvFile: boolean; line: string },
): RiskLevel {
  if (!ctx.isEnvFile) {
    // Hardcoded secrets in source files are always CRITICAL regardless of base.
    return "CRITICAL";
  }
  if (detectClientExposure(ctx.line)) {
    return "CRITICAL";
  }
  return base;
}

function detectClientExposure(line: string): boolean {
  if (/import\.meta\.env\.[A-Z0-9_]+/.test(line)) return true;
  if (/process\.env\.(VITE_|NEXT_PUBLIC_|REACT_APP_|EXPO_PUBLIC_|PUBLIC_)/.test(line)) return true;
  for (const prefix of CLIENT_EXPOSED_PREFIXES) {
    const re = new RegExp(`(^|[^A-Z0-9_])${prefix}[A-Z0-9_]+`);
    if (re.test(line)) return true;
  }
  return false;
}

interface Declaration {
  key: string;
  value: string;
}

function parseDeclaration(line: string): Declaration | null {
  const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*[:=]\s*['"`]?([^'"`#\n]+)['"`]?/);
  if (!match) return null;
  return { key: match[1], value: match[2].trim() };
}

function extractVariableName(line: string): string | undefined {
  const direct = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*[:=]/);
  if (direct) return direct[1];
  const procEnv = line.match(/process\.env\.([A-Z0-9_]+)/);
  if (procEnv) return procEnv[1];
  const importMeta = line.match(/import\.meta\.env\.([A-Z0-9_]+)/);
  if (importMeta) return importMeta[1];
  return undefined;
}
