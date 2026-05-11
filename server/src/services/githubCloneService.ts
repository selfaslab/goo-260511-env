import { mkdtemp, rm, stat } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import fg from "fast-glob";
import { simpleGit } from "simple-git";
import { runScan } from "./scanService.js";
import type { RepositoryInfo, ScanResult } from "../types/index.js";
import { EXCLUDED_FOLDERS } from "../constants/patterns.js";

export interface ParsedRepoUrl {
  owner: string;
  repo: string;
  cloneUrl: string;
  webUrl: string;
}

/** Hard guards. */
const CLONE_TIMEOUT_MS = 60_000;
const MAX_CLONE_SIZE_MB = 500;
const MAX_FILE_COUNT = 50_000;
const TEMP_PREFIX = "guardian-scan-";

/**
 * Validate and normalise a GitHub URL. Accepts both the HTTPS UI form and the
 * `.git` clone form. Rejects anything else (no SSH, no GitLab, no private host
 * — this is a public-repo, free-tier scanner).
 */
export function parseGithubUrl(input: string): ParsedRepoUrl {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Repository URL is empty.");
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Invalid URL.");
  }
  if (!/^https?:$/.test(url.protocol)) {
    throw new Error("Only https:// GitHub URLs are accepted.");
  }
  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
    throw new Error("Only public github.com URLs are accepted.");
  }
  const segments = url.pathname.replace(/^\/+/, "").split("/").filter(Boolean);
  if (segments.length < 2) {
    throw new Error("URL must look like https://github.com/<owner>/<repo>.");
  }
  const owner = segments[0];
  const rawRepo = segments[1].replace(/\.git$/, "");
  if (!/^[A-Za-z0-9_.\-]+$/.test(owner) || !/^[A-Za-z0-9_.\-]+$/.test(rawRepo)) {
    throw new Error("Owner / repository contain invalid characters.");
  }
  const cloneUrl = `https://github.com/${owner}/${rawRepo}.git`;
  const webUrl = `https://github.com/${owner}/${rawRepo}`;
  return { owner, repo: rawRepo, cloneUrl, webUrl };
}

/**
 * Clone the repo into an OS temp folder, run the scan, and ALWAYS clean up —
 * even on failure. We do not download git history (`--depth=1`), and we
 * actively size-check the clone afterwards: if it exceeds the limits we
 * delete it and refuse to scan.
 */
export async function scanGithubRepo(rawUrl: string): Promise<ScanResult> {
  const parsed = parseGithubUrl(rawUrl);
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), TEMP_PREFIX));
  const cloneTarget = path.join(tempRoot, parsed.repo);
  let commitSha: string | undefined;
  let branch: string | undefined;

  try {
    const git = simpleGit({ baseDir: tempRoot, timeout: { block: CLONE_TIMEOUT_MS } });
    await git.clone(parsed.cloneUrl, cloneTarget, [
      "--depth=1",
      "--single-branch",
      "--no-tags",
      "--filter=blob:none",
    ]);

    const repoGit = simpleGit({ baseDir: cloneTarget });
    try {
      const head = await repoGit.revparse(["HEAD"]);
      commitSha = head.trim().slice(0, 12);
    } catch {
      commitSha = undefined;
    }
    try {
      branch = (await repoGit.revparse(["--abbrev-ref", "HEAD"])).trim();
    } catch {
      branch = undefined;
    }

    const { totalSizeMb, fileCount } = await measureClone(cloneTarget);
    if (totalSizeMb > MAX_CLONE_SIZE_MB) {
      throw new Error(
        `Repository is too large (${totalSizeMb.toFixed(1)} MB > ${MAX_CLONE_SIZE_MB} MB limit).`,
      );
    }
    if (fileCount > MAX_FILE_COUNT) {
      throw new Error(
        `Repository has too many files (${fileCount} > ${MAX_FILE_COUNT} limit).`,
      );
    }

    const repository: RepositoryInfo = {
      source: "github",
      projectPath: cloneTarget,
      repoUrl: parsed.webUrl,
      owner: parsed.owner,
      repo: parsed.repo,
      branch,
      commitSha,
      cloneSizeMb: Number(totalSizeMb.toFixed(2)),
      fileCount,
    };

    const result = await runScan({ projectPath: cloneTarget, repository });
    // After the scan finishes we no longer need the clone on disk. The result
    // already keeps `repository.repoUrl` as the canonical id, so we wipe the
    // path field to make it clear the local copy is gone.
    result.repository = { ...result.repository, projectPath: parsed.webUrl };
    result.projectPath = parsed.webUrl;
    return result;
  } finally {
    // Always cleanup. Errors here are logged but never propagated — we don't
    // want a cleanup failure to mask the real error from the caller.
    await safeRm(tempRoot);
  }
}

async function measureClone(root: string): Promise<{ totalSizeMb: number; fileCount: number }> {
  const entries = await fg(["**/*"], {
    cwd: root,
    dot: true,
    onlyFiles: true,
    followSymbolicLinks: false,
    ignore: EXCLUDED_FOLDERS.map((folder) => `**/${folder}/**`),
    suppressErrors: true,
  });
  let totalBytes = 0;
  for (const rel of entries) {
    try {
      const s = await stat(path.join(root, rel));
      totalBytes += s.size;
    } catch {
      // ignore unreadable / vanished files
    }
  }
  return {
    totalSizeMb: totalBytes / (1024 * 1024),
    fileCount: entries.length,
  };
}

async function safeRm(target: string): Promise<void> {
  try {
    await rm(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[guardian] failed to clean temp folder", target, err);
  }
}
