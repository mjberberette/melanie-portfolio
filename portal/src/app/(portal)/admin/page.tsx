import type { Metadata } from "next";
import Link from "next/link";
import { FilePlus2, FolderPlus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { ContractStatusBadge, ProjectStatusBadge } from "@/components/status-badge";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getStore, isDemoMode } from "@/lib/store";
import { PHASE_LABELS } from "@/lib/types";
import { voidContract } from "./actions";

export const metadata: Metadata = { title: "Studio admin" };

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const { invited } = await searchParams;
  const store = getStore();
  const [profiles, projects, contracts] = await Promise.all([store.listProfiles(), store.listProjects(), store.listContracts()]);
  const clients = profiles.filter((p) => p.role === "client");
  const name = (id: string) => profiles.find((p) => p.id === id)?.fullName ?? "—";

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Studio admin"
        title="Run the studio."
        description="Invite clients, keep each project's phase and next step current, and send agreements for signature."
        actions={
          <>
            <Button nativeButton={false} render={<Link href="/admin/clients/new" />} variant="outline">
              <UserPlus className="size-4" aria-hidden /> Invite client
            </Button>
            <Button nativeButton={false} render={<Link href="/admin/projects/new" />} variant="outline">
              <FolderPlus className="size-4" aria-hidden /> New project
            </Button>
            <Button nativeButton={false} render={<Link href="/admin/contracts/new" />}>
              <FilePlus2 className="size-4" aria-hidden /> Send agreement
            </Button>
          </>
        }
      />

      {invited === "1" && (
        <p role="status" className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm">
          Client invited.{" "}
          {isDemoMode()
            ? "In demo mode no email is sent — they can sign in with their address from the login page."
            : "They'll receive an email with a link that signs them in and lands them on their overview."}
        </p>
      )}

      <section className="space-y-4" aria-labelledby="clients">
        <h2 id="clients" className="eyebrow text-bone">
          Clients · {clients.length}
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Projects</TableHead>
                <TableHead className="text-right">Since</TableHead>
                <TableHead className="text-right"><span className="sr-only">Manage</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-bone-dim">
                    No clients yet — invite your first one.
                  </TableCell>
                </TableRow>
              )}
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/clients/${c.id}`} className="underline-offset-4 hover:underline">
                      {c.fullName || "—"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-bone-dim">{c.company ?? "—"}</TableCell>
                  <TableCell className="text-bone-dim">{c.email}</TableCell>
                  <TableCell className="text-right">{projects.filter((p) => p.clientId === c.id).length}</TableCell>
                  <TableCell className="text-right text-bone-dim">{formatDate(c.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/clients/${c.id}`} className="text-sm underline-offset-4 hover:underline">
                      Manage
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="projects">
        <h2 id="projects" className="eyebrow text-bone">
          Projects · {projects.length}
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Target launch</TableHead>
                <TableHead className="text-right"><span className="sr-only">Manage</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-bone-dim">
                    No projects yet.
                  </TableCell>
                </TableRow>
              )}
              {projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-bone-dim">{name(p.clientId)}</TableCell>
                  <TableCell className="text-bone-dim">{PHASE_LABELS[p.phase]}</TableCell>
                  <TableCell>
                    <ProjectStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-right text-bone-dim">{formatDate(p.targetLaunch)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/projects/${p.id}`} className="text-sm underline-offset-4 hover:underline">
                      Manage
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="agreements">
        <h2 id="agreements" className="eyebrow text-bone">
          Agreements · {contracts.length}
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Signed</TableHead>
                <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-bone-dim">
                    Nothing sent yet.
                  </TableCell>
                </TableRow>
              )}
              {contracts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link href={`/contracts/${c.id}`} className="underline-offset-4 hover:underline">
                      {c.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-bone-dim">{name(c.clientId)}</TableCell>
                  <TableCell>
                    <ContractStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-right text-bone-dim">{formatDate(c.sentAt)}</TableCell>
                  <TableCell className="text-right text-bone-dim">{formatDate(c.signedAt)}</TableCell>
                  <TableCell className="text-right">
                    {c.status === "awaiting_signature" && (
                      <form action={voidContract}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="text-sm text-bone-dim underline-offset-4 hover:text-bone hover:underline">
                          Withdraw
                        </button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
