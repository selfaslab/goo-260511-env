import { CLIENT_EXPOSED_PREFIXES } from "../constants/patterns.js";
import type { Finding, RefactorResult } from "../types/index.js";
import { buildPatch } from "./patchGenerator.js";

interface RefactorInput {
  finding: Finding;
  currentCode?: string;
}

/**
 * Heuristic, fully-offline secure refactor generator. Given a finding and
 * (optionally) the current source code we output:
 *  - the masked "before" snippet
 *  - a safe "after" snippet that proxies through the backend
 *  - a stub Express handler implementation
 *  - a step-by-step migration guide
 *  - a deterministic patch operation list
 *
 * This is intentionally pattern-driven (no LLM call) so the MVP is reliable
 * and reproducible. The promptBuilder helper produces a prompt you could feed
 * to an LLM later for richer rewrites.
 */
export function generateSecureRefactor({
  finding,
  currentCode,
}: RefactorInput): RefactorResult {
  const safeName = sanitizeName(finding.variableName) ?? deriveNameFromType(finding.type);
  const renamed = stripClientPrefix(safeName);
  const envRename = safeName !== renamed ? { from: safeName, to: renamed } : null;

  const beforeCode =
    currentCode?.trim() ||
    finding.snippet ||
    `// ${finding.filePath}:${finding.lineNumber}\nconst value = import.meta.env.${safeName};`;

  const proxyEndpoint = deriveEndpoint(renamed);
  const serverImplementation = renderServerHandler({
    endpoint: proxyEndpoint,
    envName: renamed,
    finding,
  });

  const clientReplacement = renderClientReplacement({
    endpoint: proxyEndpoint,
    finding,
  });

  const afterCode = clientReplacement;

  const migrationGuide = buildMigrationGuide({ finding, envRename, proxyEndpoint });
  const explanation = buildExplanation(finding, envRename, proxyEndpoint);
  const patch = buildPatch({
    finding,
    beforeCode,
    afterCode,
    envRename,
  });

  return {
    beforeCode,
    afterCode,
    explanation,
    migrationGuide,
    serverImplementation,
    clientReplacement,
    envRename,
    patch,
  };
}

function sanitizeName(name?: string): string | undefined {
  if (!name) return undefined;
  const cleaned = name.replace(/[^A-Z0-9_]/gi, "").toUpperCase();
  return cleaned || undefined;
}

function deriveNameFromType(type: Finding["type"]): string {
  switch (type) {
    case "OPENAI_KEY":
      return "OPENAI_API_KEY";
    case "GEMINI_KEY":
      return "GEMINI_API_KEY";
    case "ANTHROPIC_KEY":
      return "ANTHROPIC_API_KEY";
    case "GITHUB_TOKEN":
      return "GITHUB_TOKEN";
    case "AWS_ACCESS_KEY":
      return "AWS_ACCESS_KEY_ID";
    case "MONGO_URI":
      return "MONGODB_URI";
    case "POSTGRES_URI":
      return "DATABASE_URL";
    case "MYSQL_URI":
      return "DATABASE_URL";
    case "JWT":
      return "JWT_SECRET";
    case "PRIVATE_KEY":
      return "PRIVATE_KEY";
    case "GENERIC_SECRET":
      return "APP_SECRET";
    case "GENERIC_TOKEN":
      return "APP_TOKEN";
    case "GENERIC_PASSWORD":
      return "APP_PASSWORD";
    case "ENV_DECLARATION":
    default:
      return "APP_SECRET";
  }
}

function stripClientPrefix(name: string): string {
  for (const prefix of CLIENT_EXPOSED_PREFIXES) {
    if (name.startsWith(prefix)) {
      return name.slice(prefix.length);
    }
  }
  return name;
}

function deriveEndpoint(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/_api_key$/, "")
    .replace(/_secret$/, "")
    .replace(/_token$/, "")
    .replace(/_/g, "-");
  if (!slug) return "/api/secret";
  if (slug.includes("openai") || slug.includes("anthropic") || slug.includes("gemini")) {
    return "/api/chat";
  }
  if (slug.includes("github")) return "/api/github";
  if (slug.includes("aws")) return "/api/aws";
  if (slug.includes("mongo") || slug.includes("postgres") || slug.includes("mysql") || slug.includes("database")) {
    return "/api/data";
  }
  return `/api/${slug}`;
}

interface RenderInput {
  endpoint: string;
  envName: string;
  finding: Finding;
}

function renderServerHandler({ endpoint, envName, finding }: RenderInput): string {
  return [
    "// server/src/routes/" + endpoint.replace("/api/", "") + ".route.ts",
    `import { Router } from "express";`,
    "",
    `const router = Router();`,
    "",
    `router.post("${endpoint}", async (req, res) => {`,
    `  const apiKey = process.env.${envName};`,
    `  if (!apiKey) {`,
    `    return res.status(500).json({ error: "${envName} is not configured" });`,
    `  }`,
    `  // TODO: forward req.body to the upstream provider using apiKey,`,
    `  // then return the upstream response. Never expose apiKey to the client.`,
    `  // Original detection: ${finding.filePath}:${finding.lineNumber}`,
    `  return res.status(501).json({ error: "Proxy not implemented yet" });`,
    `});`,
    "",
    `export default router;`,
  ].join("\n");
}

function renderClientReplacement({
  endpoint,
  finding,
}: Omit<RenderInput, "envName">): string {
  return [
    `// Safe client-side replacement for ${finding.filePath}:${finding.lineNumber}`,
    `export async function callSecureEndpoint(payload: unknown): Promise<unknown> {`,
    `  const response = await fetch("${endpoint}", {`,
    `    method: "POST",`,
    `    headers: { "Content-Type": "application/json" },`,
    `    body: JSON.stringify(payload),`,
    `  });`,
    `  if (!response.ok) {`,
    `    throw new Error("Secure endpoint failed: " + response.status);`,
    `  }`,
    `  return response.json();`,
    `}`,
  ].join("\n");
}

function buildMigrationGuide({
  finding,
  envRename,
  proxyEndpoint,
}: {
  finding: Finding;
  envRename: { from: string; to: string } | null;
  proxyEndpoint: string;
}): string[] {
  const guide: string[] = [];
  guide.push(`Rotate the leaked credential immediately.`);
  if (envRename) {
    guide.push(
      `Rename the environment variable from ${envRename.from} to ${envRename.to} in your .env (server-only, no VITE_/NEXT_PUBLIC_ prefix).`,
    );
  } else {
    guide.push(`Keep the secret only in server-side .env. Never prefix it with VITE_ / NEXT_PUBLIC_.`);
  }
  guide.push(
    `Add a backend proxy route at ${proxyEndpoint} that uses the secret server-side.`,
  );
  guide.push(
    `Remove the original reference at ${finding.filePath}:${finding.lineNumber} and call the proxy from your client services layer.`,
  );
  guide.push(
    `Add the new env variable to your deployment platform (Vercel / Fly / Render / etc.) as a secret.`,
  );
  guide.push(
    `Run the .env Guardian scan again to confirm the finding is resolved.`,
  );
  return guide;
}

function buildExplanation(
  finding: Finding,
  envRename: { from: string; to: string } | null,
  proxyEndpoint: string,
): string {
  const intro = finding.hardcoded
    ? `A hardcoded secret was detected at ${finding.filePath}:${finding.lineNumber}. Hardcoded credentials end up in your git history forever.`
    : `An environment variable that may carry a secret is reachable at ${finding.filePath}:${finding.lineNumber}.`;
  const exposureNote = finding.clientExposed
    ? ` Because the variable is bundled into the client (its name starts with a public prefix or it is read via import.meta.env), the secret leaks to every visitor. We must move the call behind a server-side proxy at ${proxyEndpoint}.`
    : ` We recommend wrapping all access in a service layer so the secret never crosses the network boundary.`;
  const renameNote = envRename
    ? ` The variable will be renamed from ${envRename.from} to ${envRename.to} so it is no longer auto-exposed by the bundler.`
    : "";
  return `${intro}${exposureNote}${renameNote}`;
}
