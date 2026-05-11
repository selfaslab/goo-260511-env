export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SecretType =
  | "OPENAI_KEY"
  | "GEMINI_KEY"
  | "ANTHROPIC_KEY"
  | "GITHUB_TOKEN"
  | "AWS_ACCESS_KEY"
  | "JWT"
  | "MONGO_URI"
  | "POSTGRES_URI"
  | "MYSQL_URI"
  | "PRIVATE_KEY"
  | "SSH_PRIVATE_KEY"
  | "STRIPE_KEY"
  | "FIREBASE_KEY"
  | "SUPABASE_KEY"
  | "DISCORD_TOKEN"
  | "SLACK_TOKEN"
  | "TELEGRAM_BOT_TOKEN"
  | "TWILIO_KEY"
  | "GOOGLE_SERVICE_ACCOUNT"
  | "BEARER_TOKEN"
  | "GENERIC_SECRET"
  | "GENERIC_TOKEN"
  | "GENERIC_PASSWORD"
  | "ENV_DECLARATION";

export type FrameworkId =
  | "react"
  | "vite"
  | "nextjs"
  | "remix"
  | "node"
  | "express"
  | "python"
  | "django"
  | "flask"
  | "firebase"
  | "supabase"
  | "docker"
  | "github-actions"
  | "terraform"
  | "vercel"
  | "netlify";

export type Grade = "A+" | "A" | "B" | "C" | "D" | "F";

export type ScanSource = "local" | "github";

export type ReportFormat = "json" | "markdown" | "txt";

export interface Finding {
  id: string;
  type: SecretType;
  risk: RiskLevel;
  valueMasked: string;
  filePath: string;
  lineNumber: number;
  snippet?: string;
  variableName?: string;
  hardcoded: boolean;
  clientExposed: boolean;
  category?: "secret" | "config" | "env";
}

export interface UsageReference {
  filePath: string;
  lineNumber: number;
  context: "client" | "server" | "unknown";
  accessor: string;
}

export interface DependencyNode {
  variableName: string;
  references: UsageReference[];
  clientExposed: boolean;
}

export interface FrameworkInfo {
  id: FrameworkId;
  label: string;
  evidence: string[];
}

export interface RepositoryInfo {
  source: ScanSource;
  projectPath: string;
  repoUrl?: string;
  owner?: string;
  repo?: string;
  branch?: string;
  commitSha?: string;
  cloneSizeMb?: number;
  fileCount?: number;
}

export interface ScoreAdjustment {
  reason: string;
  amount: number;
  detail?: string;
}

export interface ScoreBreakdown {
  base: number;
  penalties: ScoreAdjustment[];
  bonuses: ScoreAdjustment[];
  finalScore: number;
  grade: Grade;
}

export interface Recommendation {
  id: string;
  title: string;
  details: string;
  priority: RiskLevel;
}

export interface RiskyConfig {
  filePath: string;
  reason: string;
  risk: RiskLevel;
  lineNumber?: number;
}

export interface ScanResult {
  findings: Finding[];
  totalFiles: number;
  scannedFiles: number;
  severityScore: number;
  riskBreakdown: Record<RiskLevel, number>;
  dependencies: DependencyNode[];
  summary: string;
  scannedAt: string;
  projectPath: string;
  repository: RepositoryInfo;
  frameworks: FrameworkInfo[];
  score: ScoreBreakdown;
  recommendations: Recommendation[];
  riskyConfigs: RiskyConfig[];
}

export interface PatchOperation {
  file: string;
  find: string;
  replace: string;
}

export interface RefactorResult {
  beforeCode: string;
  afterCode: string;
  explanation: string;
  migrationGuide: string[];
  serverImplementation: string;
  clientReplacement: string;
  envRename: { from: string; to: string } | null;
  patch: PatchOperation[];
}

export interface PatchExport {
  generatedAt: string;
  projectPath: string;
  replace: PatchOperation[];
}
