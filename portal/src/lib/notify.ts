import "server-only";
import { escapeHtml, sendEmail } from "@/lib/email";
import { messagePreview } from "@/lib/messages";
import { getStore, isDemoMode } from "@/lib/store";
import type { Conversation, Message, Profile } from "@/lib/types";

function portalUrl(): string {
  return (process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://portal.melanieberberette.design").replace(/\/$/, "");
}

/** Who hears about a client's message: PORTAL_NOTIFY_EMAILS if set,
 *  otherwise the admin list that already exists for sign-in. */
function studioEmails(): string[] {
  const raw = process.env.PORTAL_NOTIFY_EMAILS ?? process.env.PORTAL_ADMIN_EMAILS ?? "";
  return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

/** Emails the other side about a new message. One email per burst: if the
 *  recipient already has unread messages in this thread from before, they've
 *  been told and are not told again until they've read up. Never throws. */
export async function notifyNewMessage(conversation: Conversation, message: Message, sender: Profile): Promise<void> {
  if (isDemoMode()) return;
  try {
    const store = getStore();
    const thread = await store.listMessages(conversation.id);
    const alreadyWaiting = thread.some((m) => m.id !== message.id && m.senderRole === message.senderRole && !m.readAt);
    if (alreadyWaiting) return;

    const senderName = sender.fullName || sender.email;
    const preview = messagePreview(message.body, 400);

    if (sender.role === "client") {
      const to = studioEmails();
      if (to.length === 0) return;
      const link = `${portalUrl()}/admin/messages/${conversation.clientId}`;
      await sendEmail({
        to,
        replyTo: sender.email,
        subject: `New message from ${senderName}${sender.company ? ` (${sender.company})` : ""}`,
        text: `${senderName} wrote in the portal:\n\n${message.body}\n\nReply: ${link}`,
        html: `<p><strong>${escapeHtml(senderName)}</strong> wrote in the portal:</p><blockquote style="margin:0;padding:0 0 0 12px;border-left:2px solid #ff4a1c;white-space:pre-wrap">${escapeHtml(preview)}</blockquote><p><a href="${link}">Reply in the portal</a></p>`,
      });
      return;
    }

    const client = await store.getProfile(conversation.clientId);
    if (!client) return;
    const link = `${portalUrl()}/messages`;
    await sendEmail({
      to: client.email,
      subject: `New message from ${senderName}`,
      text: `${senderName} sent you a message in the portal:\n\n${message.body}\n\nRead and reply: ${link}`,
      html: `<p><strong>${escapeHtml(senderName)}</strong> sent you a message in the portal:</p><blockquote style="margin:0;padding:0 0 0 12px;border-left:2px solid #ff4a1c;white-space:pre-wrap">${escapeHtml(preview)}</blockquote><p><a href="${link}">Read and reply in the portal</a></p>`,
    });
  } catch (e) {
    console.error("[notify] message notification failed", e instanceof Error ? e.message : e);
  }
}
