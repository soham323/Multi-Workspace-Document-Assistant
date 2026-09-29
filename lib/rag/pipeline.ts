// lib/rag/pipeline.ts
// Main RAG pipeline orchestrator:
// Embed query -> Retrieve workspace chunks -> Honest refusal or Grounded LLM generation with citations

import { retrieveWorkspaceChunks } from "./retriever";
import { buildRagSystemPrompt, buildRefusalResponse } from "./prompt";
import { geminiClient, CHAT_MODEL } from "@/lib/gemini/client";
import type { ChatTurn, ChatApiResponse, Citation } from "@/types/app";

/**
 * Executes the full RAG pipeline for a user question in an active workspace.
 */
export async function runRagPipeline(
  question: string,
  workspaceId: string,
  history: ChatTurn[] = []
): Promise<ChatApiResponse> {
  // 1. Retrieve semantically matching chunks strictly within the workspace
  const { chunks, debug } = await retrieveWorkspaceChunks(question, workspaceId);

  // 2. Honest refusal if zero chunks met the relevance threshold
  if (chunks.length === 0) {
    return {
      answer: buildRefusalResponse(question),
      citations: [],
      toolCallsMade: [],
      retrievalDebug: debug,
    };
  }

  // 3. Build hardened system prompt with document chunks in XML boundary tags
  const systemInstruction = buildRagSystemPrompt(chunks, workspaceId);

  // 4. Initialize Gemini chat model with system instructions
  const model = geminiClient.getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: {
      role: "system",
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 0.2, // Low temperature for high factual grounding
      maxOutputTokens: 2048,
    },
  });

  // 5. Format multi-turn conversation history (last 10 turns max)
  // Gemini expects role: "user" | "model"
  const recentHistory = history.slice(-10);
  const formattedHistory = recentHistory.map((turn) => ({
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.content }],
  }));

  // 6. Generate grounded answer
  const chat = model.startChat({
    history: formattedHistory,
  });

  const response = await chat.sendMessage(question);
  const answerText = response.response.text();

  // 7. Format structured citations from the retrieved chunks
  const citations: Citation[] = chunks.map((chunk) => ({
    document_title: chunk.metadata.document_title || "Untitled Document",
    chunk_index: chunk.metadata.chunk_index ?? 0,
    similarity: chunk.similarity,
    excerpt:
      chunk.content.slice(0, 160).trim().replace(/\s+/g, " ") +
      (chunk.content.length > 160 ? "..." : ""),
  }));

  return {
    answer: answerText,
    citations,
    toolCallsMade: [],
    retrievalDebug: debug,
  };
}
