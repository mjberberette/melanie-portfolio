import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MessageThread } from "@/components/chat/message-thread";
import { participant } from "@/components/chat/participant";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { requireAdmin } from "@/lib/auth";
import { firstNameOf, initials } from "@/lib/format";
import { loadInbox } from "@/lib/inbox";
import { getStore } from "@/lib/store";
import { InboxShell } from "../inbox-shell";

export async function generateMetadata({ params }: PageProps<"/admin/messages/[clientId]">): Promise<Metadata> {
  const { clientId } = await params;
  const p = await getStore().getProfile(clientId);
  return { title: p ? `Messages · ${p.fullName || p.email}` : "Messages" };
}

export default async function AdminThreadPage({ params }: PageProps<"/admin/messages/[clientId]">) {
  const me = await requireAdmin();
  const { clientId } = await params;
  const store = getStore();
  const client = await store.getProfile(clientId);
  if (!client || client.role !== "client") notFound();

  const conversation = await store.getOrCreateConversation(client.id);
  const [messages, rows, profiles] = await Promise.all([store.listMessages(conversation.id), loadInbox(), store.listProfiles()]);
  const participants = Object.fromEntries(profiles.map((p) => [p.id, participant(p)]));
  const first = firstNameOf(client.fullName) ?? client.email;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/messages" className="inline-flex items-center gap-1.5 text-sm text-bone-dim hover:text-bone lg:hidden">
            <ArrowLeft className="size-4" aria-hidden /> Inbox
          </Link>
          <p className="eyebrow hidden lg:block">Messages</p>
          <h1 className="display mt-3 text-3xl sm:text-4xl">Inbox</h1>
        </div>
      </div>
      <InboxShell rows={rows} activeClientId={client.id}>
        <div className="flex h-[calc(100dvh-14rem)] min-h-[22rem] flex-col gap-3 sm:h-[calc(100dvh-16rem)]">
          <div className="flex items-center gap-3 px-1">
            <Avatar className="size-9 border border-border">
              {client.avatarUrl && <AvatarImage src={client.avatarUrl} alt="" />}
              <AvatarFallback className="bg-ink-veil font-mono text-[0.625rem] text-bone">{initials(client.fullName || client.email)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{client.fullName || client.email}</p>
              <p className="truncate text-xs text-bone-faint">
                {client.company ? `${client.company} · ` : ""}
                {client.email}
              </p>
            </div>
            <Link href={`/admin/clients/${client.id}`} className="shrink-0 text-sm text-bone-dim underline-offset-4 hover:text-bone hover:underline">
              Manage
            </Link>
          </div>
          <MessageThread
            conversationId={conversation.id}
            me={participant(me)}
            participants={participants}
            initialMessages={messages}
            placeholder={`Reply to ${first}…`}
            emptyTitle={`Start the conversation with ${first}`}
            emptyHint="They'll see your message the next time they open the portal, and get an email about it right away."
            className="min-h-0 flex-1"
          />
        </div>
      </InboxShell>
    </div>
  );
}
