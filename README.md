# Multi-Workspace Document Assistant (RAG & Tool Calling)

> An enterprise-grade, multi-tenant document assistant featuring grounded RAG, workspace vector isolation inside a shared store, and multi-step tool calling with automated multi-model failover.

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5.0-black?logo=next.js)](https://nextjs.org/)
[![Supabase pgvector](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/LLM-Gemini_2.5_/_2.0_/_1.5_Flash-4285F4?logo=google)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vercel Deployed](https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel)](https://vercel.com/)

---

## 🌟 Executive Summary & Features

The **Multi-Workspace Document Assistant** is a full-stack Next.js application that enables users to organize their knowledge across isolated workspaces, upload domain documents (PDF, DOCX, TXT), ask questions strictly grounded in the active workspace's corpus, and trigger autonomous tools with real-world side effects.

### Core Capabilities
- 🏢 **Multi-Workspace Isolation in a Shared Store**: Every workspace's document chunks reside in a **single shared PostgreSQL table** (`document_chunks`). Multi-tenant isolation is enforced at the query level via a PostgreSQL RPC (`match_workspace_chunks`) with `workspace_id = p_workspace_id` filtering during the HNSW vector search. Cross-tenant leakage is mathematically impossible.
- 📚 **Robust Ingestion Pipeline**: Ingests `.pdf`, `.docx`, and `.txt` files up to 10MB. Computes SHA-256 hashes to guarantee idempotency (prevents duplicate chunks on re-upload). Employs recursive token-aware chunking (500 tokens, 50-token overlap) and computes 768-dimensional embeddings using Google's `text-embedding-004`.
- 🔍 **Strictly Grounded RAG with Citations**: Retrieves the Top-K most relevant chunks using cosine similarity. Answers cite source documents and section headers (e.g., `[Artemis Specs § Propulsion]`). Includes an honest refusal guard: if the workspace corpus lacks the answer, the assistant responds *"I do not have enough information in the active workspace's documents to answer this question."*
- 🛡️ **Prompt Injection Hardening**: Wraps untrusted retrieved chunks inside `<context_documents>` XML boundary tags with explicit data-only directives. Sanitizes premature closing tags (`</context_documents>`) to neutralize jailbreak attempts.
- ⚡ **Autonomous Tool-Calling Loop**: Supports autonomous multi-step tool execution (up to 5 turns):
  - `save_workspace_task`: Records actionable tasks directly into the active workspace database.
  - `send_channel_notification`: Dispatches rich embeds to a Discord channel webhook with dynamic priority color coding and workspace attribution.
- 🔄 **Multi-Model Dynamic Failover Chain**: Automatically fails over across Google Gemini models (`gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-1.5-flash`) with exponential backoff on transient HTTP 503 (high demand) or 429 rate limit spikes. LLM calls are wrapped with a 30s timeout and client input preservation.

### Stretch Goals Implemented
1. 🔬 **Retrieval-Debug Inspector**: Clickable live inspector showing retrieved chunk IDs, similarity scores, token counts, and source filenames directly below assistant messages to visibly prove workspace isolation.
2. 🔁 **Multi-Step Tool Calling**: Autonomous decision loop where the model can execute a tool (e.g., `save_workspace_task`), inspect the response, and execute a second tool (e.g., `send_channel_notification`) before returning a final answer.
3. 📊 **Observability & Audit Trail**: Real-time interactive UI displaying every tool call execution attempt with status badges (`success`, `validation_error`, `execution_error`), latency, and collapsible raw JSON inputs/outputs.

---

## 🏛️ System Architecture

```
                                  [ Browser / Client ]
                                           │
                          ┌────────────────┴────────────────┐
                          ▼                                 ▼
                 [ Dashboard UI ]                   [ Chat Interface ]
               - Document Ingestion               - Streaming & Citations
               - Workspace Switcher               - Debug Inspector Modal
               - Tool Call Audit Logs             - Task Board
                          │                                 │
                          └────────────────┬────────────────┘
                                           │ HTTPS
                                           ▼
                           [ Next.js 15 App Router (BFF) ]
                ┌──────────────────────────┼──────────────────────────┐
                ▼                          ▼                          ▼
       /api/workspaces/upload        /api/chat                  /api/tools
       - MIME & Size check           - Injection-proof prompt   - Zod arg validation
       - SHA-256 idempotency         - Vector retrieval RPC     - Multi-turn loop (max 5)
       - Chunker (500 tok / 50 ov)   - Failover Chain LLM       - Audit logger
                │                          │                          │
                ▼                          ▼                          ▼
      [ Google Gemini API ]      [ Supabase PostgreSQL ]    [ External Integrations ]
      - text-embedding-004       - HNSW vector index (768d) - Discord Webhook
      - gemini-2.5 / 2.0 / 1.5   - match_workspace_chunks() - Workspace Tasks
```

---

## 🚀 Live Deployment

The application is deployed on Vercel:
- **Live URL**: [https://multi-workspace-document-assistant.vercel.app](https://multi-workspace-document-assistant.vercel.app) *(or your deployed Vercel domain)*
- **Demo / Evaluator Credentials**:
  - **Email**: `evaluator@document-assistant.internal` *(or sign up with any test email)*
  - **Password**: `Evaluator2026!`

---

## 🧪 Evaluator Walkthrough (Testing Isolation & Tools)

Pre-loaded sample files are located in the [`demo_data/`](file:///d:/Projects/Multi-Workspace%20Document%20Assistant/demo_data) directory:
- [`demo_data/workspace_alpha_artemis.txt`](file:///d:/Projects/Multi-Workspace%20Document%20Assistant/demo_data/workspace_alpha_artemis.txt): Deep space satellite mission specs, Xenon ion thruster details, budget code `#ART-8821-ALPHA`, and secret canary `CYGNUS-GOLDEN-EAGLE-994`.
- [`demo_data/workspace_beta_neptune.txt`](file:///d:/Projects/Multi-Workspace%20Document%20Assistant/demo_data/workspace_beta_neptune.txt): Deep-sea submarine specs, Titanium hull depth rating, budget code `#NEP-4412-BETA`, and secret canary `ABYSSAL-SAPPHIRE-KRAKEN-771`.

### Step 1: Sign In & Setup Workspaces
1. Open the deployed application and sign in.
2. In the top navigation, click the **Workspace Switcher** and create two workspaces:
   - `Workspace Alpha` (e.g., "Project Artemis")
   - `Workspace Beta` (e.g., "Project Neptune")

### Step 2: Upload Partitioned Knowledge
1. Switch to **Workspace Alpha** and upload `demo_data/workspace_alpha_artemis.txt`.
2. Switch to **Workspace Beta** and upload `demo_data/workspace_beta_neptune.txt`.

### Step 3: Verify Grounded RAG & Citations
1. In **Workspace Alpha**, ask:
   > *"What propulsion engine does Artemis use and what is the specific impulse?"*
2. **Observe**: The assistant answers Xenon Dual-Grid Ion Drive (4,200s Isp) with explicit citation tags `[workspace_alpha_artemis.txt]`.
3. Click the **Debug Inspector** pill under the message to view the retrieved chunk score and verify `workspace_id` matches Alpha.

### Step 4: Verify Multi-Tenant Vector Isolation (The Canary Test)
1. Still inside **Workspace Alpha**, ask:
   > *"What is the secret canary code for Project Neptune, and what depth can it dive to?"*
2. **Observe**: The assistant honestly refuses:
   > *"I do not have enough information in the active workspace's documents to answer this question."*
3. Switch to **Workspace Beta** and ask the same question.
4. **Observe**: The assistant immediately answers with `ABYSSAL-SAPPHIRE-KRAKEN-771` and 10,920 meters!

### Step 5: Verify Multi-Step Tool Calling & Side Effects
1. In **Workspace Alpha**, ask:
   > *"According to the emergency protocols in Artemis, if thruster pressure exceeds 1,200 kPa, what maintenance task should be logged? Please log it as a high priority task and send an alert notification to the ground operations channel."*
2. **Observe**:
   - The assistant autonomously executes `save_workspace_task` to insert "Inspect thruster manifold valves" with `high` priority.
   - The assistant then executes `send_channel_notification` with a Discord alert embed.
   - Look at the **Workspace Tasks** card on the dashboard: the new task appears immediately.
   - Look at the **Tool Call Log** card on the dashboard: two audit entries appear with `success` status badges and collapsible arguments.

---

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js 18.18+ or 20+
- A free [Supabase](https://supabase.com/) account (PostgreSQL + pgvector + Auth)
- A free [Google AI Studio](https://aistudio.google.com/) API key (Gemini models)
- *(Optional)* A Discord server webhook URL for notification testing

### 2. Clone Repository & Install Dependencies
```bash
git clone https://github.com/soham323/Multi-Workspace-Document-Assistant.git
cd Multi-Workspace-Document-Assistant
npm install
```

### 3. Database Schema Setup
1. In your Supabase Dashboard, navigate to the **SQL Editor**.
2. Copy the contents of [`supabase/schema.sql`](file:///d:/Projects/Multi-Workspace%20Document%20Assistant/supabase/schema.sql) and run it.
3. This will enable `pgvector`, create all 6 relational tables (`workspaces`, `workspace_members`, `documents`, `document_chunks`, `tasks`, `tool_calls_log`), configure HNSW vector indexes, and deploy the `match_workspace_chunks` RPC function.

### 4. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the credentials:
```ini
# Supabase (Auth + Client)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Supabase (Server Service Role - Bypasses RLS for secure backend operations)
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Google Gemini (Free Tier - AI Studio)
GEMINI_API_KEY=<your-gemini-api-key>

# Discord Webhook (Free Channel Webhook)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/<id>/<token>
```

### 5. Run Security Scans & Dev Server
```bash
# Verify no secret leaks exist
node scripts/scan-secrets.mjs

# Run automated security and hardening verification suite
npm run test:security

# Start Next.js local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Invariants

1. **Zero Secret Exposure**: Server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `DISCORD_WEBHOOK_URL`) are isolated to backend API routes and never bundled into client-side JS or logs. Enforced via `.githooks/pre-commit` and `scripts/scan-secrets.mjs`.
2. **Schema-Enforced Tool Execution**: All tool parameters are validated using strict Zod schemas. Invalid arguments or missing fields trigger a structured LLM feedback loop without server exceptions.
3. **Idempotency Guarantee**: Files are hashed using SHA-256 before extraction. Re-uploading identical documents returns an HTTP 409 conflict and prevents chunk duplication.
4. **Resilient LLM Timeout**: All model calls enforce a 30s deadline with backoff retries. Client UI retains user queries in the event of upstream network failures.

---

## 📄 License
MIT License. Built for the Multi-Workspace Document Assistant Evaluation.
