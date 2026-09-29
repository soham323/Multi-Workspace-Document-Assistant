// lib/rag/pipeline.ts
// Main RAG pipeline orchestrator.
// Called by POST /api/chat.
// Coordinates: embed query → retrieve chunks → build prompt → LLM call

import type { ChatTurn, ChatApiResponse } from "@/types/app";

export async function runRagPipeline(
  _question: string,
  _workspaceId: string,
  _history: ChatTurn[]
): Promise<ChatApiResponse> {
  // TODO: Stage 5 — implement full RAG pipeline
  // 1. embedText(question)
  // 2. retrieveChunks(queryVector, workspaceId)
  // 3. buildSystemPrompt(chunks, workspaceId)
  // 4. gemini.generateContentStream(prompt, history, tools)
  // 5. tool loop if function_call detected
  // 6. return final answer + citations + debug
  throw new Error("RAG pipeline not yet implemented — Stage 5");
}
