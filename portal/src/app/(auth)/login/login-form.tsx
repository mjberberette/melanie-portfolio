"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowRight, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestMagicLink, signInWithPassword, type LoginState } from "./actions";

interface DemoAccount {
  email: string;
  label: string;
  hint: string;
}

type Mode = "password" | "link";

export function LoginForm({ next, demoAccounts }: { next: string; demoAccounts: DemoAccount[] | null }) {
  // Demo accounts have no passwords, so demo mode only offers the direct sign-in.
  const [mode, setMode] = useState<Mode>(demoAccounts ? "link" : "password");
  const [email, setEmail] = useState("");
  const [linkState, linkAction, linkPending] = useActionState<LoginState, FormData>(requestMagicLink, { status: "idle" });
  const [pwState, pwAction, pwPending] = useActionState<LoginState, FormData>(signInWithPassword, { status: "idle" });
  const emailRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const state = mode === "password" ? pwState : linkState;
  const pending = mode === "password" ? pwPending : linkPending;

  useEffect(() => {
    if (state.status === "error") emailRef.current?.focus();
  }, [state]);

  if (linkState.status === "sent") {
    return (
      <div className="surface p-6" role="status">
        <MailCheck className="size-6 text-vermilion" aria-hidden />
        <h2 className="display mt-4 text-2xl">Check your inbox</h2>
        <p className="mt-2 text-sm leading-relaxed text-bone-dim">
          A sign-in link is on its way to <span className="text-bone">{linkState.email}</span>. It works once and
          expires in an hour. You can close this tab.
        </p>
      </div>
    );
  }

  const fillDemo = (address: string) => {
    if (!formRef.current) return;
    setEmail(address);
    if (emailRef.current) emailRef.current.value = address;
    formRef.current.requestSubmit();
  };

  const switchMode = (to: Mode) => {
    setMode(to);
    window.setTimeout(() => emailRef.current?.focus(), 0);
  };

  const errorId = state.status === "error" ? "login-error" : undefined;

  return (
    <form ref={formRef} action={mode === "password" ? pwAction : linkAction} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-invalid={state.status === "error" || undefined}
          aria-describedby={errorId ?? (mode === "link" ? "email-hint" : undefined)}
          className="h-12 bg-ink-raised text-base"
        />
        {mode === "link" && state.status !== "error" && (
          <p id="email-hint" className="text-xs text-bone-faint">
            {demoAccounts ? "Demo mode: no email is sent." : "We'll email you a one-time sign-in link. No password needed."}
          </p>
        )}
      </div>

      {mode === "password" && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-bone-dim underline-offset-4 hover:text-bone hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={state.status === "error" || undefined}
            aria-describedby={errorId}
            className="h-12 bg-ink-raised text-base"
          />
        </div>
      )}

      {state.status === "error" && (
        <p id="login-error" role="alert" className="text-sm text-vermilion-soft">
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="h-12 w-full justify-between text-base font-medium">
        {pending ? "Signing you in…" : mode === "password" || demoAccounts ? "Sign in" : "Email me a sign-in link"}
        <ArrowRight className="size-4" aria-hidden />
      </Button>

      {!demoAccounts && (
        <p className="text-center text-sm text-bone-dim">
          {mode === "password" ? (
            <>
              No password yet, or prefer not to type one?{" "}
              <button type="button" onClick={() => switchMode("link")} className="text-bone underline underline-offset-4 hover:text-vermilion-soft">
                Email me a sign-in link
              </button>
            </>
          ) : (
            <>
              Have a password?{" "}
              <button type="button" onClick={() => switchMode("password")} className="text-bone underline underline-offset-4 hover:text-vermilion-soft">
                Sign in with it instead
              </button>
            </>
          )}
        </p>
      )}

      {demoAccounts && (
        <div className="surface-empty p-4">
          <p className="eyebrow">Sample accounts</p>
          <ul className="mt-3 divide-y divide-border">
            {demoAccounts.map((a) => (
              <li key={a.email} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm">{a.label}</p>
                  <p className="truncate text-xs text-bone-faint">{a.hint}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => fillDemo(a.email)} disabled={pending}>
                  Use
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
