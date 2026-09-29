// app/api/chat/messages/route.ts
// Handles fetching workspace message history (GET) and clearing history (DELETE)

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

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

// GET /api/chat/messages?workspaceId=<id>
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
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

    // Fetch conversation history ordered chronologically
    const { data: messages, error: msgError } = await supabase
      .from("chat_messages")
      .select("id, workspace_id, role, content, citations, retrieval_debug, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });

    if (msgError) {
      return NextResponse.json(
        { error: msgError.message, code: "DB_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: messages ?? [] }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: msg, code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/messages?workspaceId=<id> — Clears chat history for workspace
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
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

    // Delete chat messages for workspace
    const { error: deleteError } = await supabase
      .from("chat_messages")
      .delete()
      .eq("workspace_id", workspaceId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message, code: "DB_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Chat history cleared." }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: msg, code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
