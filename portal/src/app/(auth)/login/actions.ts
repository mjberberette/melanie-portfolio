"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DEMO_COOKIE, signDemoToken } from "@/lib/auth";
import { getStore, isDemoMode } from "@/lib/store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface LoginState {
  status: "idle" | "sent" | "error";
  message?: string;
  email?: string;
}

const emailSchema = z.string().trim().email("Enter the email address your invitation was sent to.");

async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_PORTAL_URL) return process.env.NEXT_PUBLIC_PORTAL_URL.replace(/\/$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  return `${proto}://${host}`;
}

export async function requestMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  const email = parsed.data.toLowerCase();
  const next = String(formData.get("next") ?? "/");

  if (isDemoMode()) {
    // No email in demo mode: sign straight in if the address matches a seeded account.
    const profile = await getStore().getProfileByEmail(email);
    if (!profile) {
      return { status: "error", message: "No account with that email. In demo mode, use one of the sample accounts below.", email };
    }
    const jar = await cookies();
    jar.set(DEMO_COOKIE, signDemoToken(profile.id), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
    redirect(next.startsWith("/") ? next : "/");
  }

  const supabase = await createSupabaseServerClient();
  const origin = await siteOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Only invited clients can sign in; nobody can self-register.
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    // Surfaces in Vercel → Logs; the client only sees a friendly summary.
    console.error("[login] signInWithOtp failed", { email, status: error.status, code: error.code, message: error.message });
    const msg = error.message;
    let message = "Something went wrong sending your link. Please try again in a moment.";
    if (/signups not allowed|not found|otp_disabled/i.test(msg)) {
      message = "That email hasn't been invited to the portal yet. Check the address, or get in touch and I'll send an invitation.";
    } else if (error.status === 429 || /rate limit/i.test(msg)) {
      message = "Too many sign-in emails were requested recently. Wait a few minutes and try again.";
    } else if (/error sending|smtp|mail/i.test(msg)) {
      message = "The sign-in email couldn't be sent. This is a mail delivery problem on our side, not something you did — please get in touch.";
    }
    return { status: "error", email, message: `${message} (${error.code ?? error.status ?? "unknown"}: ${msg})` };
  }
  return { status: "sent", email };
}

export async function signOut() {
  if (isDemoMode()) {
    const jar = await cookies();
    jar.delete(DEMO_COOKIE);
  } else {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
