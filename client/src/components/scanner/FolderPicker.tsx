import { useState, type FormEvent } from "react";
import { FolderSearch, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useGuardianStore } from "@/store/guardianStore";

interface FolderPickerProps {
  onScan: (projectPath: string) => void;
  isScanning: boolean;
}

export function FolderPicker({ onScan, isScanning }: FolderPickerProps): JSX.Element {
  const projectPath = useGuardianStore((s) => s.projectPath);
  const [draft, setDraft] = useState(projectPath);

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const next = draft.trim();
    if (!next) return;
    onScan(next);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <FolderSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Absolute path to a project folder"
          className="h-11 w-full rounded-2xl border border-border bg-surfaceElevated/60 pl-10 pr-3 text-sm text-foreground placeholder:text-muted/70 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
      <Button type="submit" disabled={isScanning || !draft.trim()}>
        {isScanning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Scanning…
          </>
        ) : (
          <>
            <FolderSearch className="h-4 w-4" />
            Scan folder
          </>
        )}
      </Button>
    </form>
  );
}
