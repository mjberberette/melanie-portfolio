/** Supabase connection settings, normalised so a URL copied with a path on
 *  the end (…/rest/v1, a trailing slash) still works: supabase-js appends its
 *  own paths and the gateway rejects anything else with "Invalid path". */
export function supabaseUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return undefined;
  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`).origin;
  } catch {
    return raw;
  }
}

export function supabaseAnonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim().replace(/^["']|["']$/g, "") || undefined;
}

export function supabaseServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/^["']|["']$/g, "") || undefined;
}
