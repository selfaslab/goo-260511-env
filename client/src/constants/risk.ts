import type { RiskLevel } from "@/types";

export const RISK_ORDER: RiskLevel[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export const RISK_LABEL: Record<RiskLevel, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const RISK_COLOR: Record<RiskLevel, string> = {
  CRITICAL: "bg-critical/15 text-critical border-critical/30",
  HIGH: "bg-danger/15 text-danger border-danger/30",
  MEDIUM: "bg-warning/15 text-warning border-warning/30",
  LOW: "bg-muted/10 text-muted border-border",
};

export const RISK_DOT: Record<RiskLevel, string> = {
  CRITICAL: "bg-critical",
  HIGH: "bg-danger",
  MEDIUM: "bg-warning",
  LOW: "bg-muted",
};

export const RISK_HEX: Record<RiskLevel, string> = {
  CRITICAL: "#f43f5e",
  HIGH: "#ef4444",
  MEDIUM: "#f59e0b",
  LOW: "#94a3b8",
};
