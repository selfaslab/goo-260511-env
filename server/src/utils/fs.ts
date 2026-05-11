import fg from "fast-glob";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ignore from "ignore";
import { existsSync, readFileSync, statSync } from "node:fs";
import {
  EXCLUDED_FOLDERS,
  SUPPORTED_EXTENSIONS,
  SUPPORTED_FILENAMES,
} from "../constants/patterns.js";

export interface DiscoveredFile {
  absolutePath: string;
  relativePath: string;
  extension: string;
  basename: string;
  isEnvFile: boolean;
}

/**
 * Walk the project root with fast-glob, honouring .gitignore and the built-in
 * EXCLUDED_FOLDERS list. We open files that either match SUPPORTED_EXTENSIONS
 * or whose basename is in SUPPORTED_FILENAMES (Dockerfile, vercel.json, …).
 */
export async function discoverFiles(
  projectRoot: string,
): Promise<DiscoveredFile[]> {
  const ig = ignore();
  ig.add(EXCLUDED_FOLDERS.map((folder) => `${folder}/`));

  const gitignorePath = path.join(projectRoot, ".gitignore");
  if (existsSync(gitignorePath)) {
    try {
      ig.add(readFileSync(gitignorePath, "utf8"));
    } catch {
      // gitignore is best-effort
    }
  }

  const entries = await fg(["**/*", "**/.env*", "**/.npmrc"], {
    cwd: projectRoot,
    dot: true,
    onlyFiles: true,
    followSymbolicLinks: false,
    ignore: EXCLUDED_FOLDERS.map((folder) => `**/${folder}/**`),
    suppressErrors: true,
  });

  const filtered: DiscoveredFile[] = [];
  for (const relPath of entries) {
    if (ig.ignores(relPath)) continue;
    const basename = path.basename(relPath);
    const ext = detectExtension(relPath);
    const accepted =
      SUPPORTED_EXTENSIONS.includes(ext) || SUPPORTED_FILENAMES.has(basename);
    if (!accepted) continue;
    filtered.push({
      absolutePath: path.join(projectRoot, relPath),
      relativePath: relPath.replace(/\\/g, "/"),
      extension: ext,
      basename,
      isEnvFile: ext.startsWith(".env") || basename.startsWith(".env"),
    });
  }
  return filtered;
}

export function detectExtension(filePath: string): string {
  const base = path.basename(filePath);
  if (base === ".env" || base.startsWith(".env.")) return ".env";
  return path.extname(base);
}

export async function safeReadFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

export function safeFileSizeMb(filePath: string): number {
  try {
    return statSync(filePath).size / (1024 * 1024);
  } catch {
    return 0;
  }
}
