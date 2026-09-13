import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { isDemoMode } from "@/lib/store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Lands magic-link and invitation emails, turns the code into a session,
 *  and sends the client on to where they were headed. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") ? rawNext : "/";

  if (isDemoMode()) return NextResponse.redirect(`${origin}/login`);

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
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("That sign-in link is invalid or has expired. Request a new one.")}`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
