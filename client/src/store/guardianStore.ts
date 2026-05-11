import { create } from "zustand";
import type { Finding, ScanResult, ScanSource } from "@/types";

export type ScanStage = "idle" | "cloning" | "analyzing" | "done" | "error";

interface GuardianState {
  scanSource: ScanSource;
  projectPath: string;
  repoUrl: string;
  scan: ScanResult | null;
  selectedFinding: Finding | null;
  scanStage: ScanStage;
  error: string | null;

  setScanSource: (s: ScanSource) => void;
  setProjectPath: (path: string) => void;
  setRepoUrl: (url: string) => void;
  setScan: (result: ScanResult) => void;
  setSelectedFinding: (finding: Finding | null) => void;
  setStage: (stage: ScanStage) => void;
  setError: (message: string | null) => void;
  reset: () => void;
}

export const useGuardianStore = create<GuardianState>((set) => ({
  scanSource: "local",
  projectPath: "",
  repoUrl: "",
  scan: null,
  selectedFinding: null,
  scanStage: "idle",
  error: null,

  setScanSource: (scanSource) => set({ scanSource }),
  setProjectPath: (projectPath) => set({ projectPath }),
  setRepoUrl: (repoUrl) => set({ repoUrl }),
  setScan: (scan) =>
    set({
      scan,
      selectedFinding: scan.findings[0] ?? null,
      error: null,
      scanStage: "done",
    }),
  setSelectedFinding: (selectedFinding) => set({ selectedFinding }),
  setStage: (scanStage) => set({ scanStage }),
  setError: (error) => set({ error, scanStage: error ? "error" : "idle" }),
  reset: () =>
    set({
      scan: null,
      selectedFinding: null,
      scanStage: "idle",
      error: null,
    }),
}));
