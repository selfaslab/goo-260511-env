import { Project, ScriptKind } from "ts-morph";
import path from "node:path";
import {
  CLIENT_EXPOSED_PREFIXES,
} from "../constants/patterns.js";
import type { DependencyNode, UsageReference } from "../types/index.js";
import { scanAst } from "./astScanner.js";
import type { DiscoveredFile } from "../utils/fs.js";

/**
 * Build a dependency graph mapping each environment variable name to the
 * concrete files (with line numbers) where it is consumed. We use both Babel
 * (for JSX/TSX speed) and ts-morph (so we can later resolve imports across
 * files for richer guidance).
 */
export interface DependencyTraceInput {
  files: DiscoveredFile[];
  fileContents: Map<string, string>;
}

export function buildDependencyGraph({
  files,
  fileContents,
}: DependencyTraceInput): DependencyNode[] {
  const graph = new Map<string, DependencyNode>();

  // 1. Babel-driven walk for every JS/TS file. ts-morph project for symbol
  // info if needed in the future.
  const project = new Project({
    useInMemoryFileSystem: true,
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    skipLoadingLibFiles: true,
    compilerOptions: {
      allowJs: true,
      jsx: 4 /* React */,
      target: 99 /* ESNext */,
      module: 99 /* ESNext */,
    },
  });

  for (const file of files) {
    if (file.isEnvFile) continue;
    if (![".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(file.extension)) {
      continue;
    }
    const content = fileContents.get(file.absolutePath);
    if (!content) continue;

    const context = inferContext(file.relativePath);
    const usages = scanAst({
      filePath: file.relativePath,
      content,
      context,
    });

    for (const usage of usages) {
      if (usage.variableName.startsWith("__")) continue;
      addToGraph(graph, usage.variableName, usage.reference, usage.accessor);
    }

    // Also register the file in the ts-morph project for future cross-file
    // analysis (left here intentionally so the codebase grows naturally).
    try {
      const scriptKind =
        file.extension === ".tsx"
          ? ScriptKind.TSX
          : file.extension === ".jsx"
            ? ScriptKind.JSX
            : file.extension === ".ts"
              ? ScriptKind.TS
              : ScriptKind.JS;
      project.createSourceFile(file.relativePath, content, {
        overwrite: true,
        scriptKind,
      });
    } catch {
      // Best-effort — don't fail the scan on parser errors.
    }
  }

  return Array.from(graph.values()).sort((a, b) =>
    a.variableName.localeCompare(b.variableName),
  );
}

function addToGraph(
  graph: Map<string, DependencyNode>,
  variableName: string,
  reference: UsageReference,
  accessor: string,
): void {
  const existing = graph.get(variableName);
  const clientExposed =
    reference.context === "client" ||
    accessor === "import.meta.env" ||
    CLIENT_EXPOSED_PREFIXES.some((p) => variableName.startsWith(p));

  if (!existing) {
    graph.set(variableName, {
      variableName,
      references: [reference],
      clientExposed,
    });
    return;
  }
  existing.references.push(reference);
  if (clientExposed) existing.clientExposed = true;
}

function inferContext(relativePath: string): "client" | "server" | "unknown" {
  const normalised = relativePath.replace(/\\/g, "/").toLowerCase();
  if (
    normalised.includes("/client/") ||
    normalised.includes("/web/") ||
    normalised.includes("/frontend/") ||
    normalised.includes("/app/") ||
    normalised.includes("/pages/") ||
    normalised.includes("/components/") ||
    normalised.includes("/hooks/") ||
    normalised.endsWith(".tsx") ||
    normalised.endsWith(".jsx")
  ) {
    return "client";
  }
  if (
    normalised.includes("/server/") ||
    normalised.includes("/api/") ||
    normalised.includes("/backend/") ||
    normalised.includes("/lib/server/")
  ) {
    return "server";
  }
  return "unknown";
}

export function relativeToProject(absPath: string, projectRoot: string): string {
  return path.relative(projectRoot, absPath).replace(/\\/g, "/");
}
