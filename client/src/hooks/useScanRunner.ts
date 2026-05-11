import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { scanGithubRepo, scanProject } from "@/services/scan/scanService";
import { useGuardianStore } from "@/store/guardianStore";

export interface ScanRunner {
  scanLocal: (projectPath: string) => void;
  scanGithub: (repoUrl: string) => void;
  rescan: () => void;
  isScanning: boolean;
}

/**
 * Drives both scan flows. The store keeps the *active* source so the rescan
 * button knows which mutation to fire.
 */
export function useScanRunner(): ScanRunner {
  const setScan = useGuardianStore((s) => s.setScan);
  const setError = useGuardianStore((s) => s.setError);
  const setStage = useGuardianStore((s) => s.setStage);
  const setScanSource = useGuardianStore((s) => s.setScanSource);
  const setProjectPath = useGuardianStore((s) => s.setProjectPath);
  const setRepoUrl = useGuardianStore((s) => s.setRepoUrl);
  const projectPath = useGuardianStore((s) => s.projectPath);
  const repoUrl = useGuardianStore((s) => s.repoUrl);
  const scanSource = useGuardianStore((s) => s.scanSource);

  const local = useMutation({
    mutationFn: scanProject,
    onMutate: () => {
      setScanSource("local");
      setStage("analyzing");
      setError(null);
    },
    onSuccess: (result) => setScan(result),
    onError: (error: Error) => setError(error.message),
  });

  const github = useMutation({
    mutationFn: async (url: string) => {
      setStage("cloning");
      // Synthetic progress hint: switch to "analyzing" after a beat so the
      // UI doesn't sit on "Cloning…" for the whole scan duration.
      setTimeout(() => {
        if (useGuardianStore.getState().scanStage === "cloning") {
          useGuardianStore.getState().setStage("analyzing");
        }
      }, 4000);
      return scanGithubRepo(url);
    },
    onMutate: () => {
      setScanSource("github");
      setError(null);
    },
    onSuccess: (result) => setScan(result),
    onError: (error: Error) => setError(error.message),
  });

  const scanLocal = useCallback(
    (next: string) => {
      setProjectPath(next);
      local.mutate(next);
    },
    [local, setProjectPath],
  );

  const scanGithubRepoFn = useCallback(
    (url: string) => {
      setRepoUrl(url);
      github.mutate(url);
    },
    [github, setRepoUrl],
  );

  const rescan = useCallback(() => {
    if (scanSource === "github" && repoUrl) {
      github.mutate(repoUrl);
    } else if (scanSource === "local" && projectPath) {
      local.mutate(projectPath);
    }
  }, [scanSource, projectPath, repoUrl, local, github]);

  return {
    scanLocal,
    scanGithub: scanGithubRepoFn,
    rescan,
    isScanning: local.isPending || github.isPending,
  };
}
