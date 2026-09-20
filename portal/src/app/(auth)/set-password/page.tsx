import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { afterPassword } from "@/lib/auth-links";
import { isDemoMode } from "@/lib/store";
import { PasswordForm } from "../password-form";

export const metadata: Metadata = { title: "Create your password" };
// Decide demo vs. Supabase per request, not at build time.
export const dynamic = "force-dynamic";

/** First stop after accepting an invitation: the invite link has already
 *  signed the client in, so this only needs the authenticated session. Also
 *  reachable by any signed-in client who wants to add a password later. */
export default async function SetPasswordPage({ searchParams }: PageProps<"/set-password">) {
  const { next: rawNext } = await searchParams;
  const next = afterPassword(rawNext);

  // Demo accounts sign in without passwords; there's nothing to set up.
  if (isDemoMode()) redirect(next);

  const profile = await getSession();
  if (!profile) redirect(`/login?next=${encodeURIComponent("/set-password")}`);

  const firstName = profile.fullName.trim().split(/\s+/)[0];

  return (
    <>
      <p className="eyebrow">Welcome</p>
      <h2 className="display mt-3 text-4xl">{firstName ? `Hi ${firstName}, create your password.` : "Create your password."}</h2>
      <p className="mt-3 text-sm leading-relaxed text-bone-dim">
        You&apos;re signed in as <span className="text-bone">{profile.email}</span>. Choose a password for next time — you
        can always ask for an emailed sign-in link instead.
      </p>
      <div className="mt-8">
        <PasswordForm next={next} submitLabel="Save and open the portal" />
      </div>
    </>
  );
}
