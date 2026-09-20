import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { loginUrl, REQUEST_PATH_HEADER } from "@/lib/auth-links";
import { splitName } from "@/lib/format";
import { getStore, isDemoMode } from "@/lib/store";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const DEMO_COOKIE = "portal_demo_session";

const demoSecret = () => process.env.PORTAL_DEMO_SECRET ?? "local-demo-only-not-for-production";

export function signDemoToken(profileId: string): string {
  const mac = createHmac("sha256", demoSecret()).update(profileId).digest("base64url");
  return `${profileId}.${mac}`;
}

export function readDemoToken(token: string | undefined): string | null {
  if (!token) return null;
  const [id, mac] = token.split(".");
  if (!id || !mac) return null;
  const expected = createHmac("sha256", demoSecret()).update(id).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

function adminEmails(): Set<string> {
  return new Set(
    (process.env.PORTAL_ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

function nameFromMetadata(meta: Record<string, unknown> | undefined): string | null {
  for (const key of ["full_name", "name", "display_name"]) {
    const value = meta?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/** The signed-in profile, or null. Cheap enough to call from every page. */
export async function getSession(): Promise<Profile | null> {
  const store = getStore();

  if (isDemoMode()) {
    const jar = await cookies();
    const id = readDemoToken(jar.get(DEMO_COOKIE)?.value);
    return id ? store.getProfile(id) : null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  let profile = await store.getProfile(user.id);
  if (!profile) return null;

  // Accounts invited from the Supabase dashboard (typically the owner's) land
  // with an empty full_name; pick the name up from the auth user's metadata
  // and store it so the greeting and user card can use it.
  if (!profile.fullName.trim()) {
    const fromAuth = nameFromMetadata(user.user_metadata);
    if (fromAuth) {
      await store.setProfileName(profile.id, fromAuth);
      profile = { ...profile, fullName: fromAuth, ...splitName(fromAuth) };
    }
  }

  // Owner bootstrap: emails listed in PORTAL_ADMIN_EMAILS become admins on
  // first sign-in, so there's no manual SQL step to reach the admin area.
  if (profile.role !== "admin" && adminEmails().has(profile.email.toLowerCase())) {
    await store.promoteToAdmin(profile.id);
    profile = { ...profile, role: "admin" };
  }
  return profile;
}

/** The path + query of the current request, as recorded by proxy.ts. */
async function requestedPath(): Promise<string | null> {
  const h = await headers();
  return h.get(REQUEST_PATH_HEADER);
}

/** Redirects signed-out visitors to the login page and brings them back to
 *  `next` — by default the page they were trying to open — once signed in. */
export async function requireSession(next?: string): Promise<Profile> {
  const profile = await getSession();
  if (!profile) redirect(loginUrl(next ?? (await requestedPath())));
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireSession();
  if (profile.role !== "admin") redirect("/");
  return profile;
}
