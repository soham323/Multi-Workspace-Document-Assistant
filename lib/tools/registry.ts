// lib/tools/registry.ts
// Tool registry — maps tool names to Zod schemas, handlers, and audit logging

import { z } from "zod";
import type { FunctionDeclaration } from "@google/generative-ai";
import {
  saveWorkspaceTaskDeclaration,
  sendChannelNotificationDeclaration,
  WORKSPACE_TOOLS,
} from "./declarations";
import { SaveWorkspaceTaskSchema } from "./schemas/saveWorkspaceTask";
import { SendChannelNotifSchema } from "./schemas/sendChannelNotif";
import { saveWorkspaceTaskHandler } from "./handlers/saveWorkspaceTask";
import { sendChannelNotifHandler } from "./handlers/sendChannelNotif";
import { createServerClient } from "@/lib/supabase/server";
import type { ToolCallResult, ToolCallStatus } from "@/types/app";
import type { Json } from "@/types/database";

export interface ToolDefinition<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  declaration: FunctionDeclaration;
  schema: TSchema;
  handler: (args: z.infer<TSchema>, workspaceId: string) => Promise<Record<string, unknown>>;
}

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  save_workspace_task: {
    declaration: saveWorkspaceTaskDeclaration,
    schema: SaveWorkspaceTaskSchema,
    handler: saveWorkspaceTaskHandler as any,
  },
  send_channel_notification: {
    declaration: sendChannelNotificationDeclaration,
    schema: SendChannelNotifSchema,
    handler: sendChannelNotifHandler as any,
  },
};

export { WORKSPACE_TOOLS };

/**
 * Audit log helper: records all execution attempts to tool_calls_log table.
 */
async function logToolCall(
  workspaceId: string,
  toolName: string,
  args: Record<string, unknown>,
  status: ToolCallStatus,
  result?: Record<string, unknown>,
  errorMsg?: string
) {
  try {
    const supabase = createServerClient();
    await supabase.from("tool_calls_log").insert({
      workspace_id: workspaceId,
      tool_name: toolName,
      arguments: args as unknown as Json,
      result: (result ?? null) as unknown as Json,
      status,
      error_msg: errorMsg ?? null,
    });
  } catch (logErr) {
    console.error("Warning: Failed to write to tool_calls_log:", logErr);
  }
}

/**
 * Validates arguments against Zod schema, executes the registered handler,
 * logs the execution attempt to tool_calls_log, and returns a structured ToolCallResult.
 */
export async function executeTool(
  toolName: string,
  rawArgs: Record<string, unknown> = {},
  workspaceId: string
): Promise<ToolCallResult> {
  const tool = TOOL_REGISTRY[toolName];

  // 1. Unknown tool guard (TS-014)
  if (!tool) {
    const errorMsg = `Unknown tool "${toolName}". Available tools: ${Object.keys(TOOL_REGISTRY).join(", ")}`;
    await logToolCall(workspaceId, toolName, rawArgs, "failure", undefined, errorMsg);
    return {
      tool: toolName,
      status: "failure",
      error: errorMsg,
    };
  }

  // 2. Validate arguments with Zod schema
  const parseResult = tool.schema.safeParse(rawArgs);
  if (!parseResult.success) {
    const validationDetails = JSON.stringify(parseResult.error.flatten().fieldErrors);
    const errorMsg = `Invalid arguments for ${toolName}: ${validationDetails}`;
    await logToolCall(workspaceId, toolName, rawArgs, "validation_error", undefined, errorMsg);
    return {
      tool: toolName,
      status: "validation_error",
      error: errorMsg,
    };
  }

  // 3. Execute tool handler
  try {
    const result = await tool.handler(parseResult.data, workspaceId);
    await logToolCall(workspaceId, toolName, rawArgs, "success", result);
    return {
      tool: toolName,
      status: "success",
      result,
    };
  } catch (execErr: unknown) {
    const errorMsg = execErr instanceof Error ? execErr.message : "Tool execution failed";
    await logToolCall(workspaceId, toolName, rawArgs, "failure", undefined, errorMsg);
    return {
      tool: toolName,
      status: "failure",
      error: errorMsg,
    };
  }
}
