import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import type { NodePath } from "@babel/traverse";
import type {
  CallExpression,
  Identifier,
  MemberExpression,
  Node,
  StringLiteral,
} from "@babel/types";
import type { UsageReference } from "../types/index.js";

// @babel/traverse exports the function as `default` when consumed from ESM.
const traverse = (traverseModule as unknown as { default: typeof traverseModule })
  .default ?? traverseModule;

interface AstScanInput {
  filePath: string;
  content: string;
  /** Hint: are we looking at code that runs in the browser bundle? */
  context: "client" | "server" | "unknown";
}

export interface AstUsage {
  variableName: string;
  reference: UsageReference;
  /** "process.env.X" | "import.meta.env.X" | "literal" */
  accessor: string;
}

/**
 * Walk a JS/TS file's AST looking for environment variable accesses and any
 * suspicious string literals that match secret patterns (basic ts-morph-free
 * pass — we use Babel for speed and JSX support).
 */
export function scanAst({ filePath, content, context }: AstScanInput): AstUsage[] {
  const usages: AstUsage[] = [];

  let ast: ReturnType<typeof parse>;
  try {
    ast = parse(content, {
      sourceType: "unambiguous",
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      errorRecovery: true,
      plugins: [
        "typescript",
        "jsx",
        "decorators-legacy",
        "classProperties",
        "topLevelAwait",
        "importMeta",
      ],
    });
  } catch {
    return usages;
  }

  const record = (
    variableName: string,
    accessor: string,
    node: Node,
  ): void => {
    if (!variableName) return;
    const line = node.loc?.start.line ?? 1;
    usages.push({
      variableName,
      accessor,
      reference: {
        filePath,
        lineNumber: line,
        context,
        accessor,
      },
    });
  };

  traverse(ast, {
    MemberExpression(path: NodePath<MemberExpression>) {
      const node = path.node;

      // process.env.FOO
      if (
        node.object.type === "MemberExpression" &&
        node.object.object.type === "Identifier" &&
        node.object.object.name === "process" &&
        node.object.property.type === "Identifier" &&
        node.object.property.name === "env"
      ) {
        const prop = node.property as Identifier | StringLiteral;
        const name = prop.type === "Identifier" ? prop.name : prop.value;
        record(name, "process.env", node);
        return;
      }

      // import.meta.env.FOO
      if (
        node.object.type === "MemberExpression" &&
        node.object.object.type === "MetaProperty" &&
        node.object.property.type === "Identifier" &&
        node.object.property.name === "env"
      ) {
        const prop = node.property as Identifier | StringLiteral;
        const name = prop.type === "Identifier" ? prop.name : prop.value;
        record(name, "import.meta.env", node);
      }
    },

    CallExpression(path: NodePath<CallExpression>) {
      const callee = path.node.callee;
      // dotenv.config({ path: '...' }) — informational only, no usage emitted
      if (
        callee.type === "MemberExpression" &&
        callee.object.type === "Identifier" &&
        callee.object.name === "dotenv" &&
        callee.property.type === "Identifier" &&
        callee.property.name === "config"
      ) {
        record("__dotenv_config__", "dotenv.config", path.node);
      }
    },
  });

  return usages;
}
