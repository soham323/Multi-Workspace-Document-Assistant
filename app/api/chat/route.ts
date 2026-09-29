// app/api/chat/route.ts
// Handles RAG chat requests: validates session & workspace, runs pipeline, persists turns to DB

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { runRagPipeline } from "@/lib/rag/pipeline";
import type { Json } from "@/types/database";

const chatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message cannot exceed 2000 characters."),
  workspaceId: z.string().uuid("Invalid workspace ID format."),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { message, workspaceId, history } = parsed.data;

    // Verify workspace belongs to authenticated user
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

    // 1. Persist user turn to chat_messages
    await supabase.from("chat_messages").insert({
      workspace_id: workspaceId,
      role: "user",
      content: message,
      citations: [] as unknown as Json,
      retrieval_debug: {} as unknown as Json,
    });

    // 2. Execute RAG pipeline (retrieval -> context prompt -> Gemini generation -> citations)
    const result = await runRagPipeline(message, workspaceId, history);

    // 3. Persist assistant turn with citations and retrieval debug to chat_messages
    await supabase.from("chat_messages").insert({
      workspace_id: workspaceId,
      role: "assistant",
      content: result.answer,
      citations: result.citations as unknown as Json,
      retrieval_debug: result.retrievalDebug as unknown as Json,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("Error in POST /api/chat:", err);
    return NextResponse.json(
      { error: msg, code: "CHAT_PIPELINE_ERROR" },
      { status: 500 }
    );
  }
}
