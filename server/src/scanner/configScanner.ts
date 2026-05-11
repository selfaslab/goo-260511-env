import { CLIENT_EXPOSED_PREFIXES } from "../constants/patterns.js";
import type { RiskyConfig } from "../types/index.js";
import type { DiscoveredFile } from "../utils/fs.js";

interface ScanInput {
  files: DiscoveredFile[];
  fileContents: Map<string, string>;
}

/**
 * Look at infra/config files (workflows, docker-compose, vercel.json,
 * netlify.toml, *.tf …) and surface obvious smells: secrets baked into the
 * file, public env prefixes used for sensitive names, etc. Findings here are
 * not "secrets" per se, they are *configuration* problems.
 */
export function scanRiskyConfigs({ files, fileContents }: ScanInput): RiskyConfig[] {
  const out: RiskyConfig[] = [];

  for (const file of files) {
    const content = fileContents.get(file.absolutePath);
    if (!content) continue;
    const rel = file.relativePath;
    const base = file.basename.toLowerCase();
    const lines = content.split(/\r?\n/);

    if (rel.startsWith(".github/workflows/")) {
      lines.forEach((line, idx) => {
        if (/run\s*:.*\$\{\{\s*secrets\.[A-Z0-9_]+\s*\}\}.*echo/i.test(line)) {
          out.push({
            filePath: rel,
            lineNumber: idx + 1,
            risk: "HIGH",
            reason: "GitHub Action prints a secret with `echo` (will appear in logs).",
          });
        }
        if (/pull_request_target/i.test(line)) {
          out.push({
            filePath: rel,
            lineNumber: idx + 1,
            risk: "MEDIUM",
            reason:
              "`pull_request_target` runs in a privileged context — review for fork-PR abuse.",
          });
        }
      });
    }

    if (base === "docker-compose.yml" || base === "docker-compose.yaml") {
      lines.forEach((line, idx) => {
        const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*:\s*['"]?([^'"#\n]+)['"]?/);
        if (m && /SECRET|TOKEN|PASSWORD|KEY/i.test(m[1]) && m[2].length > 4 && !m[2].startsWith("$")) {
          out.push({
            filePath: rel,
            lineNumber: idx + 1,
            risk: "CRITICAL",
            reason: `Hardcoded credential (${m[1]}) in docker-compose. Use \${VAR} interpolation instead.`,
          });
        }
      });
    }

    if (base === "vercel.json" || base === "netlify.toml") {
      lines.forEach((line, idx) => {
        for (const prefix of CLIENT_EXPOSED_PREFIXES) {
          if (line.includes(`${prefix}SECRET`) || line.includes(`${prefix}TOKEN`) || line.includes(`${prefix}PRIVATE`)) {
            out.push({
              filePath: rel,
              lineNumber: idx + 1,
              risk: "CRITICAL",
              reason: `${prefix}* names are bundled into the client. Rename to a server-only variable.`,
            });
            break;
          }
        }
      });
    }

    if (file.extension === ".tf" || file.extension === ".tfvars") {
      lines.forEach((line, idx) => {
        if (/(aws_secret_access_key|access_key|password)\s*=\s*"[^"]{6,}"/i.test(line)) {
          out.push({
            filePath: rel,
            lineNumber: idx + 1,
            risk: "CRITICAL",
            reason: "Hardcoded credential in Terraform — load via env / Vault / SSM instead.",
          });
        }
      });
    }

    if (base === "dockerfile") {
      lines.forEach((line, idx) => {
        if (/^\s*ENV\s+[A-Z][A-Z0-9_]*\s*=?\s*["']?[A-Za-z0-9+/=._\-]{16,}/.test(line)
          && /SECRET|TOKEN|PASSWORD|KEY/i.test(line)) {
          out.push({
            filePath: rel,
            lineNumber: idx + 1,
            risk: "HIGH",
            reason: "ENV directive bakes a secret into the image layer. Use BuildKit secrets instead.",
          });
        }
      });
    }
  }

  return out;
}

export function detectHasGitignore(files: DiscoveredFile[]): boolean {
  return files.some((f) => f.basename === ".gitignore");
}

export function detectHasEnvExample(files: DiscoveredFile[]): boolean {
  return files.some((f) => f.basename === ".env.example" || f.basename === ".env.sample");
}

export function detectUsesSecretManager(
  files: DiscoveredFile[],
  fileContents: Map<string, string>,
): { uses: boolean; evidence: string[] } {
  const hints = [
    "@aws-sdk/client-secrets-manager",
    "google-auth-library",
    "@google-cloud/secret-manager",
    "doppler",
    "vault",
    "@vercel/edge-config",
    "@infisical/sdk",
  ];
  const evidence: string[] = [];

  for (const file of files) {
    if (file.basename !== "package.json" && file.basename !== "requirements.txt") continue;
    const content = fileContents.get(file.absolutePath);
    if (!content) continue;
    for (const hint of hints) {
      if (content.toLowerCase().includes(hint.toLowerCase())) {
        evidence.push(`${file.relativePath} → ${hint}`);
      }
    }
  }
  return { uses: evidence.length > 0, evidence };
}
