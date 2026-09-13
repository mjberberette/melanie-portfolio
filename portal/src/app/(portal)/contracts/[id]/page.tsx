import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractStatusBadge } from "@/components/status-badge";
import { requireSession } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { getStore } from "@/lib/store";
import { SignPanel } from "./sign-panel";

export async function generateMetadata({ params }: PageProps<"/contracts/[id]">): Promise<Metadata> {
  const { id } = await params;
  const c = await getStore().getContract(id);
  return { title: c?.title ?? "Agreement" };
}

export default async function ContractPage({ params }: PageProps<"/contracts/[id]">) {
  const { id } = await params;
  const profile = await requireSession();
  const contract = await getStore().getContract(id);
  if (!contract || (profile.role !== "admin" && contract.clientId !== profile.id)) notFound();

  const isOwner = contract.clientId === profile.id;
  const canSign = isOwner && contract.status === "awaiting_signature";
  const pdfUrl = `/api/contracts/${contract.id}/pdf`;
  const signedUrl = `${pdfUrl}?signed=1`;

  return (
    <div className="space-y-10">
      <Link href="/contracts" className="inline-flex items-center gap-1.5 text-sm text-bone-dim hover:text-bone">
        <ArrowLeft className="size-4" aria-hidden /> Agreements
      </Link>

      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <ContractStatusBadge status={contract.status} />
            {contract.project && (
              <Link href={`/projects/${contract.project.id}`} className="eyebrow hover:text-bone">
                {contract.project.name}
              </Link>
            )}
            {profile.role === "admin" && <span className="eyebrow">{contract.client.fullName} · {contract.client.company}</span>}
          </div>
          <h1 className="display mt-4 text-4xl text-balance sm:text-5xl">{contract.title}</h1>
          {contract.description && <p className="mt-4 text-base leading-relaxed text-bone-dim">{contract.description}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button nativeButton={false} render={<a href={pdfUrl} target="_blank" rel="noreferrer" />} variant="outline">
            <ExternalLink className="size-4" aria-hidden /> Open PDF
          </Button>
          <Button
            nativeButton={false} render={<a href={`${contract.status === "signed" ? signedUrl + "&" : pdfUrl + "?"}download=1`} />}
            variant={contract.status === "signed" ? "default" : "outline"}
          >
            <Download className="size-4" aria-hidden /> Download {contract.status === "signed" ? "signed copy" : "PDF"}
          </Button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <section aria-label="Agreement document" className="overflow-hidden rounded-2xl border border-border bg-[#1a1a1f]">
          <iframe
            src={`${contract.status === "signed" ? signedUrl : pdfUrl}#toolbar=0&view=FitH`}
            title={`${contract.title} document`}
            className="block h-[70vh] w-full bg-[#1a1a1f] lg:h-[80vh]"
          />
        </section>

        <div className="space-y-6 lg:sticky lg:top-8">
          {canSign && <SignPanel contractId={contract.id} defaultName={profile.fullName} />}

          {contract.status === "awaiting_signature" && !isOwner && (
            <div className="rounded-2xl border border-border bg-card p-5 text-sm text-bone-dim">
              Sent {formatDate(contract.sentAt)} to {contract.client.fullName} ({contract.client.email}). Waiting for their signature.
            </div>
          )}

          {contract.status === "signed" && (
            <section className="rounded-2xl border border-success/30 bg-card p-5 sm:p-6" aria-labelledby="cert">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-success" aria-hidden />
                <h2 id="cert" className="eyebrow text-bone">
                  Signature certificate
                </h2>
              </div>
              <dl className="mt-4 divide-y divide-border text-sm">
                {[
                  ["Signed by", contract.signerName],
                  ["Email", contract.signerEmail],
                  ["Signed at", formatDateTime(contract.signedAt)],
                  ["IP address", contract.signerIp ?? "Not recorded"],
                  ["Reference", contract.id],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-3 py-2.5">
                    <dt className="text-bone-faint">{k}</dt>
                    <dd className="min-w-0 break-all">{v}</dd>
                  </div>
                ))}
                <div className="py-2.5">
                  <dt className="text-bone-faint">Document fingerprint (SHA-256)</dt>
                  <dd className="mt-1 font-mono text-[0.6875rem] leading-relaxed break-all text-bone-dim">{contract.documentSha256}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-bone-faint">
                The fingerprint identifies the exact document that was signed. The downloadable signed copy includes this
                certificate as its final page.
              </p>
            </section>
          )}

          {contract.status === "void" && (
            <div className="rounded-2xl border border-border bg-card p-5 text-sm text-bone-dim">
              This agreement was withdrawn before it was signed and is kept for reference only.
            </div>
          )}

          <div className="rounded-2xl border border-border p-5 text-xs leading-relaxed text-bone-faint">
            <p className="eyebrow mb-2">Details</p>
            <p>Sent {formatDateTime(contract.sentAt)}.</p>
            <p className="mt-1">Prefer to read on paper? Open the PDF and print it; you can still sign here afterwards.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
