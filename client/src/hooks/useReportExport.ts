import { useMutation } from "@tanstack/react-query";
import { downloadReport } from "@/services/scan/scanService";
import { downloadBlob } from "@/utils/download";
import { useGuardianStore } from "@/store/guardianStore";
import type { ReportFormat } from "@/types";

export function useReportExport(): {
  exportReport: (format: ReportFormat) => void;
  isExporting: boolean;
  pendingFormat: ReportFormat | null;
} {
  const setError = useGuardianStore((s) => s.setError);
  const scan = useGuardianStore((s) => s.scan);

  const mutation = useMutation({
    mutationFn: async (format: ReportFormat) => {
      const projectPath =
        scan?.repository.source === "github"
          ? scan.repository.repoUrl
          : scan?.projectPath;
      const file = await downloadReport(format, projectPath ?? undefined);
      downloadBlob(file.filename, file.body, file.contentType);
      return format;
    },
    onError: (error: Error) => setError(error.message),
  });

  return {
    exportReport: (format: ReportFormat) => mutation.mutate(format),
    isExporting: mutation.isPending,
    pendingFormat: (mutation.variables as ReportFormat | undefined) ?? null,
  };
}
