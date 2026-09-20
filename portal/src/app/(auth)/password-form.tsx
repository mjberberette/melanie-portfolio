"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_HINT, PASSWORD_MIN_LENGTH } from "@/lib/password";
import { updatePassword, type PasswordState } from "./login/actions";

/** Password + confirmation form used both when an invited client creates
 *  their first password and when someone resets a forgotten one. */
export function PasswordForm({ next, submitLabel }: { next: string; submitLabel: string }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(updatePassword, { status: "idle" });
  const [visible, setVisible] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "error") passwordRef.current?.focus();
  }, [state]);

  const invalid = state.status === "error" || undefined;
  const type = visible ? "text" : "password";

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="password">New password</Label>
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            className="inline-flex items-center gap-1 text-xs text-bone-dim underline-offset-4 hover:text-bone hover:underline"
          >
            {visible ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
            {visible ? "Hide" : "Show"}
          </button>
        </div>
        <Input
          ref={passwordRef}
          id="password"
          name="password"
          type={type}
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          aria-invalid={invalid}
          aria-describedby={invalid ? "password-error" : "password-hint"}
          className="h-12 bg-ink-raised text-base"
        />
        <p id="password-hint" className="text-xs text-bone-faint">
          {PASSWORD_HINT}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          name="confirm"
          type={type}
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          aria-invalid={invalid}
          aria-describedby={invalid ? "password-error" : undefined}
          className="h-12 bg-ink-raised text-base"
        />
      </div>
      {state.status === "error" && (
        <p id="password-error" role="alert" className="text-sm text-vermilion-soft">
          {state.message}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} className="h-12 w-full justify-between text-base font-medium">
        {pending ? "Saving…" : submitLabel}
        <ArrowRight className="size-4" aria-hidden />
      </Button>
    </form>
  );
}
