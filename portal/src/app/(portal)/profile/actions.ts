"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/app/(portal)/admin/actions";
import { requireSession } from "@/lib/auth";
import { AVATAR_MAX_BYTES, sniffImageType } from "@/lib/avatar";
import { getStore, isDemoMode } from "@/lib/store";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type { FormState };

const optional = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .transform((s) => (s === "" ? null : s));

/** Accepts "example.com" or a full URL and always stores an absolute https URL. */
const optionalUrl = optional(500).pipe(
  z
    .string()
    .nullable()
    .transform((s, ctx) => {
      if (s === null) return null;
      const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : `https://${s}`;
      try {
        const u = new URL(candidate);
        if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) throw new Error();
        return u.toString();
      } catch {
        ctx.addIssue({ code: "custom", message: "Enter a web address like example.com or https://example.com." });
        return z.NEVER;
      }
    }),
);

/** A bare domain such as "example.com" — schemes and paths are stripped. */
const optionalDomain = optional(253).pipe(
  z
    .string()
    .nullable()
    .transform((s, ctx) => {
      if (s === null) return null;
      const host = s
        .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
        .replace(/^www\./i, "")
        .split(/[/?#]/)[0]
        .toLowerCase();
      if (!/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host)) {
        ctx.addIssue({ code: "custom", message: "Enter a domain like example.com." });
        return z.NEVER;
      }
      return host;
    }),
);

const phone = optional(40).pipe(
  z
    .string()
    .nullable()
    .refine((s) => s === null || (/^[+\d][\d\s().-]*$/.test(s) && s.replace(/\D/g, "").length >= 7), {
      message: "Enter a phone number with at least 7 digits.",
    }),
);

function firstIssue(e: z.ZodError): FormState {
  return { status: "error", message: e.issues[0]?.message ?? "Check the form and try again." };
}
function failed(e: unknown): FormState {
  return { status: "error", message: e instanceof Error ? e.message : "Something went wrong." };
}

/** The profile being edited: the signed-in user's own, or — for admins — the
 *  client named by `profileId`. Anyone else gets an error, never the data. */
async function subject(formData: FormData | string | null): Promise<{ me: Profile; id: string; isSelf: boolean }> {
  const me = await requireSession("/profile");
  const raw = formData instanceof FormData ? String(formData.get("profileId") ?? "") : (formData ?? "");
  const requested = raw || me.id;
  if (requested !== me.id && me.role !== "admin") throw new Error("You can only edit your own profile.");
  return { me, id: requested, isSelf: requested === me.id };
}

async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_PORTAL_URL) return process.env.NEXT_PUBLIC_PORTAL_URL.replace(/\/$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  return `${proto}://${host}`;
}

/* Name, phone, company --------------------------------------------------- */

const detailsSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(80),
  lastName: z.string().trim().max(80).default(""),
  phone,
  company: optional(120).optional(),
});

export async function saveProfileDetails(_prev: FormState, formData: FormData): Promise<FormState> {
  let who: Awaited<ReturnType<typeof subject>>;
  try {
    who = await subject(formData);
  } catch (e) {
    return failed(e);
  }
  const parsed = detailsSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") ?? "",
    company: formData.has("company") ? formData.get("company") : undefined,
  });
  if (!parsed.success) return firstIssue(parsed.error);
  const { company, ...rest } = parsed.data;
  try {
    // Only admins may change the company; the client form doesn't send it.
    await getStore().updateProfile(who.id, who.me.role === "admin" && company !== undefined ? { ...rest, company } : rest);
  } catch (e) {
    return failed(e);
  }
  revalidatePath("/", "layout");
  return { status: "ok", message: "Saved." };
}

/* Email ------------------------------------------------------------------ */

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");

export async function changeEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  let who: Awaited<ReturnType<typeof subject>>;
  try {
    who = await subject(formData);
  } catch (e) {
    return failed(e);
  }
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return firstIssue(parsed.error);
  const email = parsed.data;
  const store = getStore();
  const current = await store.getProfile(who.id);
  if (!current) return { status: "error", message: "Profile not found." };
  if (current.email.toLowerCase() === email) return { status: "ok", message: "That's already your email address." };

  try {
    if (isDemoMode() || !who.isSelf) {
      // Demo mode has no mailbox to confirm with; admins change a client's
      // address directly (the store confirms it on the auth side too).
      await store.setProfileEmail(who.id, email);
      revalidatePath("/", "layout");
      return { status: "ok", message: isDemoMode() ? "Email updated. In production you'd confirm this by email first." : "Email updated." };
    }
    // Own account in production: Supabase Auth owns the address. It emails a
    // confirmation link to both the old and new address; the profile row is
    // updated by a database trigger once the change is confirmed.
    const supabase = await createSupabaseServerClient();
    const origin = await siteOrigin();
    const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/profile")}` });
    if (error) {
      console.error("[profile] updateUser(email) failed", { status: error.status, code: error.code });
      return {
        status: "error",
        message:
          error.status === 429 || /rate limit/i.test(error.message)
            ? "Too many attempts. Wait a few minutes and try again."
            : /already|exists|registered/i.test(error.message)
              ? "Another account already uses that email address."
              : "The confirmation email couldn't be sent. Please try again in a moment.",
      };
    }
  } catch (e) {
    return failed(e);
  }
  return {
    status: "ok",
    message: `Check ${email} — and your current inbox — for confirmation links. Your address changes once you've confirmed.`,
  };
}

/* Website & hosting ------------------------------------------------------- */

const websiteSchema = z.object({
  currentUrl: optionalUrl,
  newDomain: optionalDomain,
  hostingProvider: optional(120),
  hostingLoginUrl: optionalUrl,
  hostingUsername: optional(200),
  hostingPassword: z.string().max(200, "Keep the password under 200 characters."),
  clearHostingPassword: z.boolean(),
  hostingNotes: optional(2000),
});

export async function saveWebsiteDetails(_prev: FormState, formData: FormData): Promise<FormState> {
  let who: Awaited<ReturnType<typeof subject>>;
  try {
    who = await subject(formData);
  } catch (e) {
    return failed(e);
  }
  // Never spread formData into logs or errors: it carries the hosting password.
  const parsed = websiteSchema.safeParse({
    currentUrl: formData.get("currentUrl") ?? "",
    newDomain: formData.get("newDomain") ?? "",
    hostingProvider: formData.get("hostingProvider") ?? "",
    hostingLoginUrl: formData.get("hostingLoginUrl") ?? "",
    hostingUsername: formData.get("hostingUsername") ?? "",
    hostingPassword: formData.get("hostingPassword") ?? "",
    clearHostingPassword: formData.get("clearHostingPassword") === "on",
    hostingNotes: formData.get("hostingNotes") ?? "",
  });
  if (!parsed.success) return firstIssue(parsed.error);
  const { hostingPassword, clearHostingPassword, ...fields } = parsed.data;
  try {
    await getStore().saveWebsiteDetails(who.id, {
      ...fields,
      // Blank means "keep what's stored" so the page never has to carry the
      // plaintext; the checkbox is the explicit way to remove it.
      hostingPassword: clearHostingPassword ? null : hostingPassword === "" ? undefined : hostingPassword,
    });
  } catch (e) {
    return failed(e);
  }
  revalidatePath("/profile");
  revalidatePath(`/admin/clients/${who.id}`);
  return { status: "ok", message: "Website details saved." };
}

export interface RevealState {
  status: "ok" | "error";
  password?: string | null;
  message?: string;
}

/** Decrypts the stored hosting password for the owner or an admin. Called
 *  only when someone presses "show", so the plaintext is never rendered into
 *  the page and only travels over this one authenticated round-trip. */
export async function revealHostingPassword(profileId: string): Promise<RevealState> {
  try {
    const who = await subject(profileId);
    const password = await getStore().revealHostingPassword(who.id);
    return { status: "ok", password };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Could not read the password." };
  }
}

/* Avatar ------------------------------------------------------------------ */

export async function uploadAvatar(_prev: FormState, formData: FormData): Promise<FormState> {
  let who: Awaited<ReturnType<typeof subject>>;
  try {
    who = await subject(formData);
  } catch (e) {
    return failed(e);
  }
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "Choose a picture first." };
  if (file.size > AVATAR_MAX_BYTES) return { status: "error", message: "Pictures need to be under 2 MB." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = sniffImageType(bytes);
  if (!contentType) return { status: "error", message: "Use a JPG, PNG, WebP, or GIF image." };
  try {
    await getStore().setAvatar(who.id, { bytes, contentType });
  } catch (e) {
    return failed(e);
  }
  revalidatePath("/", "layout");
  return { status: "ok", message: "Picture updated." };
}

export async function removeAvatar(_prev: FormState, formData: FormData): Promise<FormState> {
  let who: Awaited<ReturnType<typeof subject>>;
  try {
    who = await subject(formData);
  } catch (e) {
    return failed(e);
  }
  try {
    await getStore().removeAvatar(who.id);
  } catch (e) {
    return failed(e);
  }
  revalidatePath("/", "layout");
  return { status: "ok", message: "Picture removed." };
}
