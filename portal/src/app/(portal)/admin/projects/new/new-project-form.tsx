"use client";

import { useActionState } from "react";
import { FolderPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormMessage, SubmitButton } from "@/components/form-bits";
import { NativeSelect } from "@/components/native-select";
import { todayISO } from "@/lib/format";
import { PHASES, PHASE_LABELS, PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/types";
import { createProject, type FormState } from "../../actions";

export function NewProjectForm({ clients }: { clients: { id: string; label: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(createProject, { status: "idle" });
  return (
    <form action={action} className="surface space-y-5 p-6">
      <Field label="Client" htmlFor="clientId">
        <NativeSelect id="clientId" name="clientId" required defaultValue="">
          <option value="" disabled>
            Choose a client
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Project name" htmlFor="name">
        <Input id="name" name="name" required className="bg-ink-raised" placeholder="e.g. Marketing site redesign" />
      </Field>
      <Field label="Summary" htmlFor="summary" hint="One or two sentences on what you're making together.">
        <Textarea id="summary" name="summary" rows={3} className="bg-ink-raised" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phase" htmlFor="phase">
          <NativeSelect id="phase" name="phase" defaultValue="discovery">
            {PHASES.map((p) => (
              <option key={p} value={p}>
                {PHASE_LABELS[p]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Status" htmlFor="status">
          <NativeSelect id="status" name="status" defaultValue="on_track">
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Start date" htmlFor="startDate">
          <Input id="startDate" name="startDate" type="date" required defaultValue={todayISO()} className="bg-ink-raised" />
        </Field>
        <Field label="Target launch" htmlFor="targetLaunch" hint="Leave blank if not agreed yet.">
          <Input id="targetLaunch" name="targetLaunch" type="date" className="bg-ink-raised" />
        </Field>
      </div>
      <Field label="Next step" htmlFor="nextStep" hint="Shown prominently to the client. What happens next, or what you need from them.">
        <Textarea id="nextStep" name="nextStep" rows={2} className="bg-ink-raised" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Creating…" className="w-full">
        <FolderPlus className="size-4" aria-hidden /> Create project
      </SubmitButton>
    </form>
  );
}
