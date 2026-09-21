import { InboxList } from "@/components/chat/inbox-list";
import type { ConversationSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Two panes on large screens (inbox + thread); on small screens only the
 *  pane that matters — the list on /admin/messages, the thread once a
 *  client is picked. */
export function InboxShell({
  rows,
  activeClientId,
  children,
}: {
  rows: ConversationSummary[];
  activeClientId?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
      <aside className={cn("min-w-0", activeClientId && "hidden lg:block")} aria-label="Inbox">
        <InboxList initial={rows} activeClientId={activeClientId} className="lg:max-h-[calc(100dvh-16rem)] lg:overflow-y-auto" />
      </aside>
      <section className={cn("min-w-0", !activeClientId && "hidden lg:block")}>{children}</section>
    </div>
  );
}
