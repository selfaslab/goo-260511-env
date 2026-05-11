import { cn } from "@/utils/cn";

export function Skeleton({ className }: { className?: string }): JSX.Element {
  return (
    <div
      className={cn(
        "animate-pulse-soft rounded-xl bg-white/[0.04]",
        className,
      )}
    />
  );
}
