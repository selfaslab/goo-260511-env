import { Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { RiskPill } from "@/components/ui/Pill";
import type { Recommendation } from "@/types";

interface RecommendationsListProps {
  recommendations: Recommendation[];
}

export function RecommendationsList({
  recommendations,
}: RecommendationsListProps): JSX.Element {
  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          Recommendations
        </span>
      }
      description="Concrete next steps to raise your security score"
    >
      {recommendations.length === 0 ? (
        <EmptyState title="No recommendations" description="Project looks healthy." />
      ) : (
        <ol className="space-y-3">
          {recommendations.map((rec, idx) => (
            <li
              key={rec.id}
              className="rounded-2xl border border-border/70 bg-surfaceElevated/60 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xs text-muted">{idx + 1}.</span>
                  <h4 className="text-sm font-semibold text-foreground">{rec.title}</h4>
                </div>
                <RiskPill level={rec.priority} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{rec.details}</p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
