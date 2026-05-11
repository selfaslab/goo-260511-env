import { useMemo, useState, type FormEvent } from "react";
import { Github, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useGuardianStore } from "@/store/guardianStore";

interface GithubUrlScannerProps {
  onScan: (repoUrl: string) => void;
  isScanning: boolean;
}

const GITHUB_URL_RE = /^https:\/\/(?:www\.)?github\.com\/[A-Za-z0-9_.\-]+\/[A-Za-z0-9_.\-]+(?:\.git)?\/?$/;

export function GithubUrlScanner({ onScan, isScanning }: GithubUrlScannerProps): JSX.Element {
  const repoUrl = useGuardianStore((s) => s.repoUrl);
  const [draft, setDraft] = useState(repoUrl);

  const validation = useMemo(() => {
    const trimmed = draft.trim();
    if (!trimmed) return { ok: false, message: "" };
    if (!GITHUB_URL_RE.test(trimmed)) {
      return { ok: false, message: "Use https://github.com/<owner>/<repo>" };
    }
    return { ok: true, message: "" };
  }, [draft]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!validation.ok) return;
    onScan(draft.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Github className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://github.com/user/repo"
            className="h-11 w-full rounded-2xl border border-border bg-surfaceElevated/60 pl-10 pr-3 text-sm text-foreground placeholder:text-muted/70 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            spellCheck={false}
            autoComplete="off"
            inputMode="url"
          />
        </div>
        <Button type="submit" disabled={isScanning || !validation.ok}>
          {isScanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning…
            </>
          ) : (
            <>
              <Github className="h-4 w-4" />
              Scan repository
            </>
          )}
        </Button>
      </div>
      {!validation.ok && draft.trim() && (
        <p className="text-xs text-warning">{validation.message}</p>
      )}
      <p className="text-[11px] text-muted">
        Public GitHub URLs only. The repo is shallow-cloned to a temp folder
        (≤500&nbsp;MB, ≤50k files, 60s timeout) and deleted right after the scan.
      </p>
    </form>
  );
}
