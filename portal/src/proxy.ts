import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

/** Keeps the Supabase session cookie fresh on every request so server
 *  components always see a valid user. A no-op in demo mode. */
export async function proxy(request: NextRequest) {
  const url = supabaseUrl();
  const anon = supabaseAnonKey();
  if (!url || !anon) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|fonts/|logo/|.*\\.(?:svg|png|jpg|woff2)$).*)"],
};
