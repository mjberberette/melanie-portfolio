/** Helpers shared by the email-link landing code (server route, browser hash
 *  handler) and the sign-in actions. Kept free of server-only imports so the
 *  client bundle can use them too. */

/** Request header the proxy sets to the path + query the client asked for,
 *  so server components (which can't see the URL) can send them back there
 *  after signing in. */
export const REQUEST_PATH_HEADER = "x-portal-path";

/** Only same-origin paths are allowed as post-sign-in destinations: a single
 *  leading slash, and not the protocol-relative `//host` or `/\host` forms
 *  browsers treat as another origin. */
export function safeNext(value: unknown): string {
  const next = String(value ?? "/");
  return /^\/(?![/\\])/.test(next) ? next : "/";
}

/** The sign-in page, remembering where the client was headed. */
export function loginUrl(next: unknown): string {
  const safe = safeNext(next);
  return safe === "/" ? "/login" : `/login?next=${encodeURIComponent(safe)}`;
}

const PASSWORD_PAGES = ["/set-password", "/reset-password"];

/** Where to go once a password has been saved: the requested page, unless
 *  that is itself one of the password pages (which would loop). */
export function afterPassword(next: unknown): string {
  const safe = safeNext(next);
  return PASSWORD_PAGES.some((p) => safe === p || safe.startsWith(`${p}?`)) ? "/" : safe;
}

/** The create-password page, remembering where to go once it's saved. */
export function setPasswordUrl(next: unknown): string {
  const after = afterPassword(next);
  return after === "/" ? "/set-password" : `/set-password?next=${encodeURIComponent(after)}`;
}

/** Where a freshly verified email link should land. Invitations go on to
 *  create a password; recovery links go on to choose a new one. */
export function destinationFor(type: string | null, next: string): string {
  if (type === "recovery") return "/reset-password";
  if (type === "invite") return setPasswordUrl(next);
  return safeNext(next);
}
