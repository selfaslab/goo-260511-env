import type { Finding } from "../types/index.js";

/**
 * Build a deterministic prompt that an LLM (or a human reviewer) can read to
 * understand exactly what kind of secure refactor we are recommending. We
 * intentionally keep this 100% offline — no model call is made.
 */
export function buildRefactorPrompt(finding: Finding, currentCode?: string): string {
  const lines: string[] = [];
  lines.push("You are a senior application security engineer.");
  lines.push("Refactor the following code to remove the exposed secret.");
  lines.push("");
  lines.push(`File: ${finding.filePath}`);
  lines.push(`Line: ${finding.lineNumber}`);
  lines.push(`Secret type: ${finding.type}`);
  lines.push(`Risk: ${finding.risk}`);
  if (finding.variableName) {
    lines.push(`Variable: ${finding.variableName}`);
  }
  if (finding.clientExposed) {
    lines.push(
      "This secret is reachable in the client bundle. Move it to a server-side proxy.",
    );
  }
  if (currentCode) {
    lines.push("");
    lines.push("Current code:");
    lines.push("```");
    lines.push(currentCode);
    lines.push("```");
  }
  lines.push("");
  lines.push("Output a JSON object with: beforeCode, afterCode, explanation, migrationGuide[], serverImplementation, clientReplacement, envRename, patch[].");
  return lines.join("\n");
}
