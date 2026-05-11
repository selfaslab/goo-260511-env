import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function Card({
  title,
  description,
  action,
  className,
  children,
  ...rest
}: CardProps): JSX.Element {
  return (
    <section className={cn("glass-card p-5", className)} {...rest}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-xs text-muted">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
