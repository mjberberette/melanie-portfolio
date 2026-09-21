"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Field, FormMessage, SubmitButton } from "@/components/form-bits";
import { inviteClient, type FormState } from "../../actions";

export function InviteClientForm() {
  const [state, action] = useActionState<FormState, FormData>(inviteClient, { status: "idle" });
  return (
    <form action={action} className="surface space-y-5 p-6">
      <Field label="Full name" htmlFor="fullName">
        <Input id="fullName" name="fullName" required autoComplete="off" className="bg-ink-raised" />
      </Field>
      <Field label="Email" htmlFor="email" hint="This is the address they'll sign in with.">
        <Input id="email" name="email" type="email" required autoComplete="off" className="bg-ink-raised" />
      </Field>
      <Field label="Company" htmlFor="company">
        <Input id="company" name="company" autoComplete="off" className="bg-ink-raised" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Inviting…" className="w-full">
        <UserPlus className="size-4" aria-hidden /> Send invitation
      </SubmitButton>
    </form>
  );
}
