"use client";

import { useActionState, useEffect, useRef } from "react";
import { ArrowRight, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestMagicLink, type LoginState } from "./actions";

interface DemoAccount {
  email: string;
  label: string;
  hint: string;
}

export function LoginForm({ next, demoAccounts }: { next: string; demoAccounts: DemoAccount[] | null }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(requestMagicLink, { status: "idle" });
  const emailRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "error") emailRef.current?.focus();
  }, [state]);

  if (state.status === "sent") {
    return (
      <div className="rounded-2xl border border-border bg-card p-6" role="status">
        <MailCheck className="size-6 text-vermilion" aria-hidden />
        <h2 className="display mt-4 text-2xl">Check your inbox</h2>
        <p className="mt-2 text-sm leading-relaxed text-bone-dim">
          A sign-in link is on its way to <span className="text-bone">{state.email}</span>. It works once and
          expires in an hour. You can close this tab.
        </p>
      </div>
    );
  }

  const fillDemo = (email: string) => {
    if (!emailRef.current || !formRef.current) return;
    emailRef.current.value = email;
    formRef.current.requestSubmit();
  };

  return (
    <form ref={formRef} action={action} className="space-y-5" noValidate>
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
          defaultValue={state.email ?? ""}
          required
          aria-invalid={state.status === "error" || undefined}
          aria-describedby={state.status === "error" ? "email-error" : "email-hint"}
          className="h-12 bg-ink-raised text-base"
        />
        {state.status === "error" ? (
          <p id="email-error" className="text-sm text-vermilion-soft">
            {state.message}
          </p>
        ) : (
          <p id="email-hint" className="text-xs text-bone-faint">
            {demoAccounts ? "Demo mode: no email is sent." : "We'll email you a one-time sign-in link. No password to remember."}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" disabled={pending} className="h-12 w-full justify-between text-base font-medium">
        {pending ? "Signing you in…" : demoAccounts ? "Sign in" : "Email me a sign-in link"}
        <ArrowRight className="size-4" aria-hidden />
      </Button>

      {demoAccounts && (
        <div className="rounded-xl border border-dashed border-border p-4">
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
