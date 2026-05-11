# Contributing to .env Guardian

Thanks for taking the time to contribute! This project is a free, MIT-licensed
secret scanner for students, indie hackers, and OSS maintainers. We optimise
for **clarity, privacy, and zero paid dependencies**.

## Ground rules

1. **No paid APIs.** Every feature must run locally. We never call OpenAI,
   Anthropic, or any cloud LLM in the default code path. Heuristic / pattern
   based logic only.
2. **Privacy first.** Source code, env values, and tokens never leave the
   machine. Mask all secret values before they cross any module boundary.
3. **No `any`.** TypeScript strict mode is on. Use `unknown` + narrowing or
   discriminated unions instead.
4. **Single responsibility.** Components > 200 lines must be split. Scanner /
   refactor / route layers stay separate.
5. **Reusable UI.** New visual primitives belong in `client/src/components/ui/`.

## Local setup

```bash
# clone + install both workspaces
git clone https://github.com/<your-fork>/env-guardian.git
cd env-guardian
npm --prefix server install
npm --prefix client install

# run both dev servers
npm --prefix server run dev    # → http://127.0.0.1:5174  (API)
npm --prefix client run dev    # → http://localhost:5173  (Dashboard)
```

The Vite dev server proxies `/api/*` to the Express server, so you do not
need to configure anything else.

## Workflow

1. Open an issue first for anything bigger than a typo or a one-line fix.
2. Fork → branch → PR. Use a topic branch (`feat/...`, `fix/...`, `docs/...`).
3. Run `npm --prefix server run typecheck` and `npm --prefix client run typecheck`
   before pushing.
4. Add a test in `server/src/scanner/__tests__/` if you change scanner behaviour.
5. Keep PRs small and focused. One concern per PR.

## Adding a secret pattern

1. Add the regex to `server/src/constants/patterns.ts` (`SECRET_PATTERNS`).
2. Pick the most accurate `baseRisk`. Provider-specific keys with full account
   access are `CRITICAL`; database URIs are usually `HIGH`.
3. Add a unit test in `server/src/scanner/__tests__/regexScanner.test.ts`.
4. Add the new `SecretType` to **both** `server/src/types/index.ts` and
   `client/src/types/index.ts`.

## Adding a framework detector

1. Add file-presence logic to
   `server/src/scanner/frameworkDetector.ts`.
2. Add the new `FrameworkId` to **both** type files.
3. Add a colour entry to
   `client/src/components/dashboard/FrameworkBadges.tsx` (`COLOR_BY_ID`).

## Code style

- Prettier + ESLint defaults. We do not enforce formatting on commit, but PRs
  with noisy formatting changes will be asked to revert.
- Comments explain *why*, not *what*. Trust the reader to read the code.
- Prefer pure functions and explicit return types in public APIs.

## Releases

We tag releases as `vMAJOR.MINOR.PATCH`. The roadmap lives in `README.md`.

By contributing you agree that your contributions will be licensed under the
project's MIT License.
