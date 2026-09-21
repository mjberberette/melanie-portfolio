"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchInbox } from "@/app/(portal)/messages/actions";
import { useHydrated, useLiveMessages } from "@/components/chat/use-live-messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRecent, initials } from "@/lib/format";
import { messagePreview } from "@/lib/messages";
import type { ConversationSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

/** The admin inbox: one row per client, kept current by realtime/polling. */
export function InboxList({ initial, activeClientId, className }: { initial: ConversationSummary[]; activeClientId?: string; className?: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [rows, setRows] = useState(initial);
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const refresh = useCallback(async () => {
    const next = await fetchInbox();
    const cur = rowsRef.current;
    const same =
      next.length === cur.length &&
      next.every((n, i) => {
        const c = cur[i];
        return c && n.id === c.id && n.unreadCount === c.unreadCount && n.lastMessage?.id === c.lastMessage?.id;
      });
    if (same) return;
    setRows(next);
    // Unread totals in the sidebar badge come from the server layout.
    router.refresh();
  }, [router]);

  useLiveMessages(null, refresh);

  if (rows.length === 0) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-border p-8 text-center", className)}>
        <p className="text-sm text-bone-dim">No clients yet — invite your first one and their thread appears here.</p>
      </div>
    );
  }

  return (
    <ul className={cn("divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card", className)} aria-label="Conversations">
      {rows.map((row) => {
        const active = row.clientId === activeClientId;
        const last = row.lastMessage;
        const preview = last ? `${last.senderRole === "admin" ? "You: " : ""}${messagePreview(last.body, 80)}` : "No messages yet";
        return (
          <li key={row.id}>
            <Link
              href={`/admin/messages/${row.clientId}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 transition-colors outline-none hover:bg-ink-veil focus-visible:bg-ink-veil",
                active && "bg-ink-veil",
              )}
            >
              <Avatar className="size-10 shrink-0 border border-border">
                {row.client.avatarUrl && <AvatarImage src={row.client.avatarUrl} alt="" />}
                <AvatarFallback className="bg-ink-veil font-mono text-xs text-bone">{initials(row.client.fullName || row.client.email)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className={cn("truncate text-sm", row.unreadCount ? "font-semibold text-bone" : "font-medium")}>
                    {row.client.fullName || row.client.email}
                    {row.client.company && <span className="ml-1.5 font-normal text-bone-faint">· {row.client.company}</span>}
                  </p>
                  {last && (
                    <span className="shrink-0 font-mono text-[0.625rem] text-bone-faint" suppressHydrationWarning>
                      {hydrated ? formatRecent(last.createdAt) : "\u00a0"}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-3">
                  <p className={cn("truncate text-xs", row.unreadCount ? "text-bone" : "text-bone-dim")}>{preview}</p>
                  {row.unreadCount > 0 && (
                    <span className="shrink-0 rounded-full bg-vermilion px-1.5 py-0.5 font-mono text-[0.625rem] leading-none text-primary-foreground">
                      {row.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
