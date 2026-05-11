import { useMemo } from "react";
import { Flame } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { RISK_HEX, RISK_ORDER } from "@/constants/risk";
import type { Finding, RiskLevel } from "@/types";

interface RiskHeatmapProps {
  findings: Finding[];
}

interface FileBucket {
  file: string;
  buckets: Record<RiskLevel, number>;
  total: number;
}

/**
 * Compact heatmap of "files × severity". Top 10 files only — anything
 * larger turns into noise on a dashboard.
 */
export function RiskHeatmap({ findings }: RiskHeatmapProps): JSX.Element {
  const rows = useMemo<FileBucket[]>(() => {
    const map = new Map<string, FileBucket>();
    for (const finding of findings) {
      const existing = map.get(finding.filePath) ?? {
        file: finding.filePath,
        buckets: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
        total: 0,
      };
      existing.buckets[finding.risk] += 1;
      existing.total += 1;
      map.set(finding.filePath, existing);
    }
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [findings]);

  if (rows.length === 0) {
    return (
      <Card
        title={
          <span className="inline-flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            Risk heatmap
          </span>
        }
      >
        <EmptyState
          title="Nothing to plot"
          description="Findings will appear here grouped by file."
        />
      </Card>
    );
  }

  const max = Math.max(...rows.map((r) => r.total));

  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          <Flame className="h-4 w-4 text-primary" />
          Risk heatmap
        </span>
      }
      description="Top files ranked by total findings"
    >
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.file} className="flex items-center gap-3 text-xs">
            <span className="w-1/2 truncate font-mono text-foreground" title={row.file}>
              {row.file}
            </span>
            <div className="flex flex-1 items-center gap-1">
              {RISK_ORDER.map((level) => {
                const count = row.buckets[level];
                const widthPct = max > 0 ? (count / max) * 100 : 0;
                if (count === 0) {
                  return <div key={level} className="h-3 flex-[0.05] rounded-full bg-white/[0.04]" />;
                }
                return (
                  <div
                    key={level}
                    title={`${level}: ${count}`}
                    className="h-3 rounded-full"
                    style={{
                      width: `${Math.max(widthPct, 12)}%`,
                      background: RISK_HEX[level],
                      opacity: 0.85,
                    }}
                  />
                );
              })}
            </div>
            <span className="w-8 text-right font-mono text-muted">{row.total}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
