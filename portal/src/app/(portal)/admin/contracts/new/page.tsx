import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { SendContractForm } from "./send-form";

export const metadata: Metadata = { title: "Send agreement" };

export default async function NewContractPage({ searchParams }: PageProps<"/admin/contracts/new">) {
  await requireAdmin();
  const { client } = await searchParams;
  const store = getStore();
  const [profiles, projects] = await Promise.all([store.listProfiles(), store.listProjects()]);
  const clients = profiles.filter((p) => p.role === "client");

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-bone-dim hover:text-bone">
        <ArrowLeft className="size-4" aria-hidden /> Studio admin
      </Link>
      <div>
        <p className="eyebrow">Agreements</p>
        <h1 className="display mt-3 text-4xl">Send an agreement for signature</h1>
        <p className="mt-3 text-sm leading-relaxed text-bone-dim">
          Upload the final PDF. The client reviews it in the portal, signs, and both of you get a countersigned copy with
          a certificate page recording the signature details and the document fingerprint.
        </p>
      </div>
      {clients.length === 0 ? (
        <p className="surface-empty p-8 text-center text-sm text-bone-dim">
          Invite a client first — agreements are sent to a client account.
        </p>
      ) : (
        <SendContractForm
          defaultClientId={typeof client === "string" ? client : undefined}
          clients={clients.map((c) => ({ id: c.id, label: `${c.fullName}${c.company ? ` — ${c.company}` : ""}` }))}
          projects={projects.map((p) => ({ id: p.id, clientId: p.clientId, name: p.name }))}
        />
      )}
    </div>
  );
}
