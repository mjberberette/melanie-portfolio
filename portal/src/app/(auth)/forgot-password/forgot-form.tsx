"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { ArrowRight, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, type LoginState } from "../login/actions";

export function ForgotPasswordForm({ email: initialEmail }: { email: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(requestPasswordReset, { status: "idle" });
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "error") emailRef.current?.focus();
  }, [state]);

  if (state.status === "sent") {
    return (
      <div className="surface p-6" role="status">
        <MailCheck className="size-6 text-vermilion" aria-hidden />
        <h2 className="display mt-4 text-2xl">Check your inbox</h2>
        <p className="mt-2 text-sm leading-relaxed text-bone-dim">
          If <span className="text-bone">{state.email}</span> has a portal account, a password reset link is on its way.
          It works once and expires in an hour.
        </p>
        <p className="mt-4 text-sm text-bone-dim">
          Nothing arrived?{" "}
          <Link href="/login" className="text-bone underline underline-offset-4 hover:text-vermilion-soft">
            Email me a sign-in link instead
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
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
          defaultValue={state.email ?? initialEmail}
          required
          aria-invalid={state.status === "error" || undefined}
          aria-describedby={state.status === "error" ? "email-error" : "email-hint"}
          className="h-12 bg-ink-raised text-base"
        />
        {state.status === "error" ? (
          <p id="email-error" role="alert" className="text-sm text-vermilion-soft">
            {state.message}
          </p>
        ) : (
          <p id="email-hint" className="text-xs text-bone-faint">
            We&apos;ll email you a link to choose a new password.
          </p>
        )}
      </div>
      <Button type="submit" size="lg" disabled={pending} className="h-12 w-full justify-between text-base font-medium">
        {pending ? "Sending…" : "Email me a reset link"}
        <ArrowRight className="size-4" aria-hidden />
      </Button>
      <p className="text-center text-sm text-bone-dim">
        <Link href="/login" className="text-bone underline underline-offset-4 hover:text-vermilion-soft">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
