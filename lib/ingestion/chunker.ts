// lib/ingestion/chunker.ts
// Recursive character text chunker with configurable token size and overlap

export interface TextChunk {
  index: number;
  content: string;
  tokenCount: number;
  metadata: {
    document_title: string;
    chunk_index: number;
    token_count: number;
    page_number?: number;
  };
}

export interface ChunkerOptions {
  documentTitle: string;
  chunkSizeTokens?: number;
  chunkOverlapTokens?: number;
  pageNumber?: number;
}

// Approximate token estimation: ~4 chars per token for English text
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const SEPARATORS = ["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " "];

/**
 * Recursively splits text into segments no larger than maxChars.
 */
function splitTextRecursive(text: string, maxChars: number, separatorIndex: number = 0): string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  if (separatorIndex >= SEPARATORS.length) {
    // Hard cutoff fallback
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += maxChars) {
      chunks.push(text.slice(i, i + maxChars));
    }
    return chunks;
  }

  const separator = SEPARATORS[separatorIndex];
  const parts = text.split(separator);

  const result: string[] = [];
  let currentGroup = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const candidate = currentGroup.length === 0 ? part : currentGroup + separator + part;

    if (candidate.length <= maxChars) {
      currentGroup = candidate;
    } else {
      if (currentGroup.length > 0) {
        result.push(currentGroup);
      }
      if (part.length > maxChars) {
        // Recurse on the oversized sub-part using the next finer separator
        const subChunks = splitTextRecursive(part, maxChars, separatorIndex + 1);
        result.push(...subChunks);
        currentGroup = "";
      } else {
        currentGroup = part;
      }
    }
  }

  if (currentGroup.length > 0) {
    result.push(currentGroup);
  }

  return result;
}

/**
 * Chunks a document's extracted text into overlapping segments with metadata.
 */
export function chunkDocumentText(
  text: string,
  options: ChunkerOptions
): TextChunk[] {
  const targetTokens = options.chunkSizeTokens || parseInt(process.env.CHUNK_SIZE_TOKENS || "500", 10);
  const overlapTokens = options.chunkOverlapTokens || parseInt(process.env.CHUNK_OVERLAP_TOKENS || "50", 10);

  const maxChars = targetTokens * 4;
  const overlapChars = overlapTokens * 4;

  const rawSegments = splitTextRecursive(text, maxChars);
  const finalChunks: TextChunk[] = [];

  let accumulated = "";
  let chunkIdx = 0;

  for (let i = 0; i < rawSegments.length; i++) {
    const segment = rawSegments[i].trim();
    if (!segment) continue;

    if (accumulated.length === 0) {
      accumulated = segment;
    } else if (accumulated.length + segment.length + 1 <= maxChars) {
      accumulated += "\n\n" + segment;
    } else {
      // Push accumulated chunk
      const content = accumulated.trim();
      const tokenCount = estimateTokens(content);

      finalChunks.push({
        index: chunkIdx,
        content,
        tokenCount,
        metadata: {
          document_title: options.documentTitle,
          chunk_index: chunkIdx,
          token_count: tokenCount,
          page_number: options.pageNumber,
        },
      });
      chunkIdx++;

      // Compute overlap from end of accumulated content
      const overlapStart = Math.max(0, content.length - overlapChars);
      const overlapText = content.slice(overlapStart);
      accumulated = (overlapText + "\n\n" + segment).trim();
    }
  }

  if (accumulated.trim().length > 0) {
    const content = accumulated.trim();
    const tokenCount = estimateTokens(content);
    finalChunks.push({
      index: chunkIdx,
      content,
      tokenCount,
      metadata: {
        document_title: options.documentTitle,
        chunk_index: chunkIdx,
        token_count: tokenCount,
        page_number: options.pageNumber,
      },
    });
  }

  return finalChunks;
}
