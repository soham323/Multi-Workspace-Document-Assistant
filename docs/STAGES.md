# Stage Tracker
## Multi-Workspace Document Assistant (RAG & Tool Calling)

| Field         | Value                                            |
| :------------ | :----------------------------------------------- |
| **Version**   | 1.0.0                                            |
| **Status**    | Active                                           |
| **Owner**     | Soham                                            |
| **Created**   | 2026-09-29 18:36 IST                             |
| **Updated**   | 2026-09-29 18:36 IST                             |
| **Project**   | Multi-Workspace Document Assistant               |

---

## Update History

| Version | Date & Time          | Summary of Changes                                                        |
| :------ | :------------------- | :------------------------------------------------------------------------ |
| 1.0.0   | 2026-09-29 18:36 IST | Initial STAGES.md created — 8 stages, 40 tasks drafted from TRD v1.0.0  |

---

## Progress Summary

| Metric         | Count |
| :------------- | :---- |
| Total Tasks    | 40    |
| ✅ Done        | 0     |
| 🟡 In Progress | 0     |
| 🔵 Testing     | 0     |
| 🔴 Blocked     | 0     |
| ⬜ To Do       | 40    |

---

## Stage Definitions

---

### Stage 0: Project Foundation & Infrastructure
**Goal**: Initialize the Next.js project, configure Supabase (database + pgvector + auth), set up environment variables, and establish the Git repository with CI-ready structure.
**Depends On**: None
**Scalability Note**: Use environment-based configuration from day one so switching providers (e.g., Neon instead of Supabase, a different LLM) requires only env var changes, not code changes. All external service clients are abstracted into a `lib/` layer — never called directly from UI components.

| Task ID  | Task Description                                                                          | Status    | Related FRs / NFRs / TCs        | Notes |
| :------- | :---------------------------------------------------------------------------------------- | :-------- | :------------------------------- | :---- |
| ST-0-1   | Initialize Next.js 15 project (TypeScript, App Router, ESLint, Prettier)                 | ⬜ To Do  | TC-003                          |       |
| ST-0-2   | Create Supabase project (free tier, no credit card) and note URL + keys                  | ⬜ To Do  | TC-001, TC-003                  |       |
| ST-0-3   | Enable `pgvector` extension in Supabase SQL editor                                        | ⬜ To Do  | TC-002, TC-003                  |       |
| ST-0-4   | Create `.env.example` + `.env.local` with all required variable placeholders             | ⬜ To Do  | NFR-001, TC-005                 |       |
| ST-0-5   | Add `.gitignore` (covers `.env.local`, `node_modules`, `.next`, build artifacts)         | ⬜ To Do  | TC-005, NFR-001                 |       |
| ST-0-6   | Initialize Git repository and push initial commit to GitHub                               | ⬜ To Do  | TC-005                          |       |

---

### Stage 1: Database Schema & Supabase Client Setup
**Goal**: Execute all DDL to create the shared database schema, install the workspace-scoped vector search SQL function, and wire up the Supabase client for both server-side and client-side usage.
**Depends On**: Stage 0
**Scalability Note**: Schema is designed so that adding new entity types (e.g., comments, annotations) only requires new tables — `document_chunks` and its isolation function remain untouched. The `match_workspace_chunks` SQL function is the single enforcement point for isolation; future scale-out (read replicas, connection pooling) does not require changing this contract.

| Task ID  | Task Description                                                                          | Status    | Related FRs / NFRs / TCs        | Notes |
| :------- | :---------------------------------------------------------------------------------------- | :-------- | :------------------------------- | :---- |
| ST-1-1   | Create `workspaces` table (id, user_id, name, created_at)                                | ⬜ To Do  | FR-003                          |       |
| ST-1-2   | Create `documents` table (id, workspace_id, title, file_type, file_hash, status, created_at) | ⬜ To Do | FR-006, FR-009               |       |
| ST-1-3   | Create `document_chunks` table (id, workspace_id, document_id, content, metadata jsonb, embedding vector(768)) | ⬜ To Do | TC-002, FR-007, FR-008 |  |
| ST-1-4   | Create HNSW index on `document_chunks.embedding` for fast ANN search                     | ⬜ To Do  | TC-002, NFR-007                 |       |
| ST-1-5   | Create `match_workspace_chunks` SQL function (workspace-scoped cosine similarity search) | ⬜ To Do  | FR-010, NFR-003                 |       |
| ST-1-6   | Create `tasks` table (id, workspace_id, title, description, priority, status, created_at)| ⬜ To Do  | FR-016                          |       |
| ST-1-7   | Create `chat_messages` table (id, workspace_id, role, content, citations jsonb, retrieval_debug jsonb, created_at) | ⬜ To Do | FR-013 |   |
| ST-1-8   | Create `tool_calls_log` table (id, workspace_id, tool_name, arguments jsonb, result jsonb, status, created_at) | ⬜ To Do | FR-018 |    |
| ST-1-9   | Create Supabase client helpers: `lib/supabase/client.ts` (anon, browser) and `lib/supabase/server.ts` (service role, server-only) | ⬜ To Do | NFR-001, TC-004 | |

---

### Stage 2: Authentication
**Goal**: Implement complete sign-up, sign-in, and sign-out flows using Supabase Auth. Protect all dashboard routes via middleware. Ensure unauthenticated users can never reach protected pages.
**Depends On**: Stage 1
**Scalability Note**: Auth is entirely delegated to Supabase Auth. Adding OAuth providers (Google, GitHub) in the future requires only Supabase dashboard configuration — no code changes. The middleware pattern (checking session on every request) is provider-agnostic.

| Task ID  | Task Description                                                                          | Status    | Related FRs / NFRs / TCs        | Notes |
| :------- | :---------------------------------------------------------------------------------------- | :-------- | :------------------------------- | :---- |
| ST-2-1   | Create `/app/(auth)/sign-in` page with email + password form                             | ⬜ To Do  | FR-001                          |       |
| ST-2-2   | Create `/app/(auth)/sign-up` page with registration form and validation                  | ⬜ To Do  | FR-001                          |       |
| ST-2-3   | Implement sign-out action and redirect to sign-in page                                   | ⬜ To Do  | FR-002                          |       |
| ST-2-4   | Create Next.js middleware (`middleware.ts`) to guard all `/dashboard/*` routes           | ⬜ To Do  | FR-001, TS-003                  |       |
| ST-2-5   | Display currently authenticated user's email in the dashboard nav/header                 | ⬜ To Do  | FR-001                          |       |

---

### Stage 3: Workspace Management
**Goal**: Allow authenticated users to create multiple named workspaces and switch between them. All subsequent features (documents, chat, tasks, logs) must be scoped to the active workspace.
**Depends On**: Stage 2
**Scalability Note**: The `workspace_id` isolation pattern established here is the foundation of multi-tenancy. Future features (teams, shared workspaces, per-workspace settings) all extend from this same workspace entity without requiring schema changes to downstream tables.

| Task ID  | Task Description                                                                          | Status    | Related FRs / NFRs / TCs        | Notes |
| :------- | :---------------------------------------------------------------------------------------- | :-------- | :------------------------------- | :---- |
| ST-3-1   | Workspace creation API route / server action (POST `/api/workspaces`)                    | ⬜ To Do  | FR-003                          |       |
| ST-3-2   | Workspace list API route (GET `/api/workspaces`) — returns only workspaces for auth user | ⬜ To Do  | FR-003                          |       |
| ST-3-3   | Active workspace state management (context or Zustand store, persisted in localStorage)  | ⬜ To Do  | FR-004                          |       |
| ST-3-4   | Workspace Switcher UI component (sidebar or top nav, shows all workspaces, highlights active) | ⬜ To Do | FR-004                      |       |
| ST-3-5   | Switching workspace updates all dashboard views (documents, chat, tasks, tool log)       | ⬜ To Do  | FR-004, FR-005, TS-004          |       |

---

### Stage 4: Document Ingestion Pipeline
**Goal**: Build the end-to-end ingestion pipeline: file upload → text extraction → chunking → Gemini embedding → storage in the shared vector store (tagged with workspace_id). Implement idempotency via SHA-256 hash.
**Depends On**: Stage 3
**Scalability Note**: Ingestion is designed as a server-side pipeline that can be extracted into a standalone background worker or queue (e.g., BullMQ, Inngest) without changing the chunking or embedding logic. The `lib/ingestion/` module has no UI dependencies. Adding new file types (e.g., PPTX, HTML, CSV) only requires adding a new extractor — the chunking and embedding stages are file-type-agnostic.

| Task ID  | Task Description                                                                          | Status    | Related FRs / NFRs / TCs        | Notes |
| :------- | :---------------------------------------------------------------------------------------- | :-------- | :------------------------------- | :---- |
| ST-4-1   | File upload API route (POST `/api/documents/upload`) — accepts PDF, TXT; validates size ≤10 MB | ⬜ To Do | FR-006                    |       |
| ST-4-2   | SHA-256 hash computation on upload; duplicate detection against `documents.file_hash`    | ⬜ To Do  | FR-009, NFR-006, TS-006         |       |
| ST-4-3   | Text extraction: PDF parsing (`pdf-parse` or `pdfjs-dist`), plain text pass-through      | ⬜ To Do  | FR-006                          |       |
| ST-4-4   | Text chunking: recursive character splitter (200–600 tokens, 50-token overlap)           | ⬜ To Do  | FR-007                          |       |
| ST-4-5   | Gemini `text-embedding-004` integration — batch embed all chunks (server-side only)      | ⬜ To Do  | FR-008, NFR-001, INT-002        |       |
| ST-4-6   | Store chunk records in `document_chunks` with workspace_id, document_id, content, metadata, embedding | ⬜ To Do | FR-007, FR-008, TC-002 |   |
| ST-4-7   | Update `documents.status` to `ingested` on success; `failed` on error                   | ⬜ To Do  | FR-006, NFR-005                 |       |
| ST-4-8   | Document List UI component: shows all docs in active workspace with status badges        | ⬜ To Do  | FR-019                          |       |

---

### Stage 5: RAG Chat Pipeline
**Goal**: Implement the full RAG loop: embed user question → workspace-scoped vector retrieval → build LLM context with chunk boundary tags → get grounded answer with citations → honest refusal on empty retrieval. Persist chat messages per workspace.
**Depends On**: Stage 4
**Scalability Note**: The retrieval and LLM steps are isolated in `lib/rag/` with clean interfaces. Future improvements (hybrid search, re-ranking, streaming, multi-turn memory) are additive changes — they do not require restructuring the pipeline. The `match_workspace_chunks` function is the only retrieval entrypoint, which makes swapping the vector DB (e.g., to Pinecone, Weaviate) a single-file change.

| Task ID  | Task Description                                                                          | Status    | Related FRs / NFRs / TCs        | Notes |
| :------- | :---------------------------------------------------------------------------------------- | :-------- | :------------------------------- | :---- |
| ST-5-1   | Chat API route (POST `/api/chat`) — entry point for all RAG + tool-calling interactions  | ⬜ To Do  | FR-010, FR-011                  |       |
| ST-5-2   | Embed user query with `text-embedding-004` (server-side)                                 | ⬜ To Do  | FR-010, INT-002                 |       |
| ST-5-3   | Call `match_workspace_chunks` with workspace_id filter; retrieve top-5 chunks            | ⬜ To Do  | FR-010, NFR-003, TS-007         |       |
| ST-5-4   | Build LLM system prompt: chunk context wrapped in `<context_documents workspace_id="...">` tags with injection-resistant instructions | ⬜ To Do | FR-011, NFR-002, TS-015 |  |
| ST-5-5   | Gemini LLM call with retrieved context; grounded answer generation with citations        | ⬜ To Do  | FR-011, INT-001                 |       |
| ST-5-6   | Honest refusal logic: if retrieval returns 0 chunks or all below threshold, return refusal message | ⬜ To Do | FR-012, TS-010         |       |
| ST-5-7   | Persist chat messages to `chat_messages` table (user + assistant turns, with citations jsonb) | ⬜ To Do | FR-013                     |       |
| ST-5-8   | Chat UI component: message list with citation badges; chat input with loading state      | ⬜ To Do  | FR-011, NFR-009                 |       |
| ST-5-9   | Retrieval Debug Inspector: expandable panel per message showing chunks, similarity scores, workspace_id filter used | ⬜ To Do | FR-022, TS-007 |       |

---

### Stage 6: Tool Calling Loop
**Goal**: Define two Gemini function declarations, implement the multi-turn tool loop (model proposes → app validates via Zod → app executes → result fed back → model responds), and log every tool call attempt.
**Depends On**: Stage 5
**Scalability Note**: Tools are registered in a `lib/tools/registry.ts` file as a map of `{ name, zodSchema, handler }`. Adding new tools requires only adding a new entry to this registry — the tool loop in the chat API route is fully data-driven and requires zero changes. This pattern scales to dozens of tools without complexity growth.

| Task ID  | Task Description                                                                          | Status    | Related FRs / NFRs / TCs        | Notes |
| :------- | :---------------------------------------------------------------------------------------- | :-------- | :------------------------------- | :---- |
| ST-6-1   | Define Gemini Function Declarations for `save_workspace_task` and `send_channel_notification` | ⬜ To Do | FR-014                      |       |
| ST-6-2   | Implement Zod schemas for both tool argument structures                                  | ⬜ To Do  | FR-015, NFR-004                 |       |
| ST-6-3   | Tool registry (`lib/tools/registry.ts`): maps tool names to schemas and handlers         | ⬜ To Do  | FR-014, FR-015                  |       |
| ST-6-4   | Multi-turn tool loop in chat API route: detect function call response → validate → execute → return result to LLM | ⬜ To Do | FR-015, NFR-004, TS-013 |  |
| ST-6-5   | `save_workspace_task` handler: validates args, inserts into `tasks` table, returns confirmation | ⬜ To Do | FR-016, TS-011             |       |
| ST-6-6   | `send_channel_notification` handler: validates args, POSTs to Discord webhook (env var), returns status | ⬜ To Do | FR-017, TS-012, INT-004 |    |
| ST-6-7   | Unknown tool name guard: returns structured error to LLM, no crash (TS-014)              | ⬜ To Do  | NFR-004, TS-014                 |       |
| ST-6-8   | Tool call audit logging: write to `tool_calls_log` on every execution attempt (success or fail) | ⬜ To Do | FR-018                   |       |
| ST-6-9   | Task List UI component: shows workspace tasks created via tool calls                     | ⬜ To Do  | FR-020                          |       |
| ST-6-10  | Tool Call Log UI component: shows log entries with name, status badge, collapsible args/result | ⬜ To Do | FR-021                    |       |

---

### Stage 7: Security Hardening & Quality
**Goal**: Implement all security constraints from the NFRs — prompt injection defense, secret isolation verification, workspace isolation end-to-end test, graceful error handling, and idempotency verification.
**Depends On**: Stage 6
**Scalability Note**: Security controls are centralized in the API layer (`lib/security/`). As the app scales to a microservices model in the future, these controls become API gateway policies — the patterns established here (schema validation, context tagging, env-based secrets) directly map to gateway-level enforcement without re-engineering.

| Task ID  | Task Description                                                                          | Status    | Related FRs / NFRs / TCs        | Notes |
| :------- | :---------------------------------------------------------------------------------------- | :-------- | :------------------------------- | :---- |
| ST-7-1   | Prompt injection defense: verify system prompt wraps context in boundary tags and includes explicit data-only instruction | ⬜ To Do | NFR-002, TS-015 |      |
| ST-7-2   | Manual isolation test: upload doc with unique string to Workspace A; confirm Workspace B cannot retrieve it | ⬜ To Do | NFR-003, TS-007, TS-008 |   |
| ST-7-3   | Secret exposure audit: inspect browser DevTools network tab on deployed URL; confirm no keys visible | ⬜ To Do | NFR-001, TS-016 |           |
| ST-7-4   | LLM failure handling: simulate API timeout; verify user-visible error and input preservation | ⬜ To Do | NFR-005                       |       |
| ST-7-5   | Malformed tool argument test: simulate missing required field in tool call; verify Zod rejection and graceful recovery | ⬜ To Do | NFR-004, TS-013 |     |
| ST-7-6   | Idempotency end-to-end test: re-upload same document; verify chunk count unchanged        | ⬜ To Do  | NFR-006, TS-006                 |       |

---

### Stage 8: Deployment, Documentation & Final Deliverables
**Goal**: Deploy the application to Vercel on a public URL, prepare all required documentation (README, AGENTS.md, AI_NOTES.md, .env.example), pre-load demo workspaces, and verify the full evaluator test flow end-to-end on the live URL.
**Depends On**: Stage 7

| Task ID  | Task Description                                                                          | Status    | Related FRs / NFRs / TCs        | Notes |
| :------- | :---------------------------------------------------------------------------------------- | :-------- | :------------------------------- | :---- |
| ST-8-1   | Configure Vercel project; set all environment variables in Vercel dashboard               | ⬜ To Do  | TC-001, TC-004, NFR-001         |       |
| ST-8-2   | Deploy to Vercel and verify all routes are reachable on the public URL                   | ⬜ To Do  | TC-001                          |       |
| ST-8-3   | Pre-load two demo workspaces with sample documents (Workspace Alpha: Project Artemis, Workspace Beta: Project Neptune) | ⬜ To Do | TS-007, TS-008 |      |
| ST-8-4   | Write `README.md`: what the app does, local setup steps, env vars table, deployment notes | ⬜ To Do  | TC-005 (Deliverable)            |       |
| ST-8-5   | Write `AGENTS.md`: AI tools used, how agent-driven development was applied, key prompts   | ⬜ To Do  | TC-005 (Deliverable)            |       |
| ST-8-6   | Write `AI_NOTES.md`: tool usage breakdown, key decisions, hardest bug, what to improve   | ⬜ To Do  | TC-005 (Deliverable)            |       |
| ST-8-7   | Full end-to-end evaluator walkthrough on live URL: create workspace, upload doc, chat, trigger tools, verify isolation | ⬜ To Do | All FRs |                 |

---

## Blocked Items Log

*No blocked items at this time. This section will be updated as work progresses.*

| Task ID | Description | Blocked Reason | Unblocking Condition | Since |
| :------ | :---------- | :------------- | :------------------- | :---- |
| —       | —           | —              | —                    | —     |

---

## Scalability & Future Architecture Notes

> These notes capture decisions made today with future scale in mind. They do **NOT** change the
> current implementation scope but MUST be considered when making current implementation choices.
> When we move to the TDS, these notes will inform the architecture section.

- **Service Layer Abstraction**: All external service interactions (Gemini, Supabase, Discord) are
  wrapped in `lib/` modules with clean TypeScript interfaces. This makes swapping providers (e.g.,
  OpenAI for Gemini, Neon for Supabase, Slack for Discord) a single-file change with zero UI impact.
  In a future microservices split, each `lib/` module becomes a candidate for its own service.

- **Tool Registry Pattern**: Tools are registered in a data-driven registry (`lib/tools/registry.ts`).
  This pattern scales horizontally — adding 50 tools requires zero changes to the tool loop. In a
  microservices future, the registry becomes a tool service with its own API, and the chat service
  calls it via HTTP instead of importing it directly.

- **Ingestion Pipeline Decoupling**: The ingestion pipeline (`lib/ingestion/`) has no UI or HTTP
  dependencies. It is designed to be extracted into a background worker/queue (Inngest, BullMQ,
  Celery) when file volumes grow. The current synchronous execution in an API route is a
  conscious simplification for v1 — the interface contract does not need to change when async
  execution is introduced.

- **Database Isolation Contract**: The `match_workspace_chunks` SQL function is the **single
  enforcement point** for workspace isolation. All retrieval goes through this function. In a
  microservices architecture, this becomes a dedicated Retrieval Service with the same contract.
  Switching from pgvector to a dedicated vector database (Pinecone, Weaviate, Qdrant) only requires
  reimplementing this one function's interface.

- **Stateless API Routes**: All Next.js API routes and Server Actions are designed to be stateless —
  no in-memory state between requests. This makes horizontal scaling (multiple Vercel instances,
  Edge Runtime, container orchestration) trivial to adopt in the future.

- **Next.js App Router + Server Components**: The use of Server Components and Server Actions
  provides a natural boundary between client and server code. This boundary maps directly to a
  BFF (Backend-for-Frontend) pattern in a microservices model — the Next.js app becomes the BFF,
  and business logic services are extracted behind it.

- **Row-Level Security (Future)**: Supabase supports Row-Level Security (RLS) policies at the
  database level. For v1, isolation is enforced at the application layer (via `workspace_id` in
  queries). In future, enabling RLS on `document_chunks`, `tasks`, and `tool_calls_log` adds a
  second, database-enforced isolation layer as a defense-in-depth measure.
