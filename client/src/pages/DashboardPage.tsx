import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Download, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { SecurityGradeCard } from "@/components/dashboard/SecurityGradeCard";
import { FindingSummaryCards } from "@/components/dashboard/FindingSummaryCards";
import { RepositoryInfoCard } from "@/components/dashboard/RepositoryInfoCard";
import { FrameworkBadges } from "@/components/dashboard/FrameworkBadges";
import { RiskHeatmap } from "@/components/dashboard/RiskHeatmap";
import { ScanLauncher } from "@/components/scanner/ScanLauncher";
import { FindingsTable } from "@/components/report/FindingsTable";
import { DependencyTree } from "@/components/report/DependencyTree";
import { RecommendationsList } from "@/components/report/RecommendationsList";
import { RiskyConfigsList } from "@/components/report/RiskyConfigsList";
import { ExportMenu } from "@/components/report/ExportMenu";
import { RefactorPreview } from "@/components/diff/RefactorPreview";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useGuardianStore } from "@/store/guardianStore";
import { useScanRunner } from "@/hooks/useScanRunner";
import { usePatchExport } from "@/hooks/usePatchExport";

export function DashboardPage(): JSX.Element {
  const scan = useGuardianStore((s) => s.scan);
  const error = useGuardianStore((s) => s.error);
  const selectedFinding = useGuardianStore((s) => s.selectedFinding);
  const setSelectedFinding = useGuardianStore((s) => s.setSelectedFinding);

  const { scanLocal, scanGithub, rescan, isScanning } = useScanRunner();
  const { exportNow, isExporting } = usePatchExport();

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6">
        <section className="glass-card p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-foreground">
                Run a security scan
              </h2>
              <p className="text-xs text-muted">
                Choose a local folder or paste a public GitHub URL. Everything
                runs on your machine — no code or secret leaves your computer.
              </p>
            </div>
            <ScanLauncher
              onScanLocal={scanLocal}
              onScanGithub={scanGithub}
              isScanning={isScanning}
            />
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}
        </section>

        <AnimatePresence mode="wait">
          {!scan && !isScanning && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <EmptyState
                icon={<ShieldCheck className="h-6 w-6" />}
                title="Ready to scan"
                description="Pick a folder or paste a GitHub URL to discover exposed secrets, trace usage, and generate a secure refactor plan."
                className="py-16"
              />
            </motion.div>
          )}

          {isScanning && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6 lg:grid-cols-3"
            >
              <Skeleton className="h-44 lg:col-span-1" />
              <Skeleton className="h-44 lg:col-span-2" />
              <Skeleton className="h-72 lg:col-span-2" />
              <Skeleton className="h-72 lg:col-span-1" />
            </motion.div>
          )}

          {scan && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex flex-col gap-6"
            >
              <div className="grid gap-6 lg:grid-cols-3">
                <RepositoryInfoCard
                  repository={scan.repository}
                  totalFiles={scan.totalFiles}
                  scannedAt={scan.scannedAt}
                />
                <div className="lg:col-span-2">
                  <SecurityGradeCard
                    score={scan.score}
                    summary={scan.summary}
                    scannedFiles={scan.scannedFiles}
                    totalFiles={scan.totalFiles}
                  />
                </div>
              </div>

              <FindingSummaryCards
                breakdown={scan.riskBreakdown}
                riskyConfigCount={scan.riskyConfigs.length}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface/40 px-4 py-3 text-xs text-muted">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={rescan} disabled={isScanning}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Rescan
                  </Button>
                  <span className="text-muted">
                    {scan.findings.length} finding{scan.findings.length === 1 ? "" : "s"} ·{" "}
                    {scan.dependencies.length} env var{scan.dependencies.length === 1 ? "" : "s"}{" "}
                    traced
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={exportNow}
                    disabled={isExporting || scan.findings.length === 0}
                  >
                    {isExporting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    guardian.patch.json
                  </Button>
                  <ExportMenu />
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <FrameworkBadges frameworks={scan.frameworks} />
                <div className="lg:col-span-2">
                  <RiskHeatmap findings={scan.findings} />
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <FindingsTable
                    findings={scan.findings}
                    selectedId={selectedFinding?.id ?? null}
                    onSelect={setSelectedFinding}
                  />
                </div>
                <DependencyTree dependencies={scan.dependencies} />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <RiskyConfigsList configs={scan.riskyConfigs} />
                <RecommendationsList recommendations={scan.recommendations} />
              </div>

              <RefactorPreview finding={selectedFinding} />
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="pb-8 pt-4 text-center text-xs text-muted">
          Built with React, Express, ts-morph, Babel, Tailwind, Monaco, and lots
          of paranoia. <span className="text-foreground/70">v1.0 · Phase 2</span>
        </footer>
      </main>
    </div>
  );
}
