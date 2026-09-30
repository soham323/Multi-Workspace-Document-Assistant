// app/api/tasks/route.ts
// Handles listing workspace tasks (GET), updating status (PATCH), and deleting (DELETE)

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored in Route Handler
          }
        },
      },
    }
  );
}

// GET /api/tasks?workspaceId=<id> — List tasks for workspace
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Verify workspace belongs to user
    const { data: ws, error: wsError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (wsError || !ws) {
      return NextResponse.json(
        { error: "Workspace not found or unauthorized.", code: "WORKSPACE_NOT_FOUND" },
        { status: 404 }
      );
    }

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, workspace_id, title, description, priority, status, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (tasksError) {
      return NextResponse.json({ error: tasksError.message, code: "DB_ERROR" }, { status: 500 });
    }

    return NextResponse.json({ tasks: tasks ?? [] }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg, code: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

const updateTaskSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  status: z.enum(["todo", "in_progress", "done"]),
});

// PATCH /api/tasks — Update task status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, workspaceId, status } = parsed.data;

    // Verify workspace belongs to user
    const { data: ws, error: wsError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (wsError || !ws) {
      return NextResponse.json(
        { error: "Workspace not found or unauthorized.", code: "WORKSPACE_NOT_FOUND" },
        { status: 404 }
      );
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message, code: "DB_ERROR" }, { status: 500 });
    }

    return NextResponse.json({ task: updatedTask }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg, code: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

// DELETE /api/tasks?id=<id>&workspaceId=<id> — Delete task
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized.", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const workspaceId = searchParams.get("workspaceId");

    if (!id || !workspaceId) {
      return NextResponse.json(
        { error: "Task id and workspaceId are required.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Verify workspace belongs to user
    const { data: ws, error: wsError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (wsError || !ws) {
      return NextResponse.json(
        { error: "Workspace not found or unauthorized.", code: "WORKSPACE_NOT_FOUND" },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message, code: "DB_ERROR" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg, code: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
