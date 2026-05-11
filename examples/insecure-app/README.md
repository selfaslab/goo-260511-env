# insecure-app (demo target for .env Guardian)

This folder is **deliberately full of bad practices** so you can see what
`.env Guardian` does on a realistic small project.

## Before you scan (API keys stay local)

This repository **does not ship any API keys**. To see the full set of findings
(including regex hits in `.env`):

1. Copy the template: `cp .env.example .env` (Windows: `copy .env.example .env`).
2. Open `.env` and paste **your own disposable test keys** only (never commit `.env`).
3. Project home & policy: [github.com/selfaslab/goo-260511-env](https://github.com/selfaslab/goo-260511-env).

Without a filled `.env`, you will still see issues such as `import.meta.env.VITE_*`
usage in client code (`src/hooks/useChat.ts`) and server-side `process.env` reads
(`server/db.ts`).

It contains:

- **`.env.example`** — variable names only; copy to `.env` and add keys locally.
- A React hook (`src/hooks/useChat.ts`) that reads `import.meta.env.VITE_OPENAI_API_KEY`
  in the browser. Guardian flags this as **CRITICAL** when a value is present because
  the secret is bundled into the client.
- A service module (`src/services/github.ts`) that reads `import.meta.env.VITE_GITHUB_PAT`
  in the client — same class of mistake for GitHub tokens.
- A server module (`server/db.ts`) that reads `DATABASE_URL` from
  `process.env`. Server-only consumption — Guardian rates this lower.

> **Do not** put real production keys in this demo folder. Use throwaway credentials only.
