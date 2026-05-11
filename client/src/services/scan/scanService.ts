import { apiRequest, BASE_URL } from "../api/client";
import type {
  Finding,
  PatchExport,
  RefactorResult,
  ReportFormat,
  ScanResult,
} from "@/types";

export async function scanProject(projectPath: string): Promise<ScanResult> {
  return apiRequest<ScanResult>("/scan", {
    method: "POST",
    body: JSON.stringify({ projectPath }),
  });
}

export async function scanGithubRepo(repoUrl: string): Promise<ScanResult> {
  return apiRequest<ScanResult>("/scan/github", {
    method: "POST",
    body: JSON.stringify({ repoUrl }),
  });
}

export async function fetchReport(projectPath?: string): Promise<ScanResult> {
  const search = projectPath
    ? `?projectPath=${encodeURIComponent(projectPath)}`
    : "";
  return apiRequest<ScanResult>(`/report${search}`);
}

export async function generateRefactor(
  finding: Finding,
  currentCode?: string,
): Promise<RefactorResult> {
  return apiRequest<RefactorResult>("/refactor", {
    method: "POST",
    body: JSON.stringify({ finding, currentCode }),
  });
}

export async function exportPatch(projectPath?: string): Promise<PatchExport> {
  return apiRequest<PatchExport>("/refactor/export", {
    method: "POST",
    body: JSON.stringify({ projectPath }),
  });
}

/**
 * Download the report as a binary blob. We bypass apiRequest because we
 * want the raw text for non-JSON formats and to keep this fully local.
 */
export async function downloadReport(
  format: ReportFormat,
  projectPath?: string,
): Promise<{ filename: string; body: string; contentType: string }> {
  const params = new URLSearchParams({ format, download: "true" });
  if (projectPath) params.set("projectPath", projectPath);
  const response = await fetch(`${BASE_URL}/report/export?${params.toString()}`);
  if (!response.ok) {
    let message = `Export failed (${response.status})`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  const body = await response.text();
  const contentType = response.headers.get("content-type") ?? "text/plain";
  const disposition = response.headers.get("content-disposition") ?? "";
  const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
  const fallback =
    format === "markdown"
      ? "guardian-report.md"
      : format === "txt"
        ? "guardian-report.txt"
        : "guardian-report.json";
  return {
    filename: filenameMatch ? filenameMatch[1] : fallback,
    body,
    contentType,
  };
}
