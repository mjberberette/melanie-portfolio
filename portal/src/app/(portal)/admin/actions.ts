"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { PHASES, PROJECT_STATUSES, UPDATE_KINDS } from "@/lib/types";

export interface FormState {
  status: "idle" | "error" | "ok";
  message?: string;
}

const optional = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => (s === "" ? null : s));
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.");
const optionalDate = z
  .string()
  .trim()
  .transform((s) => (s === "" ? null : s))
  .pipe(isoDate.nullable());

function firstIssue(e: z.ZodError): FormState {
  return { status: "error", message: e.issues[0]?.message ?? "Check the form and try again." };
}
function failed(e: unknown): FormState {
  return { status: "error", message: e instanceof Error ? e.message : "Something went wrong." };
}

/* Clients ------------------------------------------------------------- */

const clientSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the client's name."),
  email: z.string().trim().email("Enter a valid email address."),
  company: optional(120),
});

export async function inviteClient(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssue(parsed.error);
  try {
    await getStore().createClient(parsed.data);
  } catch (e) {
    return failed(e);
  }
  revalidatePath("/admin");
  redirect("/admin?tab=clients&invited=1");
}

/* Projects ------------------------------------------------------------ */

const projectSchema = z.object({
  clientId: z.string().min(1, "Choose a client."),
  name: z.string().trim().min(2, "Give the project a name."),
  summary: z.string().trim().max(2000).default(""),
  phase: z.enum(PHASES),
  status: z.enum(PROJECT_STATUSES),
  startDate: isoDate,
  targetLaunch: optionalDate,
  nextStep: optional(600),
});

export async function createProject(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssue(parsed.error);
  let id: string;
  try {
    id = (await getStore().createProject(parsed.data)).id;
  } catch (e) {
    return failed(e);
  }
  revalidatePath("/", "layout");
  redirect(`/admin/projects/${id}`);
}

const projectPatchSchema = projectSchema.omit({ clientId: true, startDate: true });

export async function updateProject(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = projectPatchSchema.safeParse(Object.fromEntries(formData));
  if (!id || !parsed.success) return parsed.success ? { status: "error", message: "Missing project." } : firstIssue(parsed.error);
  try {
    await getStore().updateProject(id, parsed.data);
  } catch (e) {
    return failed(e);
  }
  revalidatePath("/", "layout");
  return { status: "ok", message: "Project saved." };
}

export async function addMilestone(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = z
    .object({ projectId: z.string().min(1), title: z.string().trim().min(2, "Name the milestone."), dueDate: optionalDate })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssue(parsed.error);
  try {
    await getStore().addMilestone(parsed.data.projectId, parsed.data.title, parsed.data.dueDate);
  } catch (e) {
    return failed(e);
  }
  revalidatePath("/", "layout");
  return { status: "ok" };
}

export async function toggleMilestone(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const complete = formData.get("complete") === "1";
  if (id) await getStore().setMilestoneComplete(id, complete);
  revalidatePath("/", "layout");
}

export async function deleteMilestone(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await getStore().deleteMilestone(id);
  revalidatePath("/", "layout");
}

export async function postUpdate(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = z
    .object({
      projectId: z.string().min(1),
      kind: z.enum(UPDATE_KINDS),
      title: z.string().trim().min(2, "Give the update a title."),
      body: z.string().trim().min(1, "Write a short note for the client."),
      linkUrl: optional(500).pipe(z.string().url("Enter a full URL, including https://").nullable()),
      linkLabel: optional(80),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssue(parsed.error);
  const { projectId, ...input } = parsed.data;
  try {
    await getStore().addUpdate(projectId, input);
  } catch (e) {
    return failed(e);
  }
  revalidatePath("/", "layout");
  return { status: "ok", message: "Update posted." };
}

/* Agreements ---------------------------------------------------------- */

const MAX_PDF = 20 * 1024 * 1024;

export async function sendContract(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = z
    .object({
      clientId: z.string().min(1, "Choose a client."),
      projectId: optional(64),
      title: z.string().trim().min(2, "Give the agreement a title."),
      description: optional(600),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return firstIssue(parsed.error);

  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "Attach the agreement as a PDF." };
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { status: "error", message: "Only PDF files are supported." };
  }
  if (file.size > MAX_PDF) return { status: "error", message: "PDFs need to be under 20 MB." };

  const pdf = new Uint8Array(await file.arrayBuffer());
  if (String.fromCharCode(...pdf.slice(0, 4)) !== "%PDF") return { status: "error", message: "That file doesn't look like a PDF." };

  let id: string;
  try {
    id = (await getStore().createContract({ ...parsed.data, pdf })).id;
  } catch (e) {
    return failed(e);
  }
  revalidatePath("/", "layout");
  redirect(`/contracts/${id}`);
}

export async function voidContract(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await getStore().voidContract(id);
  revalidatePath("/", "layout");
}
