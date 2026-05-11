import { useState, useRef, useEffect } from "react";
import { ChevronDown, Download, FileJson, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useReportExport } from "@/hooks/useReportExport";
import { cn } from "@/utils/cn";
import type { ReportFormat } from "@/types";

const OPTIONS: { id: ReportFormat; label: string; icon: JSX.Element; description: string }[] = [
  {
    id: "json",
    label: "JSON",
    icon: <FileJson className="h-4 w-4" />,
    description: "guardian-report.json",
  },
  {
    id: "markdown",
    label: "Markdown",
    icon: <FileText className="h-4 w-4" />,
    description: "guardian-report.md",
  },
  {
    id: "txt",
    label: "Plain text",
    icon: <FileText className="h-4 w-4" />,
    description: "guardian-report.txt",
  },
];

export function ExportMenu(): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { exportReport, isExporting, pendingFormat } = useReportExport();

  useEffect(() => {
    const onClick = (e: MouseEvent): void => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        size="sm"
        variant="primary"
        onClick={() => setOpen((v) => !v)}
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        Export report
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-surface shadow-card"
        >
          {OPTIONS.map((option) => {
            const isPending = isExporting && pendingFormat === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="menuitem"
                disabled={isExporting}
                onClick={() => {
                  setOpen(false);
                  exportReport(option.id);
                }}
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors",
                  isExporting
                    ? "cursor-not-allowed opacity-60"
                    : "hover:bg-white/[0.04]",
                )}
              >
                <span className="mt-0.5 text-primary">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : option.icon}
                </span>
                <span className="flex-1">
                  <div className="text-foreground">{option.label}</div>
                  <div className="text-[10px] font-mono text-muted">{option.description}</div>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
