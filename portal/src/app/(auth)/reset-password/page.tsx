import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/store";
import { PasswordForm } from "../password-form";

export const metadata: Metadata = { title: "Reset your password" };
// Decide demo vs. Supabase per request, not at build time.
export const dynamic = "force-dynamic";

/** Landing page for the password-recovery email. The link signs the client
 *  in for one session; this lets them choose a new password before going on. */
export default async function ResetPasswordPage() {
  if (isDemoMode()) redirect("/login");

  const profile = await getSession();

  if (!profile) {
    return (
      <>
        <p className="eyebrow">Reset password</p>
        <h2 className="display mt-3 text-4xl">That link has expired.</h2>
        <p className="mt-3 text-sm leading-relaxed text-bone-dim">
          Password reset links work once and expire after an hour. Request a fresh one and open it on this device.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link href="/forgot-password" className="text-bone underline underline-offset-4 hover:text-vermilion-soft">
            Request a new link
          </Link>
          <Link href="/login" className="text-bone-dim underline-offset-4 hover:text-bone hover:underline">
            Back to sign in
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="eyebrow">Reset password</p>
      <h2 className="display mt-3 text-4xl">Choose a new password.</h2>
      <p className="mt-3 text-sm leading-relaxed text-bone-dim">
        For <span className="text-bone">{profile.email}</span>. You&apos;ll stay signed in on this device once it&apos;s saved.
      </p>
      <div className="mt-8">
        <PasswordForm next="/" submitLabel="Save new password" />
      </div>
    </>
  );
}
