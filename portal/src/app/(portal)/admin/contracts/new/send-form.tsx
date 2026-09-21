"use client";

import { startTransition, useState } from "react";
import { FileUp, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormMessage } from "@/components/form-bits";
import { NativeSelect } from "@/components/native-select";
import { CONTRACT_PDF_MAX_BYTES, CONTRACT_PDF_MAX_LABEL, describeUploadFailure, formatBytes, looksLikePdf } from "@/lib/contracts";
import { createContractUpload, sendContract, type FormState } from "../../actions";

interface Props {
  clients: { id: string; label: string }[];
  projects: { id: string; clientId: string; name: string }[];
  defaultClientId?: string;
}

type Phase = { kind: "idle" } | { kind: "checking" } | { kind: "uploading"; percent: number } | { kind: "sending" };

const IDLE: FormState = { status: "idle" };

/** Sends an agreement in three steps: check the PDF in the browser, upload
 *  it straight to storage (with progress), then ask the server to record the
 *  agreement. Only the small form fields travel through the server action, so
 *  large PDFs never hit the hosting platform's request-body cap. */
export function SendContractForm({ clients, projects, defaultClientId }: Props) {
  const [state, setState] = useState<FormState>(IDLE);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [file, setFile] = useState<File | null>(null);
  const clientProjects = projects.filter((p) => p.clientId === clientId);
  const busy = phase.kind !== "idle";

  const fail = (message: string) => {
    setState({ status: "error", message });
    setPhase({ kind: "idle" });
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const formData = new FormData(event.currentTarget);
    const pdf = formData.get("pdf");
    formData.delete("pdf");

    setState(IDLE);
    setPhase({ kind: "checking" });
    try {
      const problem = await checkPdf(pdf);
      if (problem) return fail(problem);

      const ticket = await createContractUpload();
      if (ticket.status === "error") return fail(ticket.message);

      setPhase({ kind: "uploading", percent: 0 });
      await putFile(ticket.url, ticket.headers, pdf as File, (percent) => setPhase({ kind: "uploading", percent }));

      setPhase({ kind: "sending" });
      formData.set("uploadId", ticket.id);
      startTransition(async () => {
        // On success the action redirects to the new agreement, so nothing
        // comes back here; an error message does.
        const result = await sendContract(IDLE, formData).catch(
          (): FormState => ({ status: "error", message: "The agreement couldn't be saved. Please try again." }),
        );
        if (result?.status === "error") fail(result.message ?? "Something went wrong.");
      });
    } catch (e) {
      fail(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface space-y-5 p-6">
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
      <Field
        label="Agreement PDF"
        htmlFor="pdf"
        hint={`Up to ${CONTRACT_PDF_MAX_LABEL}. This exact file is what the client signs; its SHA-256 fingerprint is recorded.`}
      >
        <label
          htmlFor="pdf"
          className="flex cursor-pointer items-center gap-3 rounded-inner border border-dashed border-input bg-surface-raised/60 px-4 py-4 text-sm text-bone-dim transition-colors hover:border-bone/40 hover:text-bone"
        >
          <FileUp className="size-5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{file ? file.name : "Choose a PDF…"}</span>
          {file && <span className="shrink-0 text-xs tabular-nums text-bone-faint">{formatBytes(file.size)}</span>}
          <input
            id="pdf"
            name="pdf"
            type="file"
            accept="application/pdf,.pdf"
            required
            disabled={busy}
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {phase.kind === "uploading" && (
          <div
            role="progressbar"
            aria-label="Upload progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={phase.percent}
            className="h-1 w-full overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${phase.percent}%` }} />
          </div>
        )}
      </Field>
      <FormMessage state={state} />
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden /> {phaseLabel(phase)}
          </>
        ) : (
          <>
            <Send className="size-4" aria-hidden /> Send for signature
          </>
        )}
      </Button>
    </form>
  );
}

function phaseLabel(phase: Phase): string {
  switch (phase.kind) {
    case "checking":
      return "Checking the PDF…";
    case "uploading":
      return `Uploading… ${phase.percent}%`;
    case "sending":
      return "Sending…";
    default:
      return "";
  }
}

/** Client-side checks so obvious problems are reported before any upload
 *  starts. The server re-checks size and signature on the stored bytes. */
async function checkPdf(file: FormDataEntryValue | null): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return "Attach the agreement as a PDF.";
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return "Only PDF files are supported.";
  if (file.size > CONTRACT_PDF_MAX_BYTES) {
    return `That PDF is ${formatBytes(file.size)}; the limit is ${CONTRACT_PDF_MAX_LABEL}. Try "Reduce File Size" in Preview or Acrobat, then send it again.`;
  }
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (!looksLikePdf(head)) return "That file doesn't look like a PDF.";
  return null;
}

/** PUTs the file with XMLHttpRequest, which (unlike fetch) reports upload
 *  progress. Resolves on any 2xx; rejects with a human-readable message. */
function putFile(url: string, headers: Record<string, string>, file: File, onProgress: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [key, value] of Object.entries(headers)) xhr.setRequestHeader(key, value);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(describeUploadFailure(xhr.status, xhr.responseText)));
    };
    xhr.onerror = () => reject(new Error(describeUploadFailure(0, "")));
    xhr.onabort = () => reject(new Error("The upload was cancelled."));
    xhr.send(file);
  });
}
