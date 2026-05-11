import { FolderSearch, Github } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { FolderPicker } from "./FolderPicker";
import { GithubUrlScanner } from "./GithubUrlScanner";
import { ScanProgress } from "./ScanProgress";
import { useGuardianStore } from "@/store/guardianStore";
import type { ScanSource } from "@/types";

interface ScanLauncherProps {
  onScanLocal: (path: string) => void;
  onScanGithub: (url: string) => void;
  isScanning: boolean;
}

const TABS = [
  { id: "local" as const, label: "Local folder", icon: <FolderSearch className="h-3.5 w-3.5" /> },
  { id: "github" as const, label: "GitHub URL", icon: <Github className="h-3.5 w-3.5" /> },
];

export function ScanLauncher({
  onScanLocal,
  onScanGithub,
  isScanning,
}: ScanLauncherProps): JSX.Element {
  const scanSource = useGuardianStore((s) => s.scanSource);
  const setScanSource = useGuardianStore((s) => s.setScanSource);

  return (
    <div className="space-y-4">
      <Tabs<ScanSource> items={TABS} active={scanSource} onChange={setScanSource} />

      {scanSource === "local" ? (
        <FolderPicker onScan={onScanLocal} isScanning={isScanning} />
      ) : (
        <GithubUrlScanner onScan={onScanGithub} isScanning={isScanning} />
      )}

      <ScanProgress />
    </div>
  );
}
