import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { REQUEST_PATH_HEADER } from "@/lib/auth-links";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

/** Records the requested path + query on the request (always overwriting
 *  anything the client sent) so requireSession can send signed-out visitors
 *  back to it after login, then keeps the Supabase session cookie fresh so
 *  server components always see a valid user. The refresh is skipped in
 *  demo mode. */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const forward = () => {
    const headers = new Headers(request.headers);
    headers.set(REQUEST_PATH_HEADER, `${pathname}${search}`);
    return NextResponse.next({ request: { headers } });
  };

  const url = supabaseUrl();
  const anon = supabaseAnonKey();
  if (!url || !anon) return forward();

  let response = forward();
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = forward();
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
