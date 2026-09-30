// lib/ingestion/extractor.ts
// Multi-format document text extraction: PDF, DOCX, and TXT

import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
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
 */
export async function extractText(
  fileBuffer: Buffer,
  fileType: FileType
): Promise<ExtractedDocument> {
  let rawText = "";
  let pageCount: number | undefined;

  switch (fileType) {
    case "pdf": {
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
