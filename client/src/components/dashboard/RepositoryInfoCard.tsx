import { ExternalLink, FileCode, FolderTree, GitBranch, Github, HardDrive } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { RepositoryInfo } from "@/types";

interface RepositoryInfoCardProps {
  repository: RepositoryInfo;
  totalFiles: number;
  scannedAt: string;
}

export function RepositoryInfoCard({
  repository,
  totalFiles,
  scannedAt,
}: RepositoryInfoCardProps): JSX.Element {
  const isGithub = repository.source === "github";
  const title = isGithub
    ? `${repository.owner}/${repository.repo}`
    : repository.projectPath.split(/[\\/]/).slice(-2).join("/");

  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          {isGithub ? <Github className="h-4 w-4 text-primary" /> : <FolderTree className="h-4 w-4 text-primary" />}
          Repository
        </span>
      }
      description="Source of this scan"
    >
      <div className="space-y-3">
        <div>
          <div className="font-mono text-base font-semibold text-foreground break-all">
            {title}
          </div>
          {isGithub && repository.repoUrl && (
            <a
              href={repository.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {repository.repoUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {!isGithub && (
            <div className="mt-1 break-all font-mono text-[11px] text-muted">
              {repository.projectPath}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Stat icon={<FileCode className="h-3.5 w-3.5" />} label="Files">
            {totalFiles}
          </Stat>
          {repository.cloneSizeMb !== undefined && (
            <Stat icon={<HardDrive className="h-3.5 w-3.5" />} label="Size">
              {repository.cloneSizeMb.toFixed(2)} MB
            </Stat>
          )}
          {isGithub && repository.branch && (
            <Stat icon={<GitBranch className="h-3.5 w-3.5" />} label="Branch">
              {repository.branch}
            </Stat>
          )}
          {isGithub && repository.commitSha && (
            <Stat icon={<GitBranch className="h-3.5 w-3.5" />} label="Commit">
              <span className="font-mono">{repository.commitSha}</span>
            </Stat>
          )}
        </div>

        <div className="text-[11px] text-muted">
          Scanned at {new Date(scannedAt).toLocaleString()}
        </div>
      </div>
    </Card>
  );
}

function Stat({
  icon,
  label,
  children,
}: {
  icon: JSX.Element;
  label: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-surfaceElevated/60 px-2.5 py-1.5">
      <span className="text-muted">{icon}</span>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-widest text-muted">{label}</span>
        <span className="text-foreground">{children}</span>
      </div>
    </div>
  );
}
