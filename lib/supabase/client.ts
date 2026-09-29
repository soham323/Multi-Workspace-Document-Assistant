// lib/supabase/client.ts
// Browser-safe Supabase client — uses the ANON key only via @supabase/ssr.
// Use ONLY for Supabase Auth in Client Components.
// Never use this for database operations that bypass RLS.

"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
