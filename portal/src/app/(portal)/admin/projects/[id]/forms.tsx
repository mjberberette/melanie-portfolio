"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus, Save, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormMessage, SubmitButton } from "@/components/form-bits";
import { NativeSelect } from "@/components/native-select";
import {
  PHASES,
  PHASE_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  UPDATE_KINDS,
  type Project,
} from "@/lib/types";
import { addMilestone, postUpdate, updateProject, type FormState } from "../../actions";

const KIND_LABELS = { update: "Progress update", deliverable: "Deliverable", decision: "Decision" } as const;

export function EditProjectForm({ project }: { project: Project }) {
  const [state, action] = useActionState<FormState, FormData>(updateProject, { status: "idle" });
  return (
    <form action={action} className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <input type="hidden" name="id" value={project.id} />
      <Field label="Project name" htmlFor="name">
        <Input id="name" name="name" defaultValue={project.name} required className="bg-ink-raised" />
      </Field>
      <Field label="Summary" htmlFor="summary">
        <Textarea id="summary" name="summary" rows={3} defaultValue={project.summary} className="bg-ink-raised" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Phase" htmlFor="phase">
          <NativeSelect id="phase" name="phase" defaultValue={project.phase}>
            {PHASES.map((p) => (
              <option key={p} value={p}>
                {PHASE_LABELS[p]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Status" htmlFor="status">
          <NativeSelect id="status" name="status" defaultValue={project.status}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Target launch" htmlFor="targetLaunch">
          <Input id="targetLaunch" name="targetLaunch" type="date" defaultValue={project.targetLaunch ?? ""} className="bg-ink-raised" />
        </Field>
      </div>
      <Field
        label="Next step"
        htmlFor="nextStep"
        hint='Shown at the top of the client’s project page. With status "Awaiting your input" it becomes a call to action on their overview.'
      >
        <Textarea id="nextStep" name="nextStep" rows={2} defaultValue={project.nextStep ?? ""} className="bg-ink-raised" />
      </Field>
      <div className="flex items-center justify-between gap-4">
        <FormMessage state={state} />
        <SubmitButton pendingLabel="Saving…" className="ml-auto">
          <Save className="size-4" aria-hidden /> Save changes
        </SubmitButton>
      </div>
    </form>
  );
}

export function MilestoneForm({ projectId }: { projectId: string }) {
  const [state, action] = useActionState<FormState, FormData>(addMilestone, { status: "idle" });
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "ok") ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-3 rounded-2xl border border-dashed border-border p-4">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
        <Input name="title" placeholder="New milestone" required aria-label="Milestone title" className="bg-ink-raised" />
        <Input name="dueDate" type="date" aria-label="Due date" className="bg-ink-raised" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <FormMessage state={state} />
        <SubmitButton variant="outline" size="sm" pendingLabel="Adding…" className="ml-auto">
          <Plus className="size-4" aria-hidden /> Add milestone
        </SubmitButton>
      </div>
    </form>
  );
}

export function UpdateForm({ projectId }: { projectId: string }) {
  const [state, action] = useActionState<FormState, FormData>(postUpdate, { status: "idle" });
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "ok") ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid gap-4 sm:grid-cols-[11rem_1fr]">
        <Field label="Type" htmlFor="kind">
          <NativeSelect id="kind" name="kind" defaultValue="update">
            {UPDATE_KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Title" htmlFor="title">
          <Input id="title" name="title" required className="bg-ink-raised" placeholder="e.g. Homepage design, round 2" />
        </Field>
      </div>
      <Field label="Note to the client" htmlFor="body">
        <Textarea id="body" name="body" rows={4} required className="bg-ink-raised" placeholder="What changed, what you need from them, and by when." />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <Field label="Link (optional)" htmlFor="linkUrl">
          <Input id="linkUrl" name="linkUrl" type="url" placeholder="https://www.figma.com/…" className="bg-ink-raised" />
        </Field>
        <Field label="Link label" htmlFor="linkLabel">
          <Input id="linkLabel" name="linkLabel" placeholder="Open in Figma" className="bg-ink-raised" />
        </Field>
      </div>
      <div className="flex items-center justify-between gap-4">
        <FormMessage state={state} />
        <SubmitButton pendingLabel="Posting…" className="ml-auto">
          <Send className="size-4" aria-hidden /> Post update
        </SubmitButton>
      </div>
    </form>
  );
}
