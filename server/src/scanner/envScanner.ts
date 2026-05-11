import { CLIENT_EXPOSED_PREFIXES } from "../constants/patterns.js";
import type { Finding, RiskLevel } from "../types/index.js";
import { maskLine, maskValue, stableId } from "../utils/mask.js";

interface EnvScanInput {
  filePath: string;
  content: string;
}

/**
 * Specialised parser for `.env` style files. We treat every populated KEY=VALUE
 * pair as a finding because the entire purpose of the tool is to surface what
 * lives in environment files and where each variable is consumed.
 */
export function scanEnvFile({
  filePath,
  content,
}: EnvScanInput): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    if (line.trim().startsWith("#")) continue;
    const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*['"`]?([^'"`#\n]*)['"`]?/);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.trim();
    if (!value) continue;

    const clientExposed = CLIENT_EXPOSED_PREFIXES.some((p) => key.startsWith(p));
    const risk: RiskLevel = clientExposed ? "CRITICAL" : "LOW";

    findings.push({
      id: stableId([filePath, i + 1, key, value]),
      type: "ENV_DECLARATION",
      risk,
      valueMasked: maskValue(value),
      filePath,
      lineNumber: i + 1,
      snippet: maskLine(line, [value]),
      variableName: key,
      hardcoded: false,
      clientExposed,
    });
  }
  return findings;
}
