"use client";

import { useActionState, useState } from "react";
import { FileUp, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormMessage, SubmitButton } from "@/components/form-bits";
import { NativeSelect } from "@/components/native-select";
import { sendContract, type FormState } from "../../actions";

interface Props {
  clients: { id: string; label: string }[];
  projects: { id: string; clientId: string; name: string }[];
  defaultClientId?: string;
}

export function SendContractForm({ clients, projects, defaultClientId }: Props) {
  const [state, action] = useActionState<FormState, FormData>(sendContract, { status: "idle" });
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [fileName, setFileName] = useState<string | null>(null);
  const clientProjects = projects.filter((p) => p.clientId === clientId);

  return (
    <form action={action} className="space-y-5 rounded-2xl border border-border bg-card p-6">
      <Field label="Client" htmlFor="clientId">
        <NativeSelect id="clientId" name="clientId" required value={clientId} onChange={(e) => setClientId(e.target.value)}>
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
      <Field label="Project (optional)" htmlFor="projectId" hint="Links the agreement to a project so it appears on that project's page.">
        <NativeSelect id="projectId" name="projectId" defaultValue="" disabled={!clientId}>
          <option value="">{clientId ? (clientProjects.length ? "No specific project" : "This client has no projects yet") : "Choose a client first"}</option>
          {clientProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Title" htmlFor="title">
        <Input id="title" name="title" required placeholder="e.g. Statement of Work — Phase 2" className="bg-ink-raised" />
      </Field>
      <Field label="Short description" htmlFor="description" hint="One line on what this covers, shown above the document.">
        <Textarea id="description" name="description" rows={2} className="bg-ink-raised" />
      </Field>
      <Field label="Agreement PDF" htmlFor="pdf" hint="Up to 20 MB. This exact file is what the client signs; its SHA-256 fingerprint is recorded.">
        <label
          htmlFor="pdf"
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-input bg-ink-raised px-4 py-4 text-sm text-bone-dim transition-colors hover:border-bone/40 hover:text-bone"
        >
          <FileUp className="size-5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{fileName ?? "Choose a PDF…"}</span>
          <input
            id="pdf"
            name="pdf"
            type="file"
            accept="application/pdf,.pdf"
            required
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Sending…" className="w-full">
        <Send className="size-4" aria-hidden /> Send for signature
      </SubmitButton>
    </form>
  );
}
