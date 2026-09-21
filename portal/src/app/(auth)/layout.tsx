import { AuthGlow } from "@/components/auth-glow";

/** Two-column shell shared by the sign-in, set-password, and reset-password
 *  pages: the pitch on the left, the form on the right, and an animated
 *  chevron-and-glow backdrop rising along the bottom of both. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative isolate grid min-h-screen overflow-hidden lg:grid-cols-[1.1fr_1fr]">
      <AuthGlow />
      <section className="grain relative hidden flex-col justify-between overflow-hidden p-10 after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-gradient-to-b after:from-border after:via-border after:to-transparent lg:flex">
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
        <p className="text-xs text-bone-dim">
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
          {children}
        </div>
      </section>
    </main>
  );
}
