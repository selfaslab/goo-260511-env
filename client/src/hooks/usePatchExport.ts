import { useMutation } from "@tanstack/react-query";
import { exportPatch } from "@/services/scan/scanService";
import { downloadJson } from "@/utils/download";
import { useGuardianStore } from "@/store/guardianStore";

export function usePatchExport(): {
  exportNow: () => void;
  isExporting: boolean;
} {
  const projectPath = useGuardianStore((s) => s.projectPath);
  const setError = useGuardianStore((s) => s.setError);

  const mutation = useMutation({
    mutationFn: () => exportPatch(projectPath || undefined),
    onSuccess: (data) => {
      downloadJson("guardian.patch.json", data);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  return {
    exportNow: () => mutation.mutate(),
    isExporting: mutation.isPending,
  };
}
