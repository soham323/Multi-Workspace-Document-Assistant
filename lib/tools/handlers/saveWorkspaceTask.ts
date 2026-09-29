// lib/tools/handlers/saveWorkspaceTask.ts
// Handler for save_workspace_task tool: inserts task into Supabase tasks table

import { createServerClient } from "@/lib/supabase/server";
import type { SaveWorkspaceTaskInput } from "../schemas/saveWorkspaceTask";

export async function saveWorkspaceTaskHandler(
  args: SaveWorkspaceTaskInput,
  workspaceId: string
): Promise<{ success: boolean; taskId: string; title: string; priority: string; status: string }> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      workspace_id: workspaceId,
      title: args.title,
      description: args.description || null,
      priority: args.priority || "medium",
      status: "todo",
    })
    .select("id, title, priority, status")
    .single();

  if (error || !data) {
    throw new Error(`Failed to save task to workspace: ${error?.message || "Database insert error"}`);
  }

  return {
    success: true,
    taskId: data.id,
    title: data.title,
    priority: data.priority,
    status: data.status,
  };
}
