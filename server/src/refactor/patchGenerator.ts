import type { Finding, PatchExport, PatchOperation } from "../types/index.js";

interface BuildPatchInput {
  finding: Finding;
  beforeCode: string;
  afterCode: string;
  envRename: { from: string; to: string } | null;
}

/**
 * Build the per-finding patch operations. Each operation is a pure
 * find/replace that can be applied by `git apply`-style tooling or by the
 * future Cursor extension.
 */
export function buildPatch({
  finding,
  beforeCode,
  afterCode,
  envRename,
}: BuildPatchInput): PatchOperation[] {
  const ops: PatchOperation[] = [];
  ops.push({
    file: finding.filePath,
    find: beforeCode.trim(),
    replace: afterCode.trim(),
  });
  if (envRename) {
    ops.push({
      file: ".env",
      find: `${envRename.from}=`,
      replace: `${envRename.to}=`,
    });
  }
  return ops;
}

export function aggregatePatch(
  projectPath: string,
  patches: PatchOperation[][],
): PatchExport {
  const seen = new Set<string>();
  const merged: PatchOperation[] = [];
  for (const list of patches) {
    for (const op of list) {
      const key = `${op.file}::${op.find}::${op.replace}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(op);
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    projectPath,
    replace: merged,
  };
}
