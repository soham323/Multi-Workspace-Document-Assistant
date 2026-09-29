// lib/tools/schemas/saveWorkspaceTask.ts
import { z } from "zod";

export const SaveWorkspaceTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required.")
    .max(200, "Task title cannot exceed 200 characters."),
  description: z
    .string()
    .trim()
    .max(2000, "Task description cannot exceed 2000 characters.")
    .optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});

export type SaveWorkspaceTaskInput = z.infer<typeof SaveWorkspaceTaskSchema>;
