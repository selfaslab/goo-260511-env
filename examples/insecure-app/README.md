# insecure-app (demo target for .env Guardian)

This folder is **deliberately full of bad practices** so you can see what
`.env Guardian` does on a realistic small project.

It contains:

- A `.env` with multiple secret styles (OpenAI key, public-prefixed OpenAI key,
  GitHub token, Postgres URL, generic `APP_SECRET`).
- A React hook (`src/hooks/useChat.ts`) that reads `import.meta.env.VITE_OPENAI_API_KEY`
  in the browser. Guardian flags this as **CRITICAL** because the secret is
  bundled into the client.
- A service module (`src/services/github.ts`) with a **hardcoded** GitHub PAT.
- A server module (`server/db.ts`) that reads `DATABASE_URL` from
  `process.env`. Server-only consumption — Guardian rates this lower.

> **Do not** put real keys in here. The values are obvious test placeholders.
