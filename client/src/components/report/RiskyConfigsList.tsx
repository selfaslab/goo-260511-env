import { FileWarning } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { RiskPill } from "@/components/ui/Pill";
import type { RiskyConfig } from "@/types";

interface RiskyConfigsListProps {
  configs: RiskyConfig[];
}

export function RiskyConfigsList({ configs }: RiskyConfigsListProps): JSX.Element {
  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          <FileWarning className="h-4 w-4 text-primary" />
          Risky configurations
        </span>
      }
      description="Issues found in workflows, docker-compose, terraform, vercel.json…"
    >
      {configs.length === 0 ? (
        <EmptyState
          title="No risky config issues"
          description="No suspicious patterns in CI/CD or infra files."
        />
      ) : (
        <ul className="space-y-2">
          {configs.map((cfg, idx) => (
            <li
              key={`${cfg.filePath}-${cfg.lineNumber ?? "x"}-${idx}`}
              className="flex items-start gap-3 rounded-2xl border border-border/70 bg-surfaceElevated/60 p-3"
            >
              <RiskPill level={cfg.risk} />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-xs text-muted">
                  {cfg.filePath}
                  {cfg.lineNumber ? `:${cfg.lineNumber}` : ""}
                </div>
                <p className="mt-1 text-sm text-foreground/90">{cfg.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
