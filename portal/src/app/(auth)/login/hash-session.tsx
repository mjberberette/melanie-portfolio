"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2 } from "lucide-react";

/** Supabase's default email templates land users on the Site URL with the
 *  session in the URL fragment (#access_token=…). Servers never see fragments,
 *  so this finishes the sign-in in the browser, persists the session cookies,
 *  and reloads into the portal. Links that use the token_hash templates go
 *  through /auth/callback instead and never reach this code. */
export function HashSession({ url, anonKey, next }: { url: string; anonKey: string; next: string }) {
  const [state, setState] = useState<"idle" | "working" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const clearHash = () => history.replaceState(null, "", window.location.pathname + window.location.search);

    const fail = (msg: string) => {
      setState("error");
      setMessage(msg);
      clearHash();
    };

    const finish = async (access_token: string, refresh_token: string) => {
      setState("working");
      const supabase = createBrowserClient(url, anonKey);
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) return fail("That sign-in link couldn't be verified. Request a new one below.");
      window.location.replace(next.startsWith("/") ? next : "/");
    };

    const description = params.get("error_description");
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    // Deferred so state updates happen in a callback rather than the effect body.
    const id = window.setTimeout(() => {
      if (description) fail(description.replace(/\+/g, " "));
      else if (access_token && refresh_token) void finish(access_token, refresh_token);
    }, 0);
    return () => window.clearTimeout(id);
  }, [url, anonKey, next]);

  if (state === "working") {
    return (
      <p role="status" className="mt-6 inline-flex items-center gap-2 text-sm text-bone-dim">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Signing you in…
      </p>
    );
  }
  if (state === "error" && message) {
    return (
      <p role="alert" className="mt-6 rounded-lg border border-vermilion/40 bg-vermilion/10 px-4 py-3 text-sm text-bone">
        {message}
      </p>
    );
  }
  return null;
}
