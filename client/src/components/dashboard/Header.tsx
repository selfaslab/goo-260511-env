import { ShieldCheck, Github } from "lucide-react";

export function Header(): JSX.Element {
  return (
    <header className="border-b border-border/70 bg-background/40 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              .env Guardian
            </h1>
            <p className="text-xs text-muted">
              Local-first secret scanner & GitHub free security audit
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <span className="rounded-full border border-border bg-surfaceElevated/60 px-3 py-1 text-[11px] uppercase tracking-widest text-muted">
            v1.0 · Phase 2
          </span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surfaceElevated/60 px-3 py-1 text-xs text-muted hover:text-foreground"
          >
            <Github className="h-3.5 w-3.5" />
            Source
          </a>
        </div>
      </div>
    </header>
  );
}
