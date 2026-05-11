import type { ReportFormat, ScanResult } from "../types/index.js";

/**
 * Render a scan result as JSON / Markdown / plain TXT. Used by the
 * `/api/report/export` route. We never include raw secret values — the
 * scanner has already masked them upstream.
 */
export function renderReport(result: ScanResult, format: ReportFormat): {
  body: string;
  filename: string;
  contentType: string;
} {
  switch (format) {
    case "json":
      return {
        body: JSON.stringify(buildExportShape(result), null, 2),
        filename: "guardian-report.json",
        contentType: "application/json; charset=utf-8",
      };
    case "markdown":
      return {
        body: renderMarkdown(result),
        filename: "guardian-report.md",
        contentType: "text/markdown; charset=utf-8",
      };
    case "txt":
      return {
        body: renderText(result),
        filename: "guardian-report.txt",
        contentType: "text/plain; charset=utf-8",
      };
    default: {
      const exhaustive: never = format;
      throw new Error(`Unsupported report format: ${String(exhaustive)}`);
    }
  }
}

function buildExportShape(result: ScanResult): unknown {
  return {
    tool: ".env Guardian",
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    repository: result.repository,
    score: result.score,
    summary: result.summary,
    riskBreakdown: result.riskBreakdown,
    frameworks: result.frameworks,
    findings: result.findings,
    riskyConfigs: result.riskyConfigs,
    dependencies: result.dependencies,
    recommendations: result.recommendations,
  };
}

function renderMarkdown(r: ScanResult): string {
  const lines: string[] = [];
  lines.push(`# .env Guardian — security report`);
  lines.push("");
  lines.push(`> Generated ${new Date().toISOString()}`);
  lines.push("");
  lines.push(`**Repository**: ${formatRepo(r)}`);
  if (r.repository.branch) lines.push(`**Branch**: \`${r.repository.branch}\``);
  if (r.repository.commitSha) lines.push(`**Commit**: \`${r.repository.commitSha}\``);
  lines.push(`**Files scanned**: ${r.scannedFiles} / ${r.totalFiles}`);
  if (r.frameworks.length > 0) {
    lines.push(`**Frameworks**: ${r.frameworks.map((f) => f.label).join(", ")}`);
  }
  lines.push("");
  lines.push(`## Security score`);
  lines.push("");
  lines.push(`- **${r.score.finalScore}/100** (Grade ${r.score.grade})`);
  if (r.score.penalties.length > 0) {
    lines.push(`- Penalties:`);
    for (const p of r.score.penalties) lines.push(`  - −${p.amount} — ${p.reason}`);
  }
  if (r.score.bonuses.length > 0) {
    lines.push(`- Bonuses:`);
    for (const b of r.score.bonuses) lines.push(`  - +${b.amount} — ${b.reason}`);
  }
  lines.push("");
  lines.push(`## Summary`);
  lines.push("");
  lines.push(r.summary);
  lines.push("");
  lines.push(`## Risk breakdown`);
  lines.push("");
  lines.push(`| Severity | Count |`);
  lines.push(`| --- | --- |`);
  lines.push(`| CRITICAL | ${r.riskBreakdown.CRITICAL} |`);
  lines.push(`| HIGH | ${r.riskBreakdown.HIGH} |`);
  lines.push(`| MEDIUM | ${r.riskBreakdown.MEDIUM} |`);
  lines.push(`| LOW | ${r.riskBreakdown.LOW} |`);
  lines.push("");

  if (r.findings.length > 0) {
    lines.push(`## Findings (${r.findings.length})`);
    lines.push("");
    lines.push(`| Risk | Type | File:Line | Variable | Masked value |`);
    lines.push(`| --- | --- | --- | --- | --- |`);
    for (const f of r.findings) {
      lines.push(
        `| ${f.risk} | ${f.type} | \`${f.filePath}:${f.lineNumber}\` | ${f.variableName ?? ""} | \`${f.valueMasked}\` |`,
      );
    }
    lines.push("");
  }

  if (r.riskyConfigs.length > 0) {
    lines.push(`## Risky configurations (${r.riskyConfigs.length})`);
    lines.push("");
    for (const c of r.riskyConfigs) {
      lines.push(`- **${c.risk}** — \`${c.filePath}${c.lineNumber ? `:${c.lineNumber}` : ""}\` — ${c.reason}`);
    }
    lines.push("");
  }

  if (r.frameworks.length > 0) {
    lines.push(`## Framework detection`);
    lines.push("");
    for (const f of r.frameworks) {
      lines.push(`- **${f.label}** — evidence: ${f.evidence.map((e) => `\`${e}\``).join(", ")}`);
    }
    lines.push("");
  }

  if (r.recommendations.length > 0) {
    lines.push(`## Recommendations`);
    lines.push("");
    for (const rec of r.recommendations) {
      lines.push(`### ${rec.title} _(priority: ${rec.priority})_`);
      lines.push("");
      lines.push(rec.details);
      lines.push("");
    }
  }

  return lines.join("\n");
}

function renderText(r: ScanResult): string {
  const lines: string[] = [];
  lines.push(".env Guardian — security report");
  lines.push("=".repeat(40));
  lines.push(`Generated      : ${new Date().toISOString()}`);
  lines.push(`Repository     : ${formatRepo(r)}`);
  if (r.repository.branch) lines.push(`Branch         : ${r.repository.branch}`);
  if (r.repository.commitSha) lines.push(`Commit         : ${r.repository.commitSha}`);
  lines.push(`Files scanned  : ${r.scannedFiles} / ${r.totalFiles}`);
  if (r.frameworks.length > 0) {
    lines.push(`Frameworks     : ${r.frameworks.map((f) => f.label).join(", ")}`);
  }
  lines.push("");
  lines.push(`Score          : ${r.score.finalScore}/100 (${r.score.grade})`);
  lines.push(
    `Risk           : CRITICAL=${r.riskBreakdown.CRITICAL}  HIGH=${r.riskBreakdown.HIGH}  MEDIUM=${r.riskBreakdown.MEDIUM}  LOW=${r.riskBreakdown.LOW}`,
  );
  lines.push("");
  lines.push("Summary:");
  lines.push("  " + r.summary);
  lines.push("");
  if (r.findings.length > 0) {
    lines.push(`Findings (${r.findings.length}):`);
    for (const f of r.findings) {
      lines.push(`  [${f.risk.padEnd(8)}] ${f.type.padEnd(20)} ${f.filePath}:${f.lineNumber}  ${f.valueMasked}`);
    }
    lines.push("");
  }
  if (r.riskyConfigs.length > 0) {
    lines.push(`Risky configs (${r.riskyConfigs.length}):`);
    for (const c of r.riskyConfigs) {
      lines.push(`  [${c.risk.padEnd(8)}] ${c.filePath}${c.lineNumber ? `:${c.lineNumber}` : ""}  ${c.reason}`);
    }
    lines.push("");
  }
  if (r.recommendations.length > 0) {
    lines.push("Recommendations:");
    for (const rec of r.recommendations) {
      lines.push(`  - [${rec.priority}] ${rec.title}`);
      lines.push(`      ${rec.details}`);
    }
  }
  return lines.join("\n");
}

function formatRepo(r: ScanResult): string {
  if (r.repository.source === "github" && r.repository.repoUrl) {
    return r.repository.repoUrl;
  }
  return r.repository.projectPath;
}
