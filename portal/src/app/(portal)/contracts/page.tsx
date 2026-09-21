import type { Metadata } from "next";
import { ContractRow } from "@/components/contract-row";
import { PageHeader } from "@/components/page-header";
import { requireSession } from "@/lib/auth";
import { getStore } from "@/lib/store";

export const metadata: Metadata = { title: "Agreements" };

export default async function ContractsPage() {
  const profile = await requireSession();
  const store = getStore();
  const isAdmin = profile.role === "admin";
  const [contracts, projects, profiles] = await Promise.all([
    store.listContracts(isAdmin ? undefined : profile.id),
    store.listProjects(isAdmin ? undefined : profile.id),
    isAdmin ? store.listProfiles() : Promise.resolve([]),
  ]);
  const projectName = (id: string | null) => projects.find((p) => p.id === id)?.name ?? null;
  const clientName = (id: string) => profiles.find((p) => p.id === id)?.fullName;

  const awaiting = contracts.filter((c) => c.status === "awaiting_signature");
  const signed = contracts.filter((c) => c.status === "signed");
  const voided = contracts.filter((c) => c.status === "void");

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Agreements"
        title={awaiting.length ? `${awaiting.length} awaiting your signature` : "All signed and filed"}
        description="Every agreement is signed electronically here and stays available to download, with a certificate recording who signed, when, and from where."
      />

      {contracts.length === 0 && (
        <div className="surface-empty p-10 text-center">
          <p className="display text-2xl">No agreements yet</p>
          <p className="mt-2 text-sm text-bone-dim">When a proposal or statement of work is ready to sign, it will appear here.</p>
        </div>
      )}

      {awaiting.length > 0 && (
        <section className="space-y-4" aria-labelledby="awaiting">
          <h2 id="awaiting" className="eyebrow text-bone">
            Ready to sign
          </h2>
          <ul className="space-y-3">
            {awaiting.map((c) => (
              <ContractRow key={c.id} contract={c} projectName={projectName(c.projectId)} clientName={isAdmin ? clientName(c.clientId) : undefined} />
            ))}
          </ul>
        </section>
      )}

      {signed.length > 0 && (
        <section className="space-y-4" aria-labelledby="signed">
          <h2 id="signed" className="eyebrow text-bone">
            Signed
          </h2>
          <ul className="space-y-3">
            {signed.map((c) => (
              <ContractRow key={c.id} contract={c} projectName={projectName(c.projectId)} clientName={isAdmin ? clientName(c.clientId) : undefined} />
            ))}
          </ul>
        </section>
      )}

      {voided.length > 0 && (
        <section className="space-y-4" aria-labelledby="void">
          <h2 id="void" className="eyebrow text-bone">
            Withdrawn
          </h2>
          <ul className="space-y-3 opacity-70">
            {voided.map((c) => (
              <ContractRow key={c.id} contract={c} projectName={projectName(c.projectId)} clientName={isAdmin ? clientName(c.clientId) : undefined} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
