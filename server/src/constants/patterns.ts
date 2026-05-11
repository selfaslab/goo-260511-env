import type { RiskLevel, SecretType } from "../types/index.js";

export interface PatternDefinition {
  type: SecretType;
  label: string;
  regex: RegExp;
  baseRisk: RiskLevel;
  description: string;
}

/**
 * Provider-specific secret patterns. Each regex uses the global flag so we can
 * iterate every match per line. Add new providers here.
 */
export const SECRET_PATTERNS: PatternDefinition[] = [
  // ── AI providers ────────────────────────────────────────────────────────
  {
    type: "OPENAI_KEY",
    label: "OpenAI API key",
    regex: /sk-(?:proj-)?[A-Za-z0-9_\-]{20,}/g,
    baseRisk: "CRITICAL",
    description: "OpenAI secret key. Grants full API access to your account.",
  },
  {
    type: "GEMINI_KEY",
    label: "Google API key",
    regex: /AIza[0-9A-Za-z\-_]{35}/g,
    baseRisk: "CRITICAL",
    description: "Google API key (Gemini / Maps / Firebase).",
  },
  {
    type: "ANTHROPIC_KEY",
    label: "Anthropic API key",
    regex: /sk-ant-[A-Za-z0-9\-_]+/g,
    baseRisk: "CRITICAL",
    description: "Anthropic Claude API key.",
  },

  // ── Source control ──────────────────────────────────────────────────────
  {
    type: "GITHUB_TOKEN",
    label: "GitHub PAT",
    regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,40}\b/g,
    baseRisk: "CRITICAL",
    description: "GitHub personal access / OAuth / installation token.",
  },

  // ── Cloud / infra ───────────────────────────────────────────────────────
  {
    type: "AWS_ACCESS_KEY",
    label: "AWS access key id",
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
    baseRisk: "CRITICAL",
    description: "AWS IAM access key id.",
  },
  {
    type: "GOOGLE_SERVICE_ACCOUNT",
    label: "GCP service account JSON fragment",
    regex: /"type"\s*:\s*"service_account"/g,
    baseRisk: "CRITICAL",
    description: "Embedded Google Cloud service-account JSON.",
  },

  // ── Payments / SaaS ─────────────────────────────────────────────────────
  {
    type: "STRIPE_KEY",
    label: "Stripe secret key",
    regex: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{24,}\b/g,
    baseRisk: "CRITICAL",
    description: "Stripe live/test secret or restricted key.",
  },
  {
    type: "FIREBASE_KEY",
    label: "Firebase server key",
    regex: /AAAA[A-Za-z0-9_-]{7}:[A-Za-z0-9_-]{140,}/g,
    baseRisk: "CRITICAL",
    description: "Firebase Cloud Messaging server key.",
  },
  {
    type: "SUPABASE_KEY",
    label: "Supabase service-role JWT",
    regex: /eyJ[A-Za-z0-9_\-]{8,}\.eyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}/g,
    baseRisk: "HIGH",
    description: "JWT-shaped key (Supabase service-role / generic JWT).",
  },
  {
    type: "DISCORD_TOKEN",
    label: "Discord bot token",
    regex: /\b[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27,}\b/g,
    baseRisk: "CRITICAL",
    description: "Discord bot token.",
  },
  {
    type: "SLACK_TOKEN",
    label: "Slack token",
    regex: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g,
    baseRisk: "CRITICAL",
    description: "Slack OAuth / bot / user / app token.",
  },
  {
    type: "TELEGRAM_BOT_TOKEN",
    label: "Telegram bot token",
    regex: /\b\d{8,10}:[A-Za-z0-9_\-]{35}\b/g,
    baseRisk: "HIGH",
    description: "Telegram bot API token.",
  },
  {
    type: "TWILIO_KEY",
    label: "Twilio API key",
    regex: /\bSK[0-9a-fA-F]{32}\b/g,
    baseRisk: "CRITICAL",
    description: "Twilio API key SID.",
  },

  // ── Tokens / connection strings ─────────────────────────────────────────
  {
    type: "BEARER_TOKEN",
    label: "Hardcoded Bearer token",
    regex: /Authorization\s*:\s*['"`]?Bearer\s+[A-Za-z0-9._\-]{16,}/gi,
    baseRisk: "HIGH",
    description: "Hardcoded `Authorization: Bearer …` header.",
  },
  {
    type: "MONGO_URI",
    label: "MongoDB connection URI",
    regex: /mongodb(\+srv)?:\/\/[^\s"'`<>]+/g,
    baseRisk: "HIGH",
    description: "MongoDB connection string (often contains credentials).",
  },
  {
    type: "POSTGRES_URI",
    label: "Postgres connection URI",
    regex: /postgres(?:ql)?:\/\/[^\s"'`<>]+/g,
    baseRisk: "HIGH",
    description: "Postgres connection string (often contains credentials).",
  },
  {
    type: "MYSQL_URI",
    label: "MySQL connection URI",
    regex: /mysql:\/\/[^\s"'`<>]+/g,
    baseRisk: "HIGH",
    description: "MySQL connection string (often contains credentials).",
  },

  // ── Crypto material ─────────────────────────────────────────────────────
  {
    type: "PRIVATE_KEY",
    label: "PEM private key",
    regex: /-----BEGIN (?:RSA |EC |DSA |PGP )?PRIVATE KEY-----/g,
    baseRisk: "CRITICAL",
    description: "Embedded PEM private key block.",
  },
  {
    type: "SSH_PRIVATE_KEY",
    label: "OpenSSH private key",
    regex: /-----BEGIN OPENSSH PRIVATE KEY-----/g,
    baseRisk: "CRITICAL",
    description: "Embedded OpenSSH private key block.",
  },

  // ── Generic JWT (must come AFTER more specific patterns) ────────────────
  {
    type: "JWT",
    label: "JSON Web Token",
    regex: /eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g,
    baseRisk: "HIGH",
    description: "Looks like a signed JWT.",
  },
];

/** Generic suspicious identifier substrings (used for KEY=value style hits). */
export const GENERIC_KEYWORDS: { keyword: RegExp; type: SecretType }[] = [
  { keyword: /(?:^|_)SECRET(?:_|$)/i, type: "GENERIC_SECRET" },
  { keyword: /(?:^|_)TOKEN(?:_|$)/i, type: "GENERIC_TOKEN" },
  { keyword: /(?:^|_)PASSWORD(?:_|$)/i, type: "GENERIC_PASSWORD" },
  { keyword: /(?:^|_)API[_-]?KEY(?:_|$)/i, type: "GENERIC_TOKEN" },
  { keyword: /PRIVATE_KEY/i, type: "PRIVATE_KEY" },
];

/** File extensions we open for scanning. */
export const SUPPORTED_EXTENSIONS = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".env.staging",
  ".env.test",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".yml",
  ".yaml",
  ".toml",
  ".tf",
  ".tfvars",
  ".pem",
  ".cfg",
  ".ini",
  ".conf",
  ".py",
];

/** Special filenames (no extension or non-standard) we always open. */
export const SUPPORTED_FILENAMES = new Set<string>([
  "Dockerfile",
  "dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  "vercel.json",
  "netlify.toml",
  "Procfile",
  "fly.toml",
  ".npmrc",
  ".dockerignore",
  ".gitignore",
  ".env.example",
  ".env.sample",
  "requirements.txt",
  "Pipfile",
  "Pipfile.lock",
]);

export const EXCLUDED_FOLDERS = [
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".git",
  ".next",
  ".turbo",
  ".cache",
  ".vercel",
  ".husky",
  ".pnpm-store",
  ".yarn",
  "__pycache__",
  ".venv",
  "venv",
];

/** Variable name prefixes that are bundled into client-side code. */
export const CLIENT_EXPOSED_PREFIXES = [
  "VITE_",
  "NEXT_PUBLIC_",
  "REACT_APP_",
  "PUBLIC_",
  "EXPO_PUBLIC_",
  "GATSBY_",
];
