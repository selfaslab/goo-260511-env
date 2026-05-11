import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import scanRoute from "./routes/scan.route.js";
import githubRoute from "./routes/github.route.js";
import reportRoute from "./routes/report.route.js";
import refactorRoute from "./routes/refactor.route.js";

const PORT = Number(process.env.PORT ?? 5174);
const HOST = process.env.HOST ?? "127.0.0.1";

const app = express();

app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    name: ".env Guardian",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", scanRoute);
app.use("/api", githubRoute);
app.use("/api", reportRoute);
app.use("/api", refactorRoute);

// Friendly landing page so people who open the API host in a browser are not
// greeted with `{"error":"Not found"}`. The actual dashboard lives in the Vite
// client (default http://127.0.0.1:5173).
app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>.env Guardian — API server</title>
    <style>
      body { background:#0b1220; color:#e2e8f0; font-family: ui-sans-serif, system-ui, sans-serif; padding:48px; max-width:720px; margin:0 auto; }
      a { color:#22d3ee; }
      code, pre { font-family: ui-monospace, "JetBrains Mono", monospace; background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:6px; }
      pre { padding:14px; overflow:auto; }
      h1 { font-size:22px; margin:0 0 4px; }
      p, li { line-height:1.6; }
      .pill { display:inline-block; background:rgba(34,211,238,0.12); color:#22d3ee; padding:2px 10px; border-radius:999px; font-size:12px; }
    </style>
  </head>
  <body>
    <span class="pill">API server</span>
    <h1>.env Guardian — backend</h1>
    <p>This process only serves the JSON API. The dashboard UI runs in the Vite client.</p>
    <h3>Open the dashboard</h3>
    <p>👉 <a href="http://127.0.0.1:5173">http://127.0.0.1:5173</a> &nbsp;
      (run <code>npm --prefix client run dev</code> if it is not up yet)</p>
    <h3>API endpoints</h3>
    <ul>
      <li><code>GET  /api/health</code></li>
      <li><code>POST /api/scan</code> — body: <code>{ "projectPath": "..." }</code></li>
      <li><code>POST /api/scan/github</code> — body: <code>{ "repoUrl": "https://github.com/..." }</code></li>
      <li><code>GET  /api/report?projectPath=...</code></li>
      <li><code>GET  /api/report/export?format=json|markdown|txt&amp;download=true</code></li>
      <li><code>POST /api/refactor</code> — body: <code>{ "finding": {...} }</code></li>
      <li><code>POST /api/refactor/export</code> — body: <code>{ "projectPath": "..." }</code></li>
    </ul>
  </body>
</html>`);
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : "Internal server error";
  // eslint-disable-next-line no-console
  console.error("[server]", err);
  res.status(500).json({ error: message });
});

app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`.env Guardian server listening on http://${HOST}:${PORT}`);
});
