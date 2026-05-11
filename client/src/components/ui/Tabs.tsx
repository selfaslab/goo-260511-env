import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  icon?: ReactNode;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

export function Tabs<T extends string>({
  items,
  active,
  onChange,
  className,
}: TabsProps<T>): JSX.Element {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-2xl border border-border bg-surfaceElevated/60 p-1 text-xs",
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-colors",
              isActive
                ? "bg-primary/15 text-primary"
                : "text-muted hover:text-foreground hover:bg-white/5",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
