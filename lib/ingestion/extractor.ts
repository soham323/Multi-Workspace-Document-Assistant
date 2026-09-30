// lib/ingestion/extractor.ts
// Multi-format document text extraction: PDF, DOCX, and TXT

import type { FileType } from "@/types/app";

export interface ExtractedDocument {
  text: string;
  pageCount?: number;
}

/**
 * Normalizes raw extracted text:
 * - Converts CRLF to LF
 * - Strips null bytes and unusual control chars
 * - Collapses excessive blank lines (>2)
 * - Trims edges
 */
export function cleanText(raw: string): string {
  return raw
    .replace(/\0/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extracts plain text from an uploaded file buffer based on its fileType.
 * Uses dynamic imports to prevent serverless bundle crashes and ensure
 * TXT processing is instant without loading native/worker dependencies.
 */
export async function extractText(
  fileBuffer: Buffer,
  fileType: FileType
): Promise<ExtractedDocument> {
  let rawText = "";
  let pageCount: number | undefined;

  switch (fileType) {
    case "pdf": {
      // Dynamically load pdf-parse worker and parser only when needed
      await import("pdf-parse/worker");
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: fileBuffer });
      try {
        const textResult = await parser.getText();
        rawText = textResult.text || "";
        pageCount = textResult.pages?.length;
      } finally {
        await parser.destroy().catch(() => {});
      }
      break;
    }

    case "docx": {
      // Dynamically load mammoth only when a DOCX is uploaded
      const mammothModule = await import("mammoth");
      const mammoth = mammothModule.default || mammothModule;
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      rawText = result.value || "";
      break;
    }

    case "txt": {
      rawText = fileBuffer.toString("utf-8");
      break;
    }

    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }

  const cleaned = cleanText(rawText);

  if (!cleaned || cleaned.replace(/\s/g, "").length < 5) {
    throw new Error("The uploaded document contains no readable text.");
  }

  return {
    text: cleaned,
    pageCount,
  };
}
