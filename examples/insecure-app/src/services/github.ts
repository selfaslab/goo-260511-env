/**
 * INTENTIONALLY INSECURE EXAMPLE (demo only).
 *
 * Reads a GitHub token from `import.meta.env.VITE_GITHUB_PAT`, so anything you
 * put in `.env` is bundled to the browser — Guardian flags this as CRITICAL.
 *
 * Do not commit `.env`. Copy `.env.example` → `.env` and paste a disposable PAT
 * only on your machine. Upstream repo (no keys):
 * https://github.com/selfaslab/goo-260511-env
 */
const TOKEN = import.meta.env.VITE_GITHUB_PAT ?? "";

export async function listRepos(user: string): Promise<unknown> {
  const res = await fetch(`https://api.github.com/users/${user}/repos`, {
    headers: { Authorization: `token ${TOKEN}` },
  });
  return res.json();
}
