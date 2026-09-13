import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/store";
import { LoginForm } from "./login-form";

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
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="grain relative hidden flex-col justify-between overflow-hidden border-r border-border p-10 lg:flex">
        <div className="flex items-center gap-3">
          <span className="mark size-8 text-bone" aria-hidden />
          <span className="eyebrow text-bone">Client portal</span>
        </div>
        <div className="max-w-xl">
          <h1 className="display text-6xl xl:text-7xl">
            Everything about your project, <span className="text-vermilion">in one place.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-bone-dim">
            Review and sign agreements, follow each phase as it moves, and see exactly what I need from you next.
          </p>
        </div>
        <p className="text-xs text-bone-faint">
          Melanie Berberette · Web &amp; UX Design ·{" "}
          <a href="https://melanieberberette.design" className="underline-offset-4 hover:text-bone hover:underline">
            melanieberberette.design
          </a>
        </p>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -bottom-32 size-[34rem] rounded-full border border-border/60 [mask-image:radial-gradient(circle,black,transparent_70%)]"
        />
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="mark size-7 text-bone" aria-hidden />
            <span className="eyebrow text-bone">Client portal</span>
          </div>
          <p className="eyebrow">Sign in</p>
          <h2 className="display mt-3 text-4xl">Welcome back.</h2>
          <p className="mt-3 text-sm leading-relaxed text-bone-dim">
            Access is by invitation. Use the email address your invitation was sent to.
          </p>
          {linkError && (
            <p role="alert" className="mt-6 rounded-lg border border-vermilion/40 bg-vermilion/10 px-4 py-3 text-sm text-bone">
              {linkError}
            </p>
          )}
          <div className="mt-8">
            <LoginForm next={next} demoAccounts={demoAccounts} />
          </div>
        </div>
      </section>
    </main>
  );
}
