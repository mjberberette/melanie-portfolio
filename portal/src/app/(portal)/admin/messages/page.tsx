import type { Metadata } from "next";
import { MessageSquareDashed } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/auth";
import { loadInbox } from "@/lib/inbox";
import { InboxShell } from "./inbox-shell";

export const metadata: Metadata = { title: "Messages" };

export default async function AdminInboxPage() {
  await requireAdmin();
  const rows = await loadInbox();
  const unread = rows.reduce((n, r) => n + r.unreadCount, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Messages"
        title={unread ? `${unread} unread ${unread === 1 ? "message" : "messages"}` : "Inbox"}
        description="Every client has one thread with you. New messages arrive here live and land in your email as well."
        className="[&_h1]:text-3xl sm:[&_h1]:text-4xl"
      />
      <InboxShell rows={rows}>
        <div className="flex h-[calc(100dvh-16rem)] min-h-[22rem] flex-col items-center justify-center rounded-2xl border border-dashed border-border p-10 text-center">
          <MessageSquareDashed className="size-6 text-bone-faint" aria-hidden />
          <p className="display mt-4 text-2xl">Pick a conversation</p>
          <p className="mt-2 max-w-xs text-sm text-bone-dim">Choose a client on the left to read their thread and reply.</p>
        </div>
      </InboxShell>
    </div>
  );
}
