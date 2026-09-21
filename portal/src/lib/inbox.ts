import "server-only";
import { getStore } from "@/lib/store";
import type { ConversationSummary } from "@/lib/types";

/** Every client as an inbox row — threads with activity first, then clients
 *  who haven't exchanged a message yet, so Melanie can start a conversation
 *  from the same list. */
export async function loadInbox(): Promise<ConversationSummary[]> {
  const store = getStore();
  const [conversations, profiles] = await Promise.all([store.listConversations(), store.listProfiles()]);
  const seen = new Set(conversations.map((c) => c.clientId));
  const fresh: ConversationSummary[] = profiles
    .filter((p) => p.role === "client" && !seen.has(p.id))
    .map((client) => ({
      // No row exists yet; the thread page creates it on first open.
      id: `new-${client.id}`,
      clientId: client.id,
      createdAt: client.createdAt,
      lastMessageAt: null,
      client,
      lastMessage: null,
      unreadCount: 0,
    }));
  return [...conversations, ...fresh];
}
