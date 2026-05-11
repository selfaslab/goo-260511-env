import { motion, AnimatePresence } from "framer-motion";
import { CloudDownload, Loader2, ScanSearch } from "lucide-react";
import { useGuardianStore } from "@/store/guardianStore";

const STAGE_LABELS: Record<string, { label: string; icon: JSX.Element }> = {
  cloning: {
    label: "Cloning repository…",
    icon: <CloudDownload className="h-4 w-4 text-primary" />,
  },
  analyzing: {
    label: "Analyzing security…",
    icon: <ScanSearch className="h-4 w-4 text-primary" />,
  },
};

export function ScanProgress(): JSX.Element | null {
  const stage = useGuardianStore((s) => s.scanStage);
  if (stage !== "cloning" && stage !== "analyzing") return null;

  const meta = STAGE_LABELS[stage];

  return (
    <AnimatePresence>
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground/90"
      >
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        {meta.icon}
        <span>{meta.label}</span>
      </motion.div>
    </AnimatePresence>
  );
}
