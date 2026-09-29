// lib/ingestion/index.ts
// Main ingestion pipeline orchestrator.
// Called by POST /api/documents/upload after file validation.
// Coordinates: extract → chunk → embed → store

export async function runIngestionPipeline(
  _fileBuffer: Buffer,
  _fileType: string,
  _workspaceId: string,
  _documentId: string,
  _documentTitle: string
): Promise<{ chunkCount: number }> {
  // TODO: Stage 4 — implement full ingestion pipeline
  // 1. extractText(fileBuffer, fileType)
  // 2. chunkText(text)
  // 3. embedChunks(chunks)
  // 4. storeChunks(embeddedChunks, workspaceId, documentId)
  throw new Error("Ingestion pipeline not yet implemented — Stage 4");
}
