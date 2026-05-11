import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Globe, Server } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tag } from "@/components/ui/Pill";
import type { DependencyNode } from "@/types";
import { cn } from "@/utils/cn";

interface DependencyTreeProps {
  dependencies: DependencyNode[];
}

export function DependencyTree({ dependencies }: DependencyTreeProps): JSX.Element {
  const sorted = useMemo(
    () =>
      [...dependencies].sort((a, b) => {
        if (a.clientExposed === b.clientExposed) {
          return b.references.length - a.references.length;
        }
        return a.clientExposed ? -1 : 1;
      }),
    [dependencies],
  );

  if (sorted.length === 0) {
    return (
      <Card title="Dependency tree" description="Where each env variable is consumed">
        <EmptyState
          title="No env usage detected"
          description="Once code reads process.env or import.meta.env, it will appear here."
        />
      </Card>
    );
  }

  return (
    <Card
      title="Dependency tree"
      description="Trace which files consume each environment variable"
    >
      <ul className="flex flex-col divide-y divide-border/60">
        {sorted.map((node) => (
          <DependencyRow key={node.variableName} node={node} />
        ))}
      </ul>
    </Card>
  );
}

function DependencyRow({ node }: { node: DependencyNode }): JSX.Element {
  const [open, setOpen] = useState(node.clientExposed);
  return (
    <li className="py-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/[0.03]"
      >
        <div className="flex min-w-0 items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted" />
          )}
          <span className="font-mono text-sm text-foreground">
            {node.variableName}
          </span>
          {node.clientExposed ? (
            <Tag className="border-critical/30 bg-critical/10 text-critical">
              <Globe className="h-3 w-3" />
              client
            </Tag>
          ) : (
            <Tag>
              <Server className="h-3 w-3" />
              server
            </Tag>
          )}
        </div>
        <span className="font-mono text-xs text-muted">
          {node.references.length} ref{node.references.length === 1 ? "" : "s"}
        </span>
      </button>
      {open && (
        <ul className="mt-1 space-y-1 pl-7">
          {node.references.map((ref, idx) => (
            <li
              key={`${ref.filePath}:${ref.lineNumber}:${idx}`}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg px-2 py-1.5",
                ref.context === "client" && "bg-critical/5",
              )}
            >
              <span className="truncate font-mono text-xs text-muted">
                {ref.filePath}:{ref.lineNumber}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {ref.accessor}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
