import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(URL && ANON_KEY);

let warned = false;

/** One clear line in the build log instead of a stack trace per page. */
function warnOnce() {
  if (warned) return;
  warned = true;
  console.error(
    "[kiranaclick] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set — " +
      "the storefront will render with no catalog. Set them in your hosting environment."
  );
}

/** Browser client — used by checkout to insert orders and upload proofs. */
export function createClient() {
  return createBrowserClient<Database>(URL!, ANON_KEY!);
}

/**
 * Server client for catalog reads.
 *
 * Returns null when the environment is not configured rather than throwing.
 * A missing variable should degrade to an empty storefront, not fail the build
 * of every page including /_not-found.
 */
export function createServerClient() {
  if (!isSupabaseConfigured) {
    warnOnce();
    return null;
  }
  return createSupabaseClient<Database>(URL!, ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
