import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { NewProjectForm } from "./new-project-form";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requireAdmin();
  const clients = (await getStore().listProfiles()).filter((p) => p.role === "client");
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-bone-dim hover:text-bone">
        <ArrowLeft className="size-4" aria-hidden /> Studio admin
      </Link>
      <div>
        <p className="eyebrow">Projects</p>
        <h1 className="display mt-3 text-4xl">Start a project</h1>
        <p className="mt-3 text-sm leading-relaxed text-bone-dim">
          The client sees the name, summary, phase, status, and next step exactly as written here. You can add milestones
          and post updates right after.
        </p>
      </div>
      {clients.length === 0 ? (
        <p className="surface-empty p-8 text-center text-sm text-bone-dim">
          Invite a client first — projects belong to a client account.
        </p>
      ) : (
        <NewProjectForm clients={clients.map((c) => ({ id: c.id, label: `${c.fullName}${c.company ? ` — ${c.company}` : ""}` }))} />
      )}
    </div>
  );
}
