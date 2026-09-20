import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requireSession } from "@/lib/auth";
import { getStore, isDemoMode } from "@/lib/store";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileSections } from "./profile-sections";

export const metadata: Metadata = { title: "Your profile" };

/** A new address the user asked for but hasn't confirmed yet (Supabase keeps
 *  it on the auth user until both confirmation links are opened). */
async function pendingEmail(): Promise<string | null> {
  if (isDemoMode()) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.new_email ?? null;
}

export default async function ProfilePage() {
  const profile = await requireSession("/profile");
  const store = getStore();
  const [website, pending] = await Promise.all([
    profile.role === "client" ? store.getWebsiteDetails(profile.id) : Promise.resolve(null),
    pendingEmail(),
  ]);

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Your profile"
        title="Keep your details current."
        description={
          profile.role === "client"
            ? "How I reach you, and everything I need to know about your website and where it lives. Your hosting login is only visible to you and the studio."
            : "Your name and picture as clients see them in the portal."
        }
      />
      <ProfileSections profile={profile} website={website} pendingEmail={pending} demo={isDemoMode()} self admin={profile.role === "admin"} />
    </div>
  );
}
