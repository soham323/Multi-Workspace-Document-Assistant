// app/api/documents/route.ts
// Handles listing documents for an active workspace (GET) and deleting a document (DELETE)

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
            // Ignored when called from Route Handler
          }
        },
      },
    }
  );
}

// GET /api/documents?workspaceId=<id> — List all documents in workspace
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId") || searchParams.get("workspace_id");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId query parameter is required.", code: "VALIDATION_ERROR" },
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

    // Fetch documents
    const { data: documents, error: docsError } = await supabase
      .from("documents")
      .select("id, workspace_id, title, file_type, file_hash, status, chunk_count, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (docsError) {
      return NextResponse.json(
        { error: docsError.message, code: "DB_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json({ documents: documents ?? [] }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { error: message, code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE /api/documents?id=<id>&workspaceId=<id> — Delete document and cascaded chunks
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("id");
    const workspaceId = searchParams.get("workspaceId") || searchParams.get("workspace_id");

    if (!documentId || !workspaceId) {
      return NextResponse.json(
        { error: "Both document id and workspaceId are required.", code: "VALIDATION_ERROR" },
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

    // Delete document (cascade removes chunks from document_chunks table)
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId)
      .eq("workspace_id", workspaceId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message, code: "DB_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Document deleted successfully." }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { error: message, code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
