import { motion } from "framer-motion";
import { Award, Minus, Plus, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { Grade, ScoreBreakdown } from "@/types";

interface SecurityGradeCardProps {
  score: ScoreBreakdown;
  summary: string;
  scannedFiles: number;
  totalFiles: number;
}

const GRADE_COLOR: Record<Grade, string> = {
  "A+": "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  A: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  B: "text-cyan-300 border-cyan-500/40 bg-cyan-500/10",
  C: "text-amber-300 border-amber-500/40 bg-amber-500/10",
  D: "text-orange-300 border-orange-500/40 bg-orange-500/10",
  F: "text-rose-300 border-rose-500/40 bg-rose-500/10",
};

export function SecurityGradeCard({
  score,
  summary,
  scannedFiles,
  totalFiles,
}: SecurityGradeCardProps): JSX.Element {
  const safeScore = Math.max(0, Math.min(100, Math.round(score.finalScore)));

  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Security score
        </span>
      }
      description="Lower means more risk. Aim for 90+ before shipping."
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-5">
          <div
            className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border ${GRADE_COLOR[score.grade]}`}
          >
            <span className="text-3xl font-bold">{score.grade}</span>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl font-semibold text-foreground">
                {safeScore}
              </span>
              <span className="text-sm text-muted">/ 100</span>
            </div>
            <ProgressBar value={safeScore} />
            <p className="text-xs text-muted">
              {scannedFiles} / {totalFiles} files scanned
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted">{summary}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Adjustments
            kind="penalties"
            entries={score.penalties.map((p) => ({ amount: p.amount, reason: p.reason }))}
          />
          <Adjustments
            kind="bonuses"
            entries={score.bonuses.map((b) => ({ amount: b.amount, reason: b.reason }))}
          />
        </div>
      </div>
    </Card>
  );
}

function ProgressBar({ value }: { value: number }): JSX.Element {
  const color =
    value >= 85
      ? "bg-emerald-400"
      : value >= 70
        ? "bg-cyan-400"
        : value >= 55
          ? "bg-amber-400"
          : value >= 40
            ? "bg-orange-400"
            : "bg-rose-400";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <motion.div
        className={`h-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ type: "spring", stiffness: 80, damping: 18 }}
      />
    </div>
  );
}

function Adjustments({
  kind,
  entries,
}: {
  kind: "penalties" | "bonuses";
  entries: { amount: number; reason: string }[];
}): JSX.Element {
  const isBonus = kind === "bonuses";
  const Icon = isBonus ? Plus : Minus;
  return (
    <div className="rounded-2xl border border-border/70 bg-surfaceElevated/60 p-3">
      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted">
        <Award className="h-3 w-3" />
        {isBonus ? "Bonuses" : "Penalties"}
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-muted">None.</p>
      ) : (
        <ul className="space-y-1.5 text-xs">
          {entries.map((e) => (
            <li key={`${kind}-${e.reason}`} className="flex items-start gap-2">
              <Icon
                className={`mt-0.5 h-3.5 w-3.5 ${isBonus ? "text-emerald-400" : "text-rose-400"}`}
              />
              <span className="flex-1 text-foreground/90">{e.reason}</span>
              <span
                className={`font-mono ${isBonus ? "text-emerald-400" : "text-rose-400"}`}
              >
                {isBonus ? "+" : "−"}
                {e.amount}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
