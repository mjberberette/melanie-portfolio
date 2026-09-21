"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const LIVE_POLL_MS = 30_000;
const FALLBACK_POLL_MS = 4_000;

/** Calls `onChange` whenever messages may have changed.
 *
 *  With Supabase configured, it subscribes to Realtime change events on
 *  `messages` (scoped to one conversation when given; RLS keeps a client's
 *  socket to their own thread either way) and polls only as a slow safety
 *  net. Without Supabase, or when the channel fails to subscribe, it polls
 *  every few seconds instead. Either way it refreshes when the tab regains
 *  focus. Returns whether realtime is currently delivering. */
export function useLiveMessages(conversationId: string | null, onChange: () => void): boolean {
  const [live, setLive] = useState(false);
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel(`messages:${conversationId ?? "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", ...(conversationId ? { filter: `conversation_id=eq.${conversationId}` } : {}) },
        () => cb.current(),
      )
      .subscribe((status) => {
        const ok = status === "SUBSCRIBED";
        setLive(ok);
        if (ok) cb.current();
      });
    return () => {
      supabase.removeChannel(channel);
      setLive(false);
    };
  }, [conversationId]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") cb.current();
    }, live ? LIVE_POLL_MS : FALLBACK_POLL_MS);
    return () => clearInterval(id);
  }, [live]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") cb.current();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  return live;
}

/** False during server rendering and hydration, true afterwards. Times and
 *  day labels depend on the browser's time zone, so they render only then. */
const noop = () => () => {};
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
