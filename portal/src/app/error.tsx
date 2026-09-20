"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Replaces Next's built-in "This page couldn't load" screen with one in the
 *  portal's voice that says what to do next and carries a reference for
 *  support. Rendered for any uncaught error below the root layout. */
export default function PortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-16">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="display mt-3 text-4xl text-balance">This page hit a snag</h1>
      <p className="mt-4 text-sm leading-relaxed text-bone-dim">
        The portal ran into an unexpected problem while loading this page. Trying again usually fixes it. If it keeps
        happening, email{" "}
        <a href="mailto:hello@melanieberberette.com" className="underline underline-offset-4 hover:text-bone">
          hello@melanieberberette.com
        </a>{" "}
        and mention the reference below.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-bone-faint">
          Reference <span className="select-all">{error.digest}</span>
        </p>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset}>
          <RotateCcw className="size-4" aria-hidden /> Try again
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          Back to the overview
        </Button>
      </div>
    </main>
  );
}
