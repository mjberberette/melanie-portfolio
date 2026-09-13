import Link from "next/link";
import { ArrowRight, FileText, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import type { Contract } from "@/lib/types";

export function ContractRow({ contract, clientName, projectName }: { contract: Contract; clientName?: string; projectName?: string | null }) {
  const awaiting = contract.status === "awaiting_signature";
  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-ink text-bone-dim">
          <FileText className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{contract.title}</h3>
            <ContractStatusBadge status={contract.status} />
          </div>
          <p className="mt-1 text-xs text-bone-faint">
            {[clientName, projectName].filter(Boolean).join(" · ")}
            {(clientName || projectName) && " · "}
            {contract.status === "signed" ? `Signed ${formatDate(contract.signedAt)}` : `Sent ${formatDate(contract.sentAt)}`}
          </p>
          {contract.description && <p className="mt-2 line-clamp-2 text-sm text-bone-dim">{contract.description}</p>}
        </div>
      </div>
      <Button nativeButton={false} render={<Link href={`/contracts/${contract.id}`} />} variant={awaiting ? "default" : "outline"} className="shrink-0">
        {awaiting ? (
          <>
            Review &amp; sign <PenLine className="size-4" aria-hidden />
          </>
        ) : (
          <>
            View <ArrowRight className="size-4" aria-hidden />
          </>
        )}
      </Button>
    </li>
  );
}
