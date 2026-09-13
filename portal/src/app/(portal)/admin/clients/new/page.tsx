import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { isDemoMode } from "@/lib/store";
import { InviteClientForm } from "./invite-form";

export const metadata: Metadata = { title: "Invite client" };

export default async function NewClientPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-xl space-y-8">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-bone-dim hover:text-bone">
        <ArrowLeft className="size-4" aria-hidden /> Studio admin
      </Link>
      <div>
        <p className="eyebrow">Clients</p>
        <h1 className="display mt-3 text-4xl">Invite a client</h1>
        <p className="mt-3 text-sm leading-relaxed text-bone-dim">
          {isDemoMode()
            ? "Creates the account immediately. In demo mode they sign in from the login page with this email."
            : "Sends an invitation email with a one-time link. The link signs them in — no password to set up."}
        </p>
      </div>
      <InviteClientForm />
    </div>
  );
}
