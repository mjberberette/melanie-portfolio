/** Shared limits for profile pictures — checked in the browser before upload
 *  and again on the server (by content, not just by declared type). */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export type AvatarType = (typeof AVATAR_TYPES)[number];

export function isAvatarType(type: string): type is AvatarType {
  return (AVATAR_TYPES as readonly string[]).includes(type);
}

/** Identifies the image by its first bytes so a renamed file can't slip through. */
export function sniffImageType(b: Uint8Array): AvatarType | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "image/gif";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    return "image/webp";
  }
  return null;
}
