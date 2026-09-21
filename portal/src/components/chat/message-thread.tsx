"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, CheckCheck, Loader2, RotateCcw, Wifi } from "lucide-react";
import { toast } from "sonner";
import { fetchThread, sendMessage } from "@/app/(portal)/messages/actions";
import { MessageBody } from "@/components/chat/message-body";
import type { Participant } from "@/components/chat/participant";
import { useHydrated, useLiveMessages } from "@/components/chat/use-live-messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { dayKey, formatDayLabel, formatTime, initials } from "@/lib/format";
import { messageBodyProblem, normaliseMessageBody } from "@/lib/messages";
import { MESSAGE_MAX_LENGTH, type Message } from "@/lib/types";
import { cn } from "@/lib/utils";

type ThreadMessage = Message & {
  /** Sent from this browser and not yet confirmed by the server. */
  pending?: boolean;
  failed?: boolean;
};

const GROUP_GAP_MS = 10 * 60_000;
const NEAR_BOTTOM_PX = 96;

interface Group {
  key: string;
  senderId: string;
  mine: boolean;
  messages: ThreadMessage[];
}

function groupMessages(messages: ThreadMessage[], meId: string): { day: string; groups: Group[] }[] {
  const days: { day: string; groups: Group[] }[] = [];
  for (const m of messages) {
    const day = dayKey(m.createdAt);
    let bucket = days[days.length - 1];
    if (!bucket || bucket.day !== day) {
      bucket = { day, groups: [] };
      days.push(bucket);
    }
    const last = bucket.groups[bucket.groups.length - 1];
    const prev = last?.messages[last.messages.length - 1];
    if (last && prev && last.senderId === m.senderId && new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < GROUP_GAP_MS) {
      last.messages.push(m);
    } else {
      bucket.groups.push({ key: m.id, senderId: m.senderId, mine: m.senderId === meId, messages: [m] });
    }
  }
  return days;
}

export function MessageThread({
  conversationId,
  me,
  participants,
  initialMessages,
  placeholder = "Write a message…",
  emptyTitle = "No messages yet",
  emptyHint,
  className,
}: {
  conversationId: string;
  me: Participant;
  /** Everyone who might appear in the thread, keyed by profile id. */
  participants: Record<string, Participant>;
  initialMessages: Message[];
  placeholder?: string;
  emptyTitle?: string;
  emptyHint?: string;
  className?: string;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [unseen, setUnseen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef(messages);
  const atBottomRef = useRef(true);
  const inFlight = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /* Loading ------------------------------------------------------------ */

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const visible = typeof document !== "undefined" && document.visibilityState === "visible";
      const res = await fetchThread(conversationId, undefined, visible);
      if (res.status !== "ok") return;
      const current = messagesRef.current;
      const pending = current.filter((m) => m.pending || m.failed);
      const confirmed = res.messages as ThreadMessage[];
      const next = [...confirmed, ...pending.filter((p) => !confirmed.some((c) => c.id === p.id))];
      const changed = next.length !== current.length || next.some((m, i) => m.id !== current[i]?.id || m.readAt !== current[i]?.readAt);
      if (changed) {
        setMessages(next);
        const tail = next[next.length - 1];
        if (next.length > current.length && tail && tail.senderId !== me.id && !atBottomRef.current) setUnseen(true);
      }
      // Reading clears the unread badge in the sidebar, which is rendered
      // on the server.
      if (res.readMarked > 0) router.refresh();
    } finally {
      inFlight.current = false;
    }
  }, [conversationId, me.id, router]);

  const live = useLiveMessages(conversationId, refresh);

  /* Scrolling ---------------------------------------------------------- */

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    scrollToBottom("instant");
  }, [scrollToBottom]);

  // Stay pinned to the bottom while content is still settling — fonts and
  // avatars loading, day labels appearing after hydration, the composer
  // growing — as long as the reader hasn't scrolled up.
  useEffect(() => {
    const el = listRef.current;
    const content = contentRef.current;
    if (!el || !content || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (atBottomRef.current) el.scrollTo({ top: el.scrollHeight, behavior: "instant" });
    });
    ro.observe(el);
    ro.observe(content);
    return () => ro.disconnect();
  }, []);

  // Follow new messages while reading at the bottom, and always follow
  // what you just sent; otherwise the "New messages" pill takes over.
  const lastId = messages[messages.length - 1]?.id;
  const lastMine = messages[messages.length - 1]?.senderId === me.id;
  useEffect(() => {
    if (lastId && (atBottomRef.current || lastMine)) scrollToBottom();
  }, [lastId, lastMine, scrollToBottom]);

  function onScroll() {
    const el = listRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    if (atBottomRef.current) setUnseen(false);
  }

  function jumpToLatest() {
    setUnseen(false);
    scrollToBottom();
  }

  /* Sending ------------------------------------------------------------ */

  const send = useCallback(
    async (text: string, retryId?: string) => {
      const body = normaliseMessageBody(text);
      const problem = messageBodyProblem(body);
      if (problem) {
        toast.error(problem);
        return;
      }
      const tempId = retryId ?? `pending-${crypto.randomUUID()}`;
      const optimistic: ThreadMessage = {
        id: tempId,
        conversationId,
        senderId: me.id,
        senderRole: me.role,
        body,
        createdAt: new Date().toISOString(),
        readAt: null,
        pending: true,
      };
      setMessages((cur) => (retryId ? cur.map((m) => (m.id === retryId ? optimistic : m)) : [...cur, optimistic]));
      if (!retryId) setDraft("");
      atBottomRef.current = true;

      const res = await sendMessage(conversationId, body);
      if (res.status === "ok") {
        setMessages((cur) => {
          const withoutTemp = cur.filter((m) => m.id !== tempId && m.id !== res.message.id);
          return [...withoutTemp, res.message].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        });
      } else {
        setMessages((cur) => cur.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
        toast.error(res.message);
      }
    },
    [conversationId, me.id, me.role],
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (draft.trim()) void send(draft);
    }
  }

  // Grow with the text, up to a handful of lines.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [draft]);

  const days = useMemo(() => groupMessages(messages, me.id), [messages, me.id]);
  const lastReadMine = useMemo(() => [...messages].reverse().find((m) => m.senderId === me.id && m.readAt && !m.pending), [messages, me.id]);
  const remaining = MESSAGE_MAX_LENGTH - draft.length;

  return (
    <div className={cn("surface flex min-h-0 flex-col overflow-hidden", className)}>
      <div ref={listRef} onScroll={onScroll} className="relative flex-1 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite" aria-label="Messages">
        <div ref={contentRef} className="min-h-full space-y-6">
          {messages.length === 0 && (
            <div className="flex min-h-[16rem] flex-col items-center justify-center text-center">
              <p className="display text-2xl">{emptyTitle}</p>
              {emptyHint && <p className="mt-2 max-w-sm text-sm text-bone-dim">{emptyHint}</p>}
            </div>
          )}
          {days.map(({ day, groups }) => (
            <section key={day} className="space-y-4">
              <div className="flex items-center gap-3" aria-hidden={!hydrated}>
                <span className="h-px flex-1 bg-border" />
                <span className="eyebrow text-bone-faint" suppressHydrationWarning>
                  {hydrated ? formatDayLabel(groups[0]!.messages[0]!.createdAt) : "\u00a0"}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              {groups.map((g) => {
                const who = participants[g.senderId] ?? (g.mine ? me : null);
                const last = g.messages[g.messages.length - 1]!;
                return (
                  <div key={g.key} className={cn("flex items-end gap-2.5", g.mine ? "justify-end" : "justify-start")}>
                    {!g.mine && (
                      <Avatar className="mb-5 size-7 shrink-0 border border-border" aria-hidden>
                        {who?.avatarUrl && <AvatarImage src={who.avatarUrl} alt="" />}
                        <AvatarFallback className="bg-ink-veil font-mono text-[0.5625rem] text-bone">{initials(who?.name ?? "?")}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn("flex max-w-[85%] flex-col gap-1 sm:max-w-[70%]", g.mine ? "items-end" : "items-start")}>
                      {!g.mine && who && <span className="px-1 text-xs text-bone-faint">{who.name}</span>}
                      {g.messages.map((m) => (
                        <div
                          key={m.id}
                          className={cn(
                            "rounded-xl px-3.5 py-2 text-[0.9375rem] leading-relaxed wrap-break-word",
                            g.mine ? "rounded-br-md bg-[linear-gradient(135deg,var(--cta-from),var(--cta-to))] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.16)]" : "rounded-bl-md border border-surface-divider bg-surface-raised text-bone",
                            m.pending && "opacity-60",
                            m.failed && "border border-destructive/60 bg-destructive/10 bg-none text-bone shadow-none",
                          )}
                        >
                          <MessageBody body={m.body} className="whitespace-pre-wrap" />
                          {m.failed && (
                            <button
                              type="button"
                              onClick={() => send(m.body, m.id)}
                              className="mt-1.5 inline-flex items-center gap-1 text-xs text-vermilion-soft underline-offset-2 hover:underline"
                            >
                              <RotateCcw className="size-3" aria-hidden /> Not sent — tap to retry
                            </button>
                          )}
                        </div>
                      ))}
                      <span className="flex items-center gap-1 px-1 font-mono text-[0.625rem] text-bone-faint" suppressHydrationWarning>
                        {last.pending ? (
                          <>
                            <Loader2 className="size-3 animate-spin" aria-hidden /> Sending…
                          </>
                        ) : (
                          <>
                            {hydrated ? formatTime(last.createdAt) : "\u00a0"}
                            {g.mine && !last.failed && (lastReadMine?.id === last.id ? (
                              <CheckCheck className="size-3 text-vermilion-soft" aria-label="Seen" />
                            ) : (
                              <Check className="size-3" aria-label="Sent" />
                            ))}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      </div>

      {unseen && (
        <div className="pointer-events-none relative">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={jumpToLatest}
            className="pointer-events-auto absolute -top-12 left-1/2 -translate-x-1/2 shadow-lg"
          >
            <ArrowDown className="size-3.5" aria-hidden /> New messages
          </Button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) void send(draft);
        }}
        className="border-t border-surface-divider bg-surface-raised/40 p-3 sm:p-4"
      >
        <div className="flex items-end gap-2 rounded-lg border border-input bg-ink px-3 py-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={MESSAGE_MAX_LENGTH}
            placeholder={placeholder}
            aria-label="Message"
            className="max-h-[180px] min-h-6 flex-1 resize-none bg-transparent py-0.5 text-base leading-6 outline-none placeholder:text-bone-faint md:text-sm"
          />
          <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Send message" className="shrink-0 rounded-lg">
            <ArrowUp className="size-4" />
          </Button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[0.6875rem] text-bone-faint">
          <span className="hidden sm:inline">Enter to send · Shift+Enter for a new line</span>
          <span className="flex items-center gap-3 sm:ml-auto">
            {remaining < 500 && <span className={cn("font-mono", remaining < 0 && "text-vermilion-soft")}>{remaining.toLocaleString("en-US")} left</span>}
            <span className="inline-flex items-center gap-1" title={live ? "Live updates" : "Checking for new messages every few seconds"}>
              <Wifi className={cn("size-3", live ? "text-success" : "text-bone-faint")} aria-hidden />
              {live ? "Live" : "Auto-refresh"}
            </span>
          </span>
        </div>
      </form>
    </div>
  );
}
