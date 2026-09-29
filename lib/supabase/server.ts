// lib/supabase/server.ts
// Server-only Supabase client — uses the SERVICE ROLE key.
// Bypasses RLS — use ONLY in API Routes and Server Actions.
// NEVER import this in Client Components or any file that runs in the browser.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      // Disable auto-refresh for server-side client — it is stateless
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
