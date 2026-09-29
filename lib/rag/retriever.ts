// lib/rag/retriever.ts
// Handles embedding user queries and retrieving top-k chunks from Supabase pgvector via match_workspace_chunks RPC

import { embedText } from "@/lib/gemini/embeddings";
import { createServerClient } from "@/lib/supabase/server";
import type { RankedChunk, RetrievalDebug } from "@/types/app";

export interface RetrievalResult {
  chunks: RankedChunk[];
  latencyMs: number;
  debug: RetrievalDebug;
}

const DEFAULT_MATCH_THRESHOLD = 0.35;
const DEFAULT_MATCH_COUNT = 5;

/**
 * Embeds user query and searches for relevant chunks strictly within the specified workspace.
 */
export async function retrieveWorkspaceChunks(
  query: string,
  workspaceId: string,
  options?: {
    threshold?: number;
    limit?: number;
  }
): Promise<RetrievalResult> {
  const startTime = Date.now();
  const threshold = options?.threshold ?? DEFAULT_MATCH_THRESHOLD;
  const limit = options?.limit ?? DEFAULT_MATCH_COUNT;

  // 1. Embed query into 768-dimensional vector
  const queryEmbedding = await embedText(query);

  // 2. Call match_workspace_chunks RPC with strict workspace_id filter
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("match_workspace_chunks", {
    query_embedding: queryEmbedding,
    filter_workspace_id: workspaceId,
    match_threshold: threshold,
    match_count: limit,
  });

  const latencyMs = Date.now() - startTime;

  if (error) {
    throw new Error(`Vector retrieval RPC error: ${error.message}`);
  }

  const rawRows = (data ?? []) as Array<{
    id: string;
    document_id: string;
    workspace_id: string;
    content: string;
    metadata: {
      document_title?: string;
      chunk_index?: number;
      token_count?: number;
      page_number?: number;
      [key: string]: unknown;
    };
    similarity: number;
  }>;

  const chunks: RankedChunk[] = rawRows.map((row) => ({
    id: row.id,
    document_id: row.document_id,
    workspace_id: row.workspace_id,
    content: row.content,
    metadata: {
      document_title: row.metadata?.document_title || "Untitled Document",
      chunk_index: row.metadata?.chunk_index ?? 0,
      token_count: row.metadata?.token_count,
      page_number: row.metadata?.page_number,
    },
    similarity: Math.round(row.similarity * 1000) / 1000,
  }));

  const debug: RetrievalDebug = {
    workspace_id: workspaceId,
    chunks_retrieved: chunks.length,
    match_threshold: threshold,
    latency_ms: latencyMs,
    sql_filter: `workspace_id = '${workspaceId}' AND 1 - (embedding <=> query) > ${threshold}`,
  };

  return { chunks, latencyMs, debug };
}
