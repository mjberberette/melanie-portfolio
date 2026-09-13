import "server-only";
import type { PortalStore } from "@/lib/types";
import { DemoStore } from "./demo";
import { SupabaseStore } from "./supabase";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export const isDemoMode = () => !isSupabaseConfigured();

let store: PortalStore | null = null;

export function getStore(): PortalStore {
  if (store) return store;
  store = isSupabaseConfigured()
    ? new SupabaseStore(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    : new DemoStore();
  return store;
}
