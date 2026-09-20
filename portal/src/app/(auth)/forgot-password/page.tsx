import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/store";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = { title: "Forgot password" };
// Decide demo vs. Supabase per request, not at build time.
export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  // Demo accounts have no passwords; the login page signs them straight in.
  if (isDemoMode()) redirect("/login");
  if (await getSession()) redirect("/");

  const { email } = await searchParams;

  return (
    <>
      <p className="eyebrow">Forgot password</p>
      <h2 className="display mt-3 text-4xl">Let&apos;s get you back in.</h2>
      <p className="mt-3 text-sm leading-relaxed text-bone-dim">
        Enter the email address your invitation was sent to and we&apos;ll send a link to set a new password.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm email={typeof email === "string" ? email : ""} />
      </div>
    </>
  );
}
