import "server-only";
import type { PortalStore } from "@/lib/types";
import { DemoStore } from "./demo";
import { SupabaseStore } from "./supabase";
import { supabaseAnonKey, supabaseServiceRoleKey, supabaseUrl } from "@/lib/supabase/env";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl() && supabaseAnonKey() && supabaseServiceRoleKey(),
  );
}

export const isDemoMode = () => !isSupabaseConfigured();

let store: PortalStore | null = null;

export function getStore(): PortalStore {
  if (store) return store;
  store = isSupabaseConfigured()
    ? new SupabaseStore(supabaseUrl()!, supabaseServiceRoleKey()!)
    : new DemoStore();
  return store;
}
