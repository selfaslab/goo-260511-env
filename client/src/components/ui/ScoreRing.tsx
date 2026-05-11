import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

interface ScoreRingProps {
  score: number;
  size?: number;
  className?: string;
}

export function ScoreRing({ score, size = 140, className }: ScoreRingProps): JSX.Element {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const offset = circumference - (safeScore / 100) * circumference;
  const stroke = scoreToColor(safeScore);

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={10}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 70, damping: 18 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-3xl font-semibold text-foreground">
          {safeScore}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted">
          score
        </div>
      </div>
    </div>
  );
}

function scoreToColor(score: number): string {
  if (score >= 80) return "#22d3ee";
  if (score >= 60) return "#a3e635";
  if (score >= 40) return "#f59e0b";
  if (score >= 20) return "#ef4444";
  return "#f43f5e";
}
