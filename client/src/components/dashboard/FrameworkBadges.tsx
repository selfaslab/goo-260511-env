import { Boxes } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/EmptyState";
import type { FrameworkInfo } from "@/types";

const COLOR_BY_ID: Record<string, string> = {
  react: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  vite: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  nextjs: "border-zinc-500/40 bg-zinc-500/10 text-zinc-200",
  remix: "border-zinc-500/40 bg-zinc-500/10 text-zinc-200",
  node: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  express: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  python: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  django: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  flask: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  firebase: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  supabase: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  docker: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  "github-actions": "border-zinc-500/40 bg-zinc-500/10 text-zinc-200",
  terraform: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  vercel: "border-zinc-500/40 bg-zinc-500/10 text-zinc-200",
  netlify: "border-teal-500/40 bg-teal-500/10 text-teal-300",
};

interface FrameworkBadgesProps {
  frameworks: FrameworkInfo[];
}

export function FrameworkBadges({ frameworks }: FrameworkBadgesProps): JSX.Element {
  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          <Boxes className="h-4 w-4 text-primary" />
          Frameworks detected
        </span>
      }
      description="Auto-detected from package.json and config files"
    >
      {frameworks.length === 0 ? (
        <EmptyState
          title="No frameworks detected"
          description="Add a package.json, Dockerfile, or workflow file."
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {frameworks.map((fw) => (
            <Tag
              key={fw.id}
              className={COLOR_BY_ID[fw.id] ?? "border-border bg-surfaceElevated/60 text-foreground"}
            >
              {fw.label}
            </Tag>
          ))}
        </div>
      )}
    </Card>
  );
}
