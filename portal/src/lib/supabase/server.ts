import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Cookie-backed Supabase client for the signed-in user (anon key + session).
 *  Used only for auth: data access goes through the store on the server. */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies are read-only there, and
          // proxy.ts refreshes the session on the next request instead.
        }
      },
    },
  });
}
