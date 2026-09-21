import "server-only";

/** Transactional email for the portal's own notifications (new messages).
 *
 *  Sign-in, invitation, and password emails are sent by Supabase Auth using
 *  the SMTP settings in its dashboard; the app never sends those itself.
 *  For everything else there was no provider until now, so this goes through
 *  Resend's REST API when `RESEND_API_KEY` is set (the same account the
 *  README recommends for Supabase's SMTP) and is a logged no-op otherwise.
 *  Callers never depend on the result — a failed email must never block the
 *  action that triggered it. */

export interface EmailMessage {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

const DEFAULT_FROM = "Melanie Berberette <portal@melanieberberette.design>";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

let warned = false;

export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = (Array.isArray(msg.to) ? msg.to : [msg.to]).map((s) => s.trim()).filter(Boolean);
  if (to.length === 0) return false;
  if (!apiKey) {
    if (!warned) {
      warned = true;
      console.info("[email] RESEND_API_KEY is not set; notification emails are skipped.");
    }
    return false;
  }
  const from = process.env.PORTAL_EMAIL_FROM?.trim() || DEFAULT_FROM;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject: msg.subject, text: msg.text, html: msg.html, reply_to: msg.replyTo }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("[email] send failed", { status: res.status, body: (await res.text()).slice(0, 300) });
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] send failed", e instanceof Error ? e.message : e);
    return false;
  }
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
