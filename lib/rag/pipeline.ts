// lib/rag/pipeline.ts
// Main RAG + Tool Calling pipeline orchestrator:
// 1. Vector retrieval
// 2. Context assembly with boundary protection
// 3. Gemini LLM generation with function calling tools
// 4. Multi-turn tool execution loop (validate -> execute -> feed back to LLM)
// 5. Grounded answer + citations + tool results

import { retrieveWorkspaceChunks } from "./retriever";
import { buildRagSystemPrompt, buildRefusalResponse } from "./prompt";
import { geminiClient, CHAT_MODEL } from "@/lib/gemini/client";
import { WORKSPACE_TOOLS, executeTool } from "@/lib/tools/registry";
import type { ChatTurn, ChatApiResponse, Citation, ToolCallResult } from "@/types/app";

/**
 * Executes the full RAG & Tool Calling pipeline for a user message.
 */
export async function runRagPipeline(
  question: string,
  workspaceId: string,
  history: ChatTurn[] = []
): Promise<ChatApiResponse> {
  // 1. Retrieve semantically matching chunks strictly within the workspace
  const { chunks, debug } = await retrieveWorkspaceChunks(question, workspaceId);

  // 2. Build system instructions
  let systemInstruction: string;
  if (chunks.length > 0) {
    systemInstruction = buildRagSystemPrompt(chunks, workspaceId);
  } else {
    // Zero chunks returned: allow tool execution if user requested action, otherwise instruct honest refusal
    systemInstruction = `You are an AI assistant for workspace ID "${workspaceId}".
No workspace documents matched the user's query.
- If the user is asking to create, save, or track a task, call the "save_workspace_task" tool.
- If the user is asking to notify the team or post to Discord, call the "send_channel_notification" tool.
- If the user is asking a factual question about documents that are not available, honestly state:
  "I could not find any relevant information in the documents of this workspace to answer your question."`;
  }

  // 3. Initialize Gemini model with tools & system instructions
  const model = geminiClient.getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: {
      role: "system",
      parts: [{ text: systemInstruction }],
    },
    tools: [{ functionDeclarations: WORKSPACE_TOOLS }],
    generationConfig: {
      temperature: 0.2, // Low temperature for high precision & reliable tool calling
      maxOutputTokens: 2048,
    },
  });

  // 4. Format multi-turn conversation history (last 10 turns)
  const recentHistory = history.slice(-10);
  const formattedHistory = recentHistory.map((turn) => ({
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.content }],
  }));

  const chat = model.startChat({
    history: formattedHistory,
  });

  const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || "30000", 10);

  async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`${operationName} timed out after ${timeoutMs / 1000}s. Please check your network or try again.`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timer!);
    }
  }

  // 5. First LLM turn
  let response = await withTimeout(
    chat.sendMessage(question),
    LLM_TIMEOUT_MS,
    "LLM chat generation"
  );
  const toolCallsMade: ToolCallResult[] = [];

  // 6. Multi-turn tool execution loop
  let iterations = 0;
  const MAX_TOOL_ITERATIONS = 5;

  while (iterations < MAX_TOOL_ITERATIONS) {
    const functionCalls = response.response.functionCalls();
    if (!functionCalls || functionCalls.length === 0) {
      break;
    }

    iterations++;
    const functionResponses: any[] = [];

    for (const call of functionCalls) {
      const toolResult = await executeTool(
        call.name,
        (call.args || {}) as Record<string, unknown>,
        workspaceId
      );
      toolCallsMade.push(toolResult);

      functionResponses.push({
        functionResponse: {
          name: call.name,
          response: toolResult.result ?? { error: toolResult.error },
        },
      });
    }

    // Feed tool results back into the conversation for the LLM to complete its turn
    response = await withTimeout(
      chat.sendMessage(functionResponses),
      LLM_TIMEOUT_MS,
      "LLM tool continuation"
    );
  }

  // 7. If no tool was called and zero document chunks matched, return honest refusal
  if (toolCallsMade.length === 0 && chunks.length === 0) {
    return {
      answer: buildRefusalResponse(question),
      citations: [],
      toolCallsMade: [],
      retrievalDebug: debug,
    };
  }

  const answerText = response.response.text();

  // 8. Format structured citations from the retrieved chunks (if chunks were used)
  const citations: Citation[] =
    chunks.length > 0
      ? chunks.map((chunk) => ({
          document_title: chunk.metadata.document_title || "Untitled Document",
          chunk_index: chunk.metadata.chunk_index ?? 0,
          similarity: chunk.similarity,
          excerpt:
            chunk.content.slice(0, 160).trim().replace(/\s+/g, " ") +
            (chunk.content.length > 160 ? "..." : ""),
        }))
      : [];

  return {
    answer: answerText,
    citations,
    toolCallsMade,
    retrievalDebug: debug,
  };
}
