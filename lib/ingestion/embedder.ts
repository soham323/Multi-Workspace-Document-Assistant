// lib/ingestion/embedder.ts
// Embeds text chunks in batches using Gemini 768-dim embeddings

import { embedBatch } from "@/lib/gemini/embeddings";
import type { TextChunk } from "./chunker";

export interface EmbeddedChunk {
  index: number;
  content: string;
  metadata: TextChunk["metadata"];
  embedding: number[];
}

/**
 * Generates vector embeddings for a list of text chunks.
 * Batches are processed through Gemini text-embedding-001.
 */
export async function embedChunks(chunks: TextChunk[]): Promise<EmbeddedChunk[]> {
  if (chunks.length === 0) return [];

  const texts = chunks.map((c) => c.content);
  const embeddings = await embedBatch(texts);

  if (embeddings.length !== chunks.length) {
    throw new Error(
      `Embedding count mismatch: expected ${chunks.length}, got ${embeddings.length}`
    );
  }

  return chunks.map((chunk, i) => ({
    index: chunk.index,
    content: chunk.content,
    metadata: chunk.metadata,
    embedding: embeddings[i],
  }));
}
