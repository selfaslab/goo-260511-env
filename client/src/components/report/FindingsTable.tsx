import { motion } from "framer-motion";
import { FileWarning } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { RiskPill, Tag } from "@/components/ui/Pill";
import { RISK_ORDER } from "@/constants/risk";
import type { Finding } from "@/types";
import { cn } from "@/utils/cn";

interface FindingsTableProps {
  findings: Finding[];
  selectedId: string | null;
  onSelect: (finding: Finding) => void;
}

export function FindingsTable({
  findings,
  selectedId,
  onSelect,
}: FindingsTableProps): JSX.Element {
  if (findings.length === 0) {
    return (
      <Card
        title="Findings"
        description="Every detected secret with its file location and severity."
      >
        <EmptyState
          icon={<FileWarning className="h-6 w-6" />}
          title="No secrets detected"
          description="Your project looks clean. Re-run after adding new code."
        />
      </Card>
    );
  }

  const sorted = [...findings].sort((a, b) => severityRank(b) - severityRank(a));

  return (
    <Card
      title="Findings"
      description={`${findings.length} detection${findings.length === 1 ? "" : "s"} across your project`}
    >
      <div className="overflow-hidden rounded-2xl border border-border/70">
        <table className="w-full text-left text-sm">
          <thead className="bg-surfaceElevated/60 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Risk</th>
              <th className="px-4 py-2.5 font-medium">File</th>
              <th className="px-4 py-2.5 font-medium">Line</th>
              <th className="px-4 py-2.5 font-medium">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {sorted.map((finding) => {
              const isActive = finding.id === selectedId;
              return (
                <motion.tr
                  key={finding.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "group cursor-pointer transition-colors",
                    isActive
                      ? "bg-primary/10"
                      : "hover:bg-white/[0.03]",
                  )}
                  onClick={() => onSelect(finding)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-foreground">
                        {finding.type}
                      </span>
                      {finding.hardcoded && <Tag>hardcoded</Tag>}
                      {finding.clientExposed && <Tag>client-exposed</Tag>}
                    </div>
                    {finding.variableName && (
                      <div className="mt-0.5 text-xs text-muted">
                        {finding.variableName}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <RiskPill level={finding.risk} />
                  </td>
                  <td className="max-w-[260px] truncate px-4 py-3 font-mono text-xs text-muted">
                    {finding.filePath}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {finding.lineNumber}
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs text-foreground">
                    {finding.valueMasked}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function severityRank(finding: Finding): number {
  return RISK_ORDER.length - RISK_ORDER.indexOf(finding.risk);
}
