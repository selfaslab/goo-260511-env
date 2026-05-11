import { AlertTriangle, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RISK_HEX } from "@/constants/risk";
import type { RiskLevel } from "@/types";

interface FindingSummaryCardsProps {
  breakdown: Record<RiskLevel, number>;
  riskyConfigCount: number;
}

const META: Record<
  RiskLevel,
  { label: string; icon: JSX.Element }
> = {
  CRITICAL: { label: "Critical", icon: <ShieldX className="h-4 w-4" /> },
  HIGH: { label: "High", icon: <ShieldAlert className="h-4 w-4" /> },
  MEDIUM: { label: "Medium", icon: <AlertTriangle className="h-4 w-4" /> },
  LOW: { label: "Low", icon: <ShieldCheck className="h-4 w-4" /> },
};

export function FindingSummaryCards({
  breakdown,
  riskyConfigCount,
}: FindingSummaryCardsProps): JSX.Element {
  const order: RiskLevel[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {order.map((level) => (
        <SummaryTile
          key={level}
          label={META[level].label}
          value={breakdown[level]}
          color={RISK_HEX[level]}
          icon={META[level].icon}
        />
      ))}
      <SummaryTile
        label="Risky configs"
        value={riskyConfigCount}
        color="#a855f7"
        icon={<AlertTriangle className="h-4 w-4" />}
      />
    </div>
  );
}

function SummaryTile({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: JSX.Element;
}): JSX.Element {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 font-mono text-3xl font-semibold" style={{ color }}>
        {value}
      </div>
    </Card>
  );
}
