"use server";

import { after } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { loadInbox } from "@/lib/inbox";
import { messageBodyProblem, normaliseMessageBody } from "@/lib/messages";
import { notifyNewMessage } from "@/lib/notify";
import { getStore } from "@/lib/store";
import { MESSAGE_MAX_LENGTH, type Conversation, type ConversationSummary, type Message, type Profile } from "@/lib/types";

export type SendResult = { status: "ok"; message: Message } | { status: "error"; message: string };
export type ThreadResult = { status: "ok"; messages: Message[]; readMarked: number } | { status: "error"; message: string };

/** A conversation the signed-in person is allowed to see, or null. */
async function accessibleConversation(id: string, me: Profile): Promise<Conversation | null> {
  const c = await getStore().getConversation(id);
  if (!c) return null;
  if (me.role !== "admin" && c.clientId !== me.id) return null;
  return c;
}

export async function sendMessage(conversationId: string, rawBody: string): Promise<SendResult> {
  const me = await requireSession();
  const parsed = z.string().max(MESSAGE_MAX_LENGTH * 2).safeParse(rawBody);
  if (!parsed.success) return { status: "error", message: "That message is too long." };
  const body = normaliseMessageBody(parsed.data);
  const problem = messageBodyProblem(body);
  if (problem) return { status: "error", message: problem };

  const conversation = await accessibleConversation(conversationId, me);
  if (!conversation) return { status: "error", message: "This conversation isn't available." };

  try {
    const message = await getStore().sendMessage(conversation.id, me, body);
    // Email goes out once the response has been sent, so the chat never
    // waits on the mail provider (and a mail failure can't fail the send).
    after(() => notifyNewMessage(conversation, message, me));
    return { status: "ok", message };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Could not send the message." };
  }
}

/** Messages in a thread — all of them, or only those after `after` — and,
 *  when `markRead` is set because the thread is on screen, stamps the other
 *  side's messages as read. */
export async function fetchThread(conversationId: string, after?: string, markRead = false): Promise<ThreadResult> {
  const me = await requireSession();
  const conversation = await accessibleConversation(conversationId, me);
  if (!conversation) return { status: "error", message: "This conversation isn't available." };
  const store = getStore();
  try {
    const readMarked = markRead ? await store.markConversationRead(conversation.id, me.role) : 0;
    const messages = await store.listMessages(conversation.id, after);
    return { status: "ok", messages, readMarked };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Could not load messages." };
  }
}

/** Admin inbox rows, for live refresh. */
export async function fetchInbox(): Promise<ConversationSummary[]> {
  const me = await requireSession();
  if (me.role !== "admin") return [];
  return loadInbox();
}
