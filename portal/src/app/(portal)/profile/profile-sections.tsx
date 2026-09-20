import type { Profile, WebsiteDetails } from "@/lib/types";
import { AvatarUploader, EmailForm, ProfileDetailsForm, WebsiteForm } from "./forms";

/** The editable profile, laid out the same way for a client editing
 *  themselves and for an admin editing a client from the studio area. */
export function ProfileSections({
  profile,
  website,
  pendingEmail,
  demo,
  self,
  admin,
}: {
  profile: Profile;
  website: WebsiteDetails | null;
  pendingEmail: string | null;
  demo: boolean;
  /** Signed-in user is editing their own account. */
  self: boolean;
  /** Signed-in user is an admin (unlocks the company field). */
  admin: boolean;
}) {
  const you = self ? "Your" : "Their";
  return (
    <div className="space-y-12">
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-start">
        <section className="space-y-4" aria-labelledby="picture">
          <h2 id="picture" className="eyebrow text-bone">
            Picture
          </h2>
          <AvatarUploader profile={profile} />
        </section>
        <section className="space-y-4" aria-labelledby="details">
          <h2 id="details" className="eyebrow text-bone">
            {you} details
          </h2>
          <ProfileDetailsForm profile={profile} admin={admin} />
        </section>
      </div>

      <section className="space-y-4" aria-labelledby="email">
        <h2 id="email" className="eyebrow text-bone">
          Sign-in email
        </h2>
        <EmailForm profile={profile} pendingEmail={pendingEmail} demo={demo} self={self} />
      </section>

      {profile.role === "client" && (
        <section className="space-y-4" aria-labelledby="website">
          <h2 id="website" className="eyebrow text-bone">
            {you} website
          </h2>
          <WebsiteForm profileId={profile.id} details={website} />
        </section>
      )}
    </div>
  );
}
