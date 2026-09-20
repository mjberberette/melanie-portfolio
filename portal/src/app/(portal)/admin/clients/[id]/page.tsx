import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProfileSections } from "@/app/(portal)/profile/profile-sections";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getStore, isDemoMode } from "@/lib/store";

export async function generateMetadata({ params }: PageProps<"/admin/clients/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = await getStore().getProfile(id);
  return { title: p ? `Client · ${p.fullName || p.email}` : "Client" };
}

export default async function ManageClientPage({ params }: PageProps<"/admin/clients/[id]">) {
  const me = await requireAdmin();
  const { id } = await params;
  const store = getStore();
  const client = await store.getProfile(id);
  if (!client) notFound();
  const website = client.role === "client" ? await store.getWebsiteDetails(client.id) : null;

  return (
    <div className="space-y-10">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-bone-dim hover:text-bone">
        <ArrowLeft className="size-4" aria-hidden /> Studio admin
      </Link>

      <header>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex h-5 items-center rounded-4xl border border-border px-2 font-mono text-[0.625rem] tracking-[0.12em] uppercase">
            {client.role === "admin" ? "Admin" : "Client"}
          </span>
          <span className="eyebrow">
            {client.company ? `${client.company} · ` : ""}
            {client.email} · since {formatDate(client.createdAt)}
          </span>
        </div>
        <h1 className="display mt-4 text-4xl sm:text-5xl">{client.fullName || client.email}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-bone-dim">
          Everything the client can edit on their own profile page, editable here too. Hosting credentials are shown because you&apos;re signed in as
          admin — treat them accordingly.
        </p>
      </header>

      <ProfileSections profile={client} website={website} pendingEmail={null} demo={isDemoMode()} self={client.id === me.id} admin />
    </div>
  );
}
