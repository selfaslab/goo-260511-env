import type { FrameworkInfo, FrameworkId } from "../types/index.js";
import type { DiscoveredFile } from "../utils/fs.js";

/**
 * Lightweight, file-presence based framework detection. We never execute
 * project code — we only look at filenames and a couple of well-known JSON
 * fields inside `package.json`.
 */
export function detectFrameworks(
  files: DiscoveredFile[],
  fileContents: Map<string, string>,
): FrameworkInfo[] {
  const byId = new Map<FrameworkId, FrameworkInfo>();
  const add = (id: FrameworkId, label: string, evidence: string): void => {
    const existing = byId.get(id);
    if (existing) {
      if (!existing.evidence.includes(evidence)) existing.evidence.push(evidence);
      return;
    }
    byId.set(id, { id, label, evidence: [evidence] });
  };

  for (const file of files) {
    const rel = file.relativePath;
    const base = file.basename.toLowerCase();

    if (base === "vite.config.ts" || base === "vite.config.js") add("vite", "Vite", rel);
    if (base === "next.config.js" || base === "next.config.mjs" || base === "next.config.ts") {
      add("nextjs", "Next.js", rel);
    }
    if (base === "remix.config.js" || base === "remix.config.ts") add("remix", "Remix", rel);
    if (base === "dockerfile") add("docker", "Docker", rel);
    if (base === "docker-compose.yml" || base === "docker-compose.yaml") add("docker", "Docker", rel);
    if (rel.startsWith(".github/workflows/")) add("github-actions", "GitHub Actions", rel);
    if (file.extension === ".tf" || file.extension === ".tfvars") add("terraform", "Terraform", rel);
    if (base === "vercel.json") add("vercel", "Vercel", rel);
    if (base === "netlify.toml") add("netlify", "Netlify", rel);
    if (base === "requirements.txt" || base === "pipfile" || base === "pipfile.lock") {
      add("python", "Python", rel);
    }
    if (base === "manage.py") add("django", "Django", rel);
    if (rel.endsWith("/wsgi.py") || rel.endsWith("/asgi.py") || base === "app.py") {
      add("flask", "Flask", rel);
    }
  }

  const pkgFile = files.find((f) => f.basename === "package.json" && !f.relativePath.includes("/"));
  if (pkgFile) {
    const content = fileContents.get(pkgFile.absolutePath);
    if (content) {
      let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> } | null = null;
      try {
        pkg = JSON.parse(content);
      } catch {
        pkg = null;
      }
      if (pkg) {
        const allDeps = {
          ...(pkg.dependencies ?? {}),
          ...(pkg.devDependencies ?? {}),
        };
        if (allDeps["react"]) add("react", "React", "package.json");
        if (allDeps["next"]) add("nextjs", "Next.js", "package.json");
        if (allDeps["vite"]) add("vite", "Vite", "package.json");
        if (allDeps["@remix-run/react"]) add("remix", "Remix", "package.json");
        if (allDeps["express"]) add("express", "Express", "package.json");
        if (allDeps["firebase"] || allDeps["firebase-admin"]) {
          add("firebase", "Firebase", "package.json");
        }
        if (allDeps["@supabase/supabase-js"]) add("supabase", "Supabase", "package.json");
        // Always tag node when we see a package.json
        add("node", "Node.js", "package.json");
      }
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label));
}
