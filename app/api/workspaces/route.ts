// app/api/workspaces/route.ts
// Handles listing workspaces (GET) and creating new workspaces (POST)

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Workspace name must be at least 2 characters.")
    .max(100, "Workspace name cannot exceed 100 characters."),
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
            // Ignored when called from Route Handler
          }
        },
      },
    }
  );
}

// GET /api/workspaces — Returns all workspaces for authenticated user
export async function GET() {
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

    const { data: workspaces, error: dbError } = await supabase
      .from("workspaces")
      .select("id, name, created_at, user_id")
      .order("created_at", { ascending: false });

    if (dbError) {
      return NextResponse.json(
        { error: dbError.message, code: "DB_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json({ workspaces: workspaces ?? [] }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { error: message, code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces — Creates a new workspace for authenticated user
export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => null);
    const parseResult = createWorkspaceSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name } = parseResult.data;

    const { data: newWorkspace, error: dbError } = await supabase
      .from("workspaces")
      .insert({
        user_id: user.id,
        name,
      })
      .select("id, name, created_at, user_id")
      .single();

    if (dbError) {
      return NextResponse.json(
        { error: dbError.message, code: "DB_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json({ workspace: newWorkspace }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { error: message, code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
