# Agent Guidelines & Invariants

## 1. Zero Secrets & Credential Hygiene (CRITICAL)
- **Zero Raw Secrets**: NEVER hardcode API keys, service role credentials, Supabase JWTs (`eyJ...`), webhook tokens, or passwords in ANY code, script, test, scratch file, or documentation.
- **Dynamic Loading**: ALWAYS read credentials from `process.env` or local uncommitted `.env.local`.
- **Pre-Commit Enforcement**: The pre-commit hook in `.githooks/pre-commit` and `scripts/scan-secrets.mjs` must pass before every commit. Never bypass or disable secret scanning.
- **Git Safety**: Never stage `.env.local` or environment files containing real keys.

## 2. Agent-Driven Development Standards
- Maintain documentation integrity: When updating TRD, TDS, or STAGES.md, adhere strictly to their respective skill instructions (append/prepend timestamped history, update progress metrics, maintain semantic versioning).
- Keep all architectural boundaries intact: server-side logic in `lib/`, browser-safe clients in `lib/supabase/client.ts`, server-only clients in `lib/supabase/server.ts`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
