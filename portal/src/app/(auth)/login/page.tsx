import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/store";
import { HashSession } from "./hash-session";
import { LoginForm } from "./login-form";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next: rawNext, error } = await searchParams;
  const next = typeof rawNext === "string" && rawNext.startsWith("/") ? rawNext : "/";
  const linkError = typeof error === "string" ? error : null;

  if (await getSession()) redirect(next);

  const demoAccounts = isDemoMode()
    ? [
        { email: "jordan@everypeer.com", label: "Jordan Ellis — EveryPeer", hint: "Client · two projects, one agreement to sign" },
        { email: "hello@melanieberberette.com", label: "Melanie Berberette", hint: "Admin · manage clients, projects, agreements" },
      ]
    : null;

  return (
    <>
      <p className="eyebrow">Sign in</p>
      <h2 className="display mt-3 text-4xl">Welcome back.</h2>
      <p className="mt-3 text-sm leading-relaxed text-bone-dim">
        Access is by invitation. Use the email address your invitation was sent to.
      </p>
      {!demoAccounts && <HashSession url={supabaseUrl()!} anonKey={supabaseAnonKey()!} next={next} />}
      {linkError && (
        <p role="alert" className="mt-6 rounded-lg border border-vermilion/40 bg-vermilion/10 px-4 py-3 text-sm text-bone">
          {linkError}
        </p>
      )}
      <div className="mt-8">
        <LoginForm next={next} demoAccounts={demoAccounts} />
      </div>
    </>
  );
}
