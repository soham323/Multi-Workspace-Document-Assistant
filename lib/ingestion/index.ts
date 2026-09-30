// lib/ingestion/index.ts
// Ingestion pipeline orchestrator: Extract -> Chunk -> Embed -> Store -> Update status

import { extractText } from "./extractor";
import { chunkDocumentText } from "./chunker";
import { embedChunks } from "./embedder";
import { createServerClient } from "@/lib/supabase/server";
import type { FileType } from "@/types/app";
import type { Json } from "@/types/database";

export interface IngestionResult {
  chunkCount: number;
  documentTitle: string;
}

/**
 * Executes the complete document ingestion pipeline.
 */
export async function runIngestionPipeline(
  fileBuffer: Buffer,
  fileType: FileType,
  workspaceId: string,
  documentId: string,
  documentTitle: string
): Promise<IngestionResult> {
  const supabase = createServerClient();

  try {
    // 1. Text extraction
    const { text, pageCount } = await extractText(fileBuffer, fileType);

    // 2. Text chunking
    const chunks = chunkDocumentText(text, {
      documentTitle,
      pageNumber: pageCount ? 1 : undefined,
    });

    if (chunks.length === 0) {
      throw new Error("No text chunks could be extracted from document.");
    }

    // 3. Batch embedding via Gemini (768-dim)
    const embeddedChunks = await embedChunks(chunks);

    // 4. Batch store in document_chunks table (shared vector store with workspace_id isolation)
    const CHUNK_INSERT_BATCH_SIZE = 50;
    for (let i = 0; i < embeddedChunks.length; i += CHUNK_INSERT_BATCH_SIZE) {
      const batch = embeddedChunks.slice(i, i + CHUNK_INSERT_BATCH_SIZE);
      const rows = batch.map((c) => ({
        workspace_id: workspaceId,
        document_id: documentId,
        content: c.content,
        metadata: c.metadata as unknown as Json,
        embedding: c.embedding,
      }));

      const { error: insertError } = await supabase
        .from("document_chunks")
        .insert(rows);

      if (insertError) {
        throw new Error(`Failed to store chunks: ${insertError.message}`);
      }
    }

    // 5. Update document status to 'ingested'
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        status: "ingested",
        chunk_count: embeddedChunks.length,
      })
      .eq("id", documentId);

    if (updateError) {
      console.error("Warning: Failed to update document status to ingested:", updateError);
    }

    return {
      chunkCount: embeddedChunks.length,
      documentTitle,
    };
  } catch (error: unknown) {
    // On failure: mark document as 'failed' in DB
    const errorMessage = error instanceof Error ? error.message : "Unknown ingestion error";
    console.error(`Ingestion failed for document ${documentId}:`, errorMessage);

    try {
      await supabase
        .from("documents")
        .update({ status: "failed" })
        .eq("id", documentId);
    } catch {
      // Ignore secondary error during failure marking
    }

    throw error;
  }
}
