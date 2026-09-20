"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DEMO_COOKIE, signDemoToken } from "@/lib/auth";
import { afterPassword, safeNext } from "@/lib/auth-links";
import { passwordSchema } from "@/lib/password";
import { getStore, isDemoMode } from "@/lib/store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface LoginState {
  status: "idle" | "sent" | "error";
  message?: string;
  email?: string;
}

export interface PasswordState {
  status: "idle" | "error";
  message?: string;
}

const emailSchema = z.string().trim().email("Enter the email address your invitation was sent to.");

async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_PORTAL_URL) return process.env.NEXT_PUBLIC_PORTAL_URL.replace(/\/$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  return `${proto}://${host}`;
}

/** Demo mode has no email and no passwords: any sign-in method signs
 *  straight in when the address matches a seeded account. */
async function demoSignIn(email: string, next: string): Promise<LoginState> {
  const profile = await getStore().getProfileByEmail(email);
  if (!profile) {
    return { status: "error", message: "No account with that email. In demo mode, use one of the sample accounts below.", email };
  }
  const jar = await cookies();
  jar.set(DEMO_COOKIE, signDemoToken(profile.id), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  redirect(next);
}

export async function requestMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  const email = parsed.data.toLowerCase();
  const next = safeNext(formData.get("next"));

  if (isDemoMode()) return demoSignIn(email, next);

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

export async function signInWithPassword(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1, "Enter your password.") })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message, email: String(formData.get("email") ?? "") };
  }
  const email = parsed.data.email.toLowerCase();
  const next = safeNext(formData.get("next"));

  if (isDemoMode()) return demoSignIn(email, next);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
  if (error) {
    console.error("[login] signInWithPassword failed", { email, status: error.status, code: error.code, message: error.message });
    let message = "Something went wrong signing you in. Please try again in a moment.";
    if (error.code === "invalid_credentials" || error.status === 400) {
      message = "That email and password don't match. If you haven't set a password yet, use the sign-in link option or reset your password.";
    } else if (error.code === "email_not_confirmed") {
      message = "This account hasn't been activated yet. Open the invitation email and follow the link to set a password.";
    } else if (error.status === 429 || /rate limit/i.test(error.message)) {
      message = "Too many sign-in attempts. Wait a few minutes and try again.";
    }
    return { status: "error", email, message };
  }
  redirect(next);
}

export async function requestPasswordReset(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  const email = parsed.data.toLowerCase();

  // Demo accounts have no passwords to reset; the login page signs them in directly.
  if (isDemoMode()) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const origin = await siteOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });
  if (error) {
    console.error("[login] resetPasswordForEmail failed", { email, status: error.status, code: error.code, message: error.message });
    if (error.status === 429 || /rate limit/i.test(error.message)) {
      return { status: "error", email, message: "Too many reset emails were requested recently. Wait a few minutes and try again." };
    }
    if (/error sending|smtp|mail/i.test(error.message)) {
      return { status: "error", email, message: "The reset email couldn't be sent. This is a mail delivery problem on our side — please get in touch." };
    }
    // Anything else (including an unknown address) reads the same to the
    // client, so the form can't be used to check who has an account.
  }
  return { status: "sent", email };
}

/** Sets the password on the current session — from an invitation, a recovery
 *  link, or a signed-in client choosing one for the first time. */
export async function updatePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const next = afterPassword(formData.get("next"));
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  if (password !== confirm) return { status: "error", message: "The two passwords don't match." };

  if (isDemoMode()) redirect(next);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/set-password")}`);

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("[login] updateUser(password) failed", { status: error.status, code: error.code, message: error.message });
    let message = "Your password couldn't be saved. Please try again.";
    if (error.code === "same_password") {
      message = "That's already your password. Choose a different one.";
    } else if (error.code === "weak_password" || /password/i.test(error.message)) {
      message = error.message;
    } else if (error.status === 401 || error.code === "session_expired") {
      message = "Your link has expired. Request a new one and try again.";
    }
    return { status: "error", message };
  }
  redirect(next);
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
