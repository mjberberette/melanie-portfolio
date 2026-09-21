import type { Profile, Role } from "@/lib/types";

/** The little a thread needs to know about someone: enough for a name and
 *  an avatar, nothing else from the profile. */
export interface Participant {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: Role;
}

export const participant = (p: Profile): Participant => ({ id: p.id, name: p.fullName || p.email, avatarUrl: p.avatarUrl, role: p.role });
