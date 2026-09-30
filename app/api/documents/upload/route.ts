// app/api/documents/upload/route.ts
// Handles file upload, SHA-256 idempotency check, and runs ingestion pipeline

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { runIngestionPipeline } from "@/lib/ingestion";
import type { FileType } from "@/types/app";

const MAX_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || "10", 10);
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;

async function getSupabaseUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

function detectFileType(filename: string): FileType | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".txt")) return "txt";
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getSupabaseUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const workspaceId = (formData.get("workspace_id") || formData.get("workspaceId")) as string | null;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspace_id is required.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "A file must be uploaded.", code: "VALIDATION_ERROR" },
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

    // Validate file size
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        {
          error: `File size exceeds the ${MAX_SIZE_MB} MB limit.`,
          code: "FILE_TOO_LARGE",
        },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = detectFileType(file.name);
    if (!fileType) {
      return NextResponse.json(
        {
          error: "Unsupported file type. Only PDF, TXT, and DOCX are supported.",
          code: "UNSUPPORTED_FILE_TYPE",
        },
        { status: 400 }
      );
    }

    // Compute SHA-256 hash for idempotency
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

    // Idempotency check: see if file with identical hash was already ingested
    const { data: existingDoc } = await supabase
      .from("documents")
      .select("id, title, status")
      .eq("workspace_id", workspaceId)
      .eq("file_hash", fileHash)
      .maybeSingle();

    if (existingDoc && existingDoc.status !== "failed") {
      return NextResponse.json(
        {
          error: `This exact document ("${existingDoc.title}") has already been ingested into this workspace.`,
          code: "DUPLICATE_DOCUMENT",
          documentId: existingDoc.id,
        },
        { status: 409 }
      );
    }

    // Create initial document record with status = 'processing'
    const { data: newDoc, error: insertError } = await supabase
      .from("documents")
      .insert({
        workspace_id: workspaceId,
        title: file.name,
        file_type: fileType,
        file_hash: fileHash,
        status: "processing",
        chunk_count: 0,
      })
      .select("id, workspace_id, title, file_type, status, created_at")
      .single();

    if (insertError || !newDoc) {
      return NextResponse.json(
        { error: "Failed to create document record.", code: "DB_ERROR" },
        { status: 500 }
      );
    }

    // Run ingestion pipeline (extract -> chunk -> embed -> store -> mark ingested)
    try {
      const result = await runIngestionPipeline(
        buffer,
        fileType,
        workspaceId,
        newDoc.id,
        file.name
      );

      return NextResponse.json(
        {
          documentId: newDoc.id,
          title: file.name,
          status: "ingested",
          chunkCount: result.chunkCount,
          document: {
            ...newDoc,
            status: "ingested",
            chunk_count: result.chunkCount,
          },
        },
        { status: 201 }
      );
    } catch (ingestionError: unknown) {
      const msg = ingestionError instanceof Error ? ingestionError.message : "Ingestion failed";
      return NextResponse.json(
        {
          error: `Failed to process document: ${msg}`,
          code: "INGESTION_FAILED",
          documentId: newDoc.id,
        },
        { status: 422 }
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { error: msg, code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
