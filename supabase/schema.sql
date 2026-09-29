-- ================================================================
-- Multi-Workspace Document Assistant — Complete Database Schema
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ================================================================

-- STEP 0: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ================================================================
-- TABLE: workspaces
-- Purpose: Top-level multi-tenant isolation boundary.
-- ================================================================
CREATE TABLE IF NOT EXISTS workspaces (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workspaces' AND policyname = 'Users manage own workspaces'
  ) THEN
    CREATE POLICY "Users manage own workspaces"
      ON workspaces FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ================================================================
-- TABLE: documents
-- Purpose: Metadata record for each uploaded file (pdf, txt, docx).
-- ================================================================
CREATE TABLE IF NOT EXISTS documents (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  file_type    TEXT        NOT NULL CHECK (file_type IN ('pdf', 'txt', 'docx')),
  file_hash    TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'processing'
                           CHECK (status IN ('processing', 'ingested', 'failed')),
  chunk_count  INT         DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_workspace_hash
  ON documents(workspace_id, file_hash);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Users manage workspace documents'
  ) THEN
    CREATE POLICY "Users manage workspace documents"
      ON documents FOR ALL
      USING (
        workspace_id IN (
          SELECT id FROM workspaces WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ================================================================
-- TABLE: document_chunks
-- Purpose: Shared vector store with workspace_id isolation.
-- ================================================================
CREATE TABLE IF NOT EXISTS document_chunks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id  UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content      TEXT        NOT NULL,
  metadata     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  embedding    vector(768),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chunks_workspace_id ON document_chunks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id  ON document_chunks(document_id);

CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
  ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'document_chunks' AND policyname = 'Users access workspace chunks'
  ) THEN
    CREATE POLICY "Users access workspace chunks"
      ON document_chunks FOR ALL
      USING (
        workspace_id IN (
          SELECT id FROM workspaces WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ================================================================
-- TABLE: tasks
-- Purpose: Records tasks created by save_workspace_task tool.
-- ================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description  TEXT,
  priority     TEXT        NOT NULL DEFAULT 'medium'
                           CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status       TEXT        NOT NULL DEFAULT 'todo'
                           CHECK (status IN ('todo', 'in_progress', 'done')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON tasks(workspace_id);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users manage workspace tasks'
  ) THEN
    CREATE POLICY "Users manage workspace tasks"
      ON tasks FOR ALL
      USING (
        workspace_id IN (
          SELECT id FROM workspaces WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ================================================================
-- TABLE: chat_messages
-- Purpose: Persistent chat history per workspace.
-- ================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role             TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content          TEXT        NOT NULL,
  citations        JSONB       DEFAULT '[]'::jsonb,
  retrieval_debug  JSONB       DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_workspace_id ON chat_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at   ON chat_messages(created_at);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users access workspace chat'
  ) THEN
    CREATE POLICY "Users access workspace chat"
      ON chat_messages FOR ALL
      USING (
        workspace_id IN (
          SELECT id FROM workspaces WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ================================================================
-- TABLE: tool_calls_log
-- Purpose: Immutable audit log of every tool execution attempt.
-- ================================================================
CREATE TABLE IF NOT EXISTS tool_calls_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tool_name    TEXT        NOT NULL,
  arguments    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  result       JSONB       DEFAULT '{}'::jsonb,
  status       TEXT        NOT NULL CHECK (status IN ('success', 'failure', 'validation_error')),
  error_msg    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tool_log_workspace_id ON tool_calls_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tool_log_created_at   ON tool_calls_log(created_at);

ALTER TABLE tool_calls_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tool_calls_log' AND policyname = 'Users view workspace tool logs'
  ) THEN
    CREATE POLICY "Users view workspace tool logs"
      ON tool_calls_log FOR ALL
      USING (
        workspace_id IN (
          SELECT id FROM workspaces WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ================================================================
-- FUNCTION: match_workspace_chunks
-- Purpose: Cosine similarity vector search strictly within one workspace.
-- ================================================================
CREATE OR REPLACE FUNCTION match_workspace_chunks(
  query_embedding     vector(768),
  filter_workspace_id UUID,
  match_threshold     FLOAT  DEFAULT 0.40,
  match_count         INT    DEFAULT 5
)
RETURNS TABLE (
  id            UUID,
  document_id   UUID,
  workspace_id  UUID,
  content       TEXT,
  metadata      JSONB,
  similarity    FLOAT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    dc.id,
    dc.document_id,
    dc.workspace_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM
    document_chunks dc
  WHERE
    dc.workspace_id = filter_workspace_id
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY
    dc.embedding <=> query_embedding ASC
  LIMIT match_count;
$$;
