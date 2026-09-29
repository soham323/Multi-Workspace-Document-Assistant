// lib/tools/declarations.ts
// Gemini Function Declarations defining tool signatures for the LLM

import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const saveWorkspaceTaskDeclaration: FunctionDeclaration = {
  name: "save_workspace_task",
  description:
    "Save an actionable task or to-do item to the user's active workspace. Use when the user asks to save, create, track, or remember a task, action item, or follow-up from workspace documents.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      title: {
        type: SchemaType.STRING,
        description: "Short, descriptive task title (max 200 chars)",
      },
      description: {
        type: SchemaType.STRING,
        description: "Optional detailed explanation, context, or action steps",
      },
      priority: {
        type: SchemaType.STRING,
        description: "Priority level: 'low', 'medium', 'high', or 'critical'. Defaults to 'medium'.",
      },
    },
    required: ["title"],
  },
};

export const sendChannelNotificationDeclaration: FunctionDeclaration = {
  name: "send_channel_notification",
  description:
    "Send an outbound alert or notification message to the team Discord channel via webhook. Use when the user asks to notify the team, post to Discord, share a summary, or alert a channel.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      message: {
        type: SchemaType.STRING,
        description: "The notification body to send to the channel (max 2000 chars)",
      },
      title: {
        type: SchemaType.STRING,
        description: "Optional bold headline for the notification embed",
      },
      level: {
        type: SchemaType.STRING,
        description: "Severity level: 'info', 'warning', or 'urgent'. Defaults to 'info'.",
      },
    },
    required: ["message"],
  },
};

export const WORKSPACE_TOOLS: FunctionDeclaration[] = [
  saveWorkspaceTaskDeclaration,
  sendChannelNotificationDeclaration,
];
