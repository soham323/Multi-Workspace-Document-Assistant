// lib/gemini/embeddings.ts
// Generates text embeddings using Gemini text-embedding-004 (768 dimensions).
// All embedding calls are server-side only.

import { geminiClient, EMBEDDING_MODEL } from "./client";

/**
 * Embed a single text string.
 * Used for embedding user queries before retrieval.
 */
export async function embedText(text: string): Promise<number[]> {
  const model = geminiClient.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Embed multiple texts in a single batch call.
 * Used during document ingestion to embed all chunks efficiently.
 * Gemini supports up to 100 texts per batch request.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const model = geminiClient.getGenerativeModel({ model: EMBEDDING_MODEL });

  // Process in chunks of 100 (Gemini batch limit)
  const BATCH_SIZE = 100;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchResult = await model.batchEmbedContents({
      requests: batch.map((text) => ({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }], role: "user" },
      })),
    });
    results.push(...batchResult.embeddings.map((e) => e.values));
  }

  return results;
}
