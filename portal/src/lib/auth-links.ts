/** Helpers shared by the email-link landing code (server route, browser hash
 *  handler) and the sign-in actions. Kept free of server-only imports so the
 *  client bundle can use them too. */

/** Only same-origin paths are allowed as post-sign-in destinations. */
export function safeNext(value: unknown): string {
  const next = String(value ?? "/");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

const PASSWORD_PAGES = ["/set-password", "/reset-password"];

/** Where to go once a password has been saved: the requested page, unless
 *  that is itself one of the password pages (which would loop). */
export function afterPassword(next: unknown): string {
  const safe = safeNext(next);
  return PASSWORD_PAGES.some((p) => safe === p || safe.startsWith(`${p}?`)) ? "/" : safe;
}

/** Where a freshly verified email link should land. Invitations go on to
 *  create a password; recovery links go on to choose a new one. */
export function destinationFor(type: string | null, next: string): string {
  if (type === "recovery") return "/reset-password";
  if (type === "invite") {
    const after = afterPassword(next);
    return after === "/" ? "/set-password" : `/set-password?next=${encodeURIComponent(after)}`;
  }
  return safeNext(next);
}
