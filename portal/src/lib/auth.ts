import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

  // Owner bootstrap: emails listed in PORTAL_ADMIN_EMAILS become admins on
  // first sign-in, so there's no manual SQL step to reach the admin area.
  if (profile.role !== "admin" && adminEmails().has(profile.email.toLowerCase())) {
    await store.promoteToAdmin(profile.id);
    profile = { ...profile, role: "admin" };
  }
  return profile;
}

export async function requireSession(next?: string): Promise<Profile> {
  const profile = await getSession();
  if (!profile) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireSession("/admin");
  if (profile.role !== "admin") redirect("/");
  return profile;
}
