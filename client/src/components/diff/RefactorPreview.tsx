import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Code2,
  Loader2,
  ServerCog,
  Wand2,
} from "lucide-react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import Editor from "@monaco-editor/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tag } from "@/components/ui/Pill";
import { generateRefactor } from "@/services/scan/scanService";
import type { Finding } from "@/types";

interface RefactorPreviewProps {
  finding: Finding | null;
}

export function RefactorPreview({ finding }: RefactorPreviewProps): JSX.Element {
  const [tab, setTab] = useState<"diff" | "server" | "client">("diff");

  const enabled = Boolean(finding);
  const refactorQuery = useQuery({
    queryKey: ["refactor", finding?.id],
    enabled,
    queryFn: () => {
      if (!finding) throw new Error("No finding selected");
      return generateRefactor(finding, finding.snippet ?? "");
    },
  });

  const diffStyles = useMemo(
    () => ({
      variables: {
        dark: {
          diffViewerBackground: "transparent",
          diffViewerColor: "#e2e8f0",
          addedBackground: "rgba(34,197,94,0.10)",
          addedColor: "#bbf7d0",
          removedBackground: "rgba(244,63,94,0.10)",
          removedColor: "#fecaca",
          wordAddedBackground: "rgba(34,197,94,0.30)",
          wordRemovedBackground: "rgba(244,63,94,0.30)",
          codeFoldGutterBackground: "transparent",
          codeFoldBackground: "transparent",
          gutterBackground: "transparent",
          gutterBackgroundDark: "transparent",
          highlightBackground: "rgba(56,189,248,0.08)",
          highlightGutterBackground: "rgba(56,189,248,0.12)",
          emptyLineBackground: "transparent",
        },
      },
      contentText: {
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "12px",
      },
      gutter: { padding: "0 8px", minWidth: "32px" },
      line: { padding: "0 6px" },
    }),
    [],
  );

  if (!finding) {
    return (
      <Card
        title={
          <span className="inline-flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            Secure refactor preview
          </span>
        }
        description="Select a finding to generate a server-side proxy."
      >
        <EmptyState
          icon={<Wand2 className="h-6 w-6" />}
          title="Pick a finding"
          description="Click any row in the findings table to preview a secure refactor."
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" />
          Secure refactor preview
        </span>
      }
      description={
        <span className="font-mono text-xs">
          {finding.filePath}:{finding.lineNumber}
        </span>
      }
      action={
        <div className="flex items-center gap-2">
          <Tag>{finding.type}</Tag>
          {finding.clientExposed && (
            <Tag className="border-critical/30 bg-critical/10 text-critical">
              client-exposed
            </Tag>
          )}
        </div>
      }
    >
      {refactorQuery.isLoading && (
        <div className="flex h-40 items-center justify-center text-muted">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating refactor…
        </div>
      )}

      {refactorQuery.isError && (
        <div className="flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          <AlertCircle className="h-4 w-4" />
          Failed to generate refactor.
          <Button
            size="sm"
            variant="secondary"
            onClick={() => refactorQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      )}

      {refactorQuery.data && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <p className="text-sm leading-relaxed text-muted">
            {refactorQuery.data.explanation}
          </p>

          {refactorQuery.data.envRename && (
            <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2 font-mono text-xs">
              <span className="text-muted">env rename:</span>
              <span className="text-foreground">
                {refactorQuery.data.envRename.from}
              </span>
              <ArrowRight className="h-3 w-3 text-primary" />
              <span className="text-primary">
                {refactorQuery.data.envRename.to}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 rounded-full border border-border bg-surfaceElevated/60 p-1 text-xs">
            <TabButton
              active={tab === "diff"}
              onClick={() => setTab("diff")}
              icon={<Code2 className="h-3.5 w-3.5" />}
            >
              Diff
            </TabButton>
            <TabButton
              active={tab === "server"}
              onClick={() => setTab("server")}
              icon={<ServerCog className="h-3.5 w-3.5" />}
            >
              Server route
            </TabButton>
            <TabButton
              active={tab === "client"}
              onClick={() => setTab("client")}
              icon={<Code2 className="h-3.5 w-3.5" />}
            >
              Client call
            </TabButton>
          </div>

          {tab === "diff" && (
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface/60 p-1">
              <ReactDiffViewer
                oldValue={refactorQuery.data.beforeCode}
                newValue={refactorQuery.data.afterCode}
                splitView
                useDarkTheme
                hideLineNumbers={false}
                compareMethod={DiffMethod.WORDS}
                styles={diffStyles}
              />
            </div>
          )}

          {tab === "server" && (
            <CodeBlock
              language="typescript"
              value={refactorQuery.data.serverImplementation}
            />
          )}

          {tab === "client" && (
            <CodeBlock
              language="typescript"
              value={refactorQuery.data.clientReplacement}
            />
          )}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
              Migration steps
            </h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-foreground/90">
              {refactorQuery.data.migrationGuide.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </motion.div>
      )}
    </Card>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-primary"
          : "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-muted hover:text-foreground"
      }
    >
      {icon}
      {children}
    </button>
  );
}

function CodeBlock({
  language,
  value,
}: {
  language: string;
  value: string;
}): JSX.Element {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70">
      <Editor
        height="280px"
        language={language}
        value={value}
        theme="vs-dark"
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontFamily: "JetBrains Mono",
          fontSize: 12,
          lineNumbers: "on",
          renderLineHighlight: "none",
          scrollBeyondLastLine: false,
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
}
