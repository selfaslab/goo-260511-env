import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { RISK_COLOR, RISK_DOT, RISK_LABEL } from "@/constants/risk";
import type { RiskLevel } from "@/types";

export function RiskPill({
  level,
  className,
}: {
  level: RiskLevel;
  className?: string;
}): JSX.Element {
  return (
    <span
      className={cn(
        "pill border",
        RISK_COLOR[level],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", RISK_DOT[level])} />
      {RISK_LABEL[level]}
    </span>
  );
}

export function Tag({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <span
      className={cn(
        "pill border border-border/60 bg-surfaceElevated/60 text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
