import type {
  DependencyNode,
  Finding,
  FrameworkInfo,
  Grade,
  Recommendation,
  RiskLevel,
  RiskyConfig,
  ScoreAdjustment,
  ScoreBreakdown,
} from "../types/index.js";

const PENALTY_PER_FINDING: Record<RiskLevel, number> = {
  LOW: 2,
  MEDIUM: 5,
  HIGH: 10,
  CRITICAL: 20,
};

const EMPTY_BREAKDOWN: Record<RiskLevel, number> = {
  LOW: 0,
  MEDIUM: 0,
  HIGH: 0,
  CRITICAL: 0,
};

interface RiskEngineInput {
  findings: Finding[];
  dependencies: DependencyNode[];
  riskyConfigs: RiskyConfig[];
  hasGitignore: boolean;
  hasEnvExample: boolean;
  usesSecretManager: boolean;
  noClientExposure: boolean;
}

export interface RiskEngineOutput {
  findings: Finding[];
  riskBreakdown: Record<RiskLevel, number>;
  score: ScoreBreakdown;
  summary: string;
  recommendations: Recommendation[];
}

/**
 * Cross-reference findings against the dependency graph (variables read in the
 * client are promoted), then compute a graded score with explicit penalty +
 * bonus breakdown so the UI can display "why" the score is what it is.
 */
export function applyRiskEngine(input: RiskEngineInput): RiskEngineOutput {
  const depByVar = new Map(input.dependencies.map((d) => [d.variableName, d]));

  const enrichedFindings = input.findings.map<Finding>((finding) => {
    const next = { ...finding };
    const dep = finding.variableName ? depByVar.get(finding.variableName) : undefined;
    if (dep?.clientExposed) next.clientExposed = true;
    next.risk = computeRisk(next, dep);
    return next;
  });

  const breakdown: Record<RiskLevel, number> = { ...EMPTY_BREAKDOWN };
  for (const finding of enrichedFindings) breakdown[finding.risk] += 1;
  for (const cfg of input.riskyConfigs) breakdown[cfg.risk] += 1;

  const penalties: ScoreAdjustment[] = [];
  for (const level of ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as RiskLevel[]) {
    if (breakdown[level] === 0) continue;
    penalties.push({
      reason: `${breakdown[level]} ${level.toLowerCase()} finding${breakdown[level] === 1 ? "" : "s"}`,
      amount: breakdown[level] * PENALTY_PER_FINDING[level],
    });
  }

  const bonuses: ScoreAdjustment[] = [];
  if (input.noClientExposure) bonuses.push({ reason: "No client-bundled secrets", amount: 5 });
  if (input.hasGitignore) bonuses.push({ reason: ".gitignore present", amount: 3 });
  if (input.hasEnvExample) bonuses.push({ reason: ".env.example present", amount: 5 });
  if (input.usesSecretManager) bonuses.push({ reason: "Secret manager dependency detected", amount: 10 });

  const totalPenalty = penalties.reduce((acc, p) => acc + p.amount, 0);
  const totalBonus = bonuses.reduce((acc, b) => acc + b.amount, 0);
  const finalScore = clamp(100 - totalPenalty + totalBonus, 0, 100);
  const grade = scoreToGrade(finalScore);

  const score: ScoreBreakdown = {
    base: 100,
    penalties,
    bonuses,
    finalScore,
    grade,
  };

  const summary = buildSummary(breakdown, score, input.riskyConfigs.length);
  const recommendations = buildRecommendations({
    breakdown,
    findings: enrichedFindings,
    riskyConfigs: input.riskyConfigs,
    hasGitignore: input.hasGitignore,
    hasEnvExample: input.hasEnvExample,
    usesSecretManager: input.usesSecretManager,
  });

  return { findings: enrichedFindings, riskBreakdown: breakdown, score, summary, recommendations };
}

function computeRisk(finding: Finding, dep?: DependencyNode): RiskLevel {
  if (finding.hardcoded) return "CRITICAL";
  if (finding.clientExposed) return "CRITICAL";
  if (dep?.clientExposed) return "HIGH";
  if (dep && dep.references.length > 0) return "MEDIUM";
  if (finding.type === "ENV_DECLARATION") return "LOW";
  return finding.risk;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function scoreToGrade(score: number): Grade {
  if (score >= 95) return "A+";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function buildSummary(
  breakdown: Record<RiskLevel, number>,
  score: ScoreBreakdown,
  riskyConfigCount: number,
): string {
  const total = Object.values(breakdown).reduce((acc, value) => acc + value, 0);
  if (total === 0 && riskyConfigCount === 0) {
    return `No secrets or risky configurations detected. Score ${score.finalScore}/100 (${score.grade}).`;
  }
  const parts: string[] = [];
  parts.push(`Score ${score.finalScore}/100 (${score.grade}).`);
  parts.push(
    `${breakdown.CRITICAL} critical, ${breakdown.HIGH} high, ${breakdown.MEDIUM} medium, ${breakdown.LOW} low.`,
  );
  if (riskyConfigCount > 0) parts.push(`${riskyConfigCount} risky config issue${riskyConfigCount === 1 ? "" : "s"}.`);
  if (breakdown.CRITICAL > 0) {
    parts.push("Critical findings require immediate rotation and a server-side proxy migration.");
  } else if (breakdown.HIGH > 0) {
    parts.push("Move client-exposed secrets behind a backend route.");
  } else {
    parts.push("Keep secrets in .env, never in source.");
  }
  return parts.join(" ");
}

interface RecommendationInput {
  breakdown: Record<RiskLevel, number>;
  findings: Finding[];
  riskyConfigs: RiskyConfig[];
  hasGitignore: boolean;
  hasEnvExample: boolean;
  usesSecretManager: boolean;
}

function buildRecommendations(input: RecommendationInput): Recommendation[] {
  const recs: Recommendation[] = [];
  if (input.findings.some((f) => f.clientExposed)) {
    recs.push({
      id: "move-server-side",
      title: "Move client-exposed API keys to a server-side proxy",
      details:
        "Variables prefixed with VITE_, NEXT_PUBLIC_, REACT_APP_, … are bundled into the browser. Replace direct client calls with a thin Express / Edge Function proxy that injects the secret server-side.",
      priority: "CRITICAL",
    });
  }
  if (input.findings.some((f) => f.hardcoded)) {
    recs.push({
      id: "remove-hardcoded",
      title: "Remove hardcoded secrets from source files",
      details:
        "Hardcoded keys end up in git history forever. Rotate the credential, then load it from process.env (server) only.",
      priority: "CRITICAL",
    });
  }
  if (!input.hasGitignore) {
    recs.push({
      id: "add-gitignore",
      title: "Add a .gitignore",
      details: "At minimum ignore node_modules/, dist/, .env, .env.* — otherwise secrets get committed by accident.",
      priority: "HIGH",
    });
  }
  if (!input.hasEnvExample) {
    recs.push({
      id: "add-env-example",
      title: "Provide a .env.example",
      details: "Document the required environment variables (without values). Helps contributors and CI environments stay aligned.",
      priority: "MEDIUM",
    });
  }
  if (!input.usesSecretManager && (input.breakdown.HIGH > 0 || input.breakdown.CRITICAL > 0)) {
    recs.push({
      id: "use-secret-manager",
      title: "Adopt a secret manager",
      details:
        "Once the project has any production secrets, move them out of .env files and into AWS Secrets Manager, Google Secret Manager, Doppler, Vault, or Vercel Edge Config.",
      priority: "MEDIUM",
    });
  }
  if (input.riskyConfigs.length > 0) {
    recs.push({
      id: "review-configs",
      title: "Review risky configuration files",
      details: `Inspect the ${input.riskyConfigs.length} flagged configuration entries — they often hide hardcoded credentials in CI workflows or Terraform.`,
      priority: "HIGH",
    });
  }
  if (recs.length === 0) {
    recs.push({
      id: "stay-vigilant",
      title: "Stay vigilant",
      details: "Re-run Guardian on every PR. Rotate API keys at least every 90 days.",
      priority: "LOW",
    });
  }
  return recs;
}

/** Helper used by scanService to short-circuit empty projects. */
export function emptyResult(projectPath: string) {
  const score: ScoreBreakdown = {
    base: 100,
    penalties: [],
    bonuses: [],
    finalScore: 100,
    grade: "A+",
  };
  return {
    findings: [] as Finding[],
    totalFiles: 0,
    scannedFiles: 0,
    severityScore: 100,
    riskBreakdown: { ...EMPTY_BREAKDOWN },
    dependencies: [] as DependencyNode[],
    summary: "No supported source files were found in the selected folder.",
    scannedAt: new Date().toISOString(),
    projectPath,
    repository: {
      source: "local" as const,
      projectPath,
    },
    frameworks: [] as FrameworkInfo[],
    score,
    recommendations: [] as Recommendation[],
    riskyConfigs: [] as RiskyConfig[],
  };
}
