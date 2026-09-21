import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

let client: SupabaseClient | null | undefined;

/** Anon-key client for the signed-in browser session. The portal reads and
 *  writes data on the server, so this exists only for Realtime: it carries
 *  the user's JWT, and row-level security decides which change events the
 *  socket delivers. Returns null in demo mode (no Supabase). */
export function getBrowserSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  client = url && key ? createBrowserClient(url, key) : null;
  return client;
}
