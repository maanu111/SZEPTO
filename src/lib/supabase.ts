import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Browser client — used by checkout to insert orders and upload proofs. */
export function createClient() {
  return createBrowserClient<Database>(URL, ANON_KEY);
}

/**
 * Server client for catalog reads. The storefront has no login, so there's no
 * session to carry — a plain client keeps Server Components cacheable.
 */
export function createServerClient() {
  return createSupabaseClient<Database>(URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
