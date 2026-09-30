# Agent Guidelines, Invariants & AI Context

This document defines the agent engineering standards, operational invariants, and context management protocols used by autonomous AI agents throughout the development of the **Multi-Workspace Document Assistant**.

---

## 1. Zero Secrets & Credential Hygiene (CRITICAL INVARIANT)
- **Zero Raw Secrets**: NEVER hardcode API keys, service role credentials, Supabase JWTs (`eyJ...`), webhook tokens, or passwords in ANY code, script, test, scratch file, or documentation.
- **Dynamic Loading**: ALWAYS read credentials from `process.env` or local uncommitted `.env.local`.
- **Pre-Commit Enforcement**: The pre-commit hook in `.githooks/pre-commit` and `scripts/scan-secrets.mjs` must pass before every commit. Never bypass or disable secret scanning.
- **Git Safety**: Never stage `.env.local` or environment files containing real keys.

---

## 2. Agent-Driven Development Standards & Architecture Boundaries
- **Specification-First Development**:
  - The project followed an agentic lifecycle: **TRD** (Technical Requirements Document) → **TDS** (Technical Design Specification) → **STAGES.md** (Stage Tracker).
  - Every architectural addition or change must map back to an approved Functional Requirement (FR), Non-Functional Requirement (NFR), or Test Scenario (TS).
- **Strict Architectural Boundaries**:
  - **Browser vs. Server Boundary**: Browser components only ever import `@/lib/supabase/client`. Server components, API routes, and Server Actions import `@/lib/supabase/server` or `@/lib/supabase/admin`.
  - **Shared Vector Store Isolation**: Tenant partitioning is enforced inside SQL via `match_workspace_chunks(p_workspace_id, ...)` using pgvector HNSW index. Application code must never perform un-scoped vector queries.
  - **Data-First Tool Registry**: Tools are declared with strict Zod parameter schemas in `@/lib/tools/registry.ts`. Tools must never execute directly in UI code.
  - **Service Layer Abstraction**: External providers (Google Gemini, Discord, Supabase) are isolated in `lib/` service modules.

---

## 3. Autonomous Tool Loop Invariants
1. **Model Proposes, Server Disposes**: The LLM suggests tool calls with arguments. The application intercepts, validates with Zod, executes server-side, records the execution in `tool_calls_log`, and passes the structured result back to the model.
2. **Graceful Error Recovery**: If an unknown tool is requested or arguments fail validation, the system feeds a structured error object back to the LLM to allow self-correction without crashing or throwing 500s.
3. **Loop Bounding**: Multi-step tool iterations are hard-capped at 5 turns to prevent infinite recursive execution.

---

## 4. RAG Prompt Invariants & Injection Defense
1. **Context Tagging**: Retrieved chunks are wrapped inside `<context_documents>` XML boundary tags.
2. **Data-Only Directive**: System prompt instructs the model that content within `<context_documents>` represents untrusted data, not executable instructions.
3. **Closing Tag Sanitization**: Document chunk content is sanitized to escape premature `</context_documents>` occurrences, neutralizing injection attempts.
4. **Honest Refusal Guard**: If the retrieved documents do not support the query, the model is strictly constrained to state that it does not have enough information.

---

## 5. Skills & Context Framework
The project utilized specialized agent skills located in `.agents/skills/`:
- `create-trd`: Governs requirements specification, versioning, and constraint mapping.
- `create-tds`: Governs architectural design, DDL definitions, component hierarchies, and sequence diagrams.
- `stage-tracker`: Governs stage-by-stage task execution, status tracking, and chronological update histories in `docs/STAGES.md`.

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
