import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { destinationFor, loginUrl, safeNext } from "@/lib/auth-links";
import { isDemoMode } from "@/lib/store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Lands magic-link, invitation, and password-recovery emails, turns the
 *  code into a session, and sends the client on: invitations continue to
 *  /set-password, recovery links to /reset-password, everything else to
 *  wherever they were headed. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));

  if (isDemoMode()) return NextResponse.redirect(`${origin}${loginUrl(next)}`);

  const supabase = await createSupabaseServerClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Missing sign-in code") };

  if (error) {
    // Links built from Supabase's default templates carry the session in the
    // URL fragment, which never reaches the server; browsers keep it across
    // this redirect and the login page finishes the sign-in. `next` rides
    // along so that flow still lands where the link intended.
    const params = new URLSearchParams({ error: "That sign-in link is invalid or has expired. Request a new one." });
    if (next !== "/") params.set("next", next);
    return NextResponse.redirect(`${origin}/login?${params}`);
  }
  return NextResponse.redirect(`${origin}${destinationFor(type, next)}`);
}
