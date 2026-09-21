const DAY = 86_400_000;

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  if (!iso) return "—";
  // Date-only strings are treated as local dates so they don't shift a day.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return d.toLocaleDateString("en-US", opts);
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** Local calendar day, as a key for grouping messages. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "Today", "Yesterday", "Tue, Sep 15", or with the year when it differs. */
export function formatDayLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const key = dayKey(iso);
  if (key === dayKey(now.toISOString())) return "Today";
  if (key === dayKey(new Date(now.getTime() - DAY).toISOString())) return "Yesterday";
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
}

/** Compact "when" for inbox rows: time today, weekday this week, else a date. */
export function formatRecent(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const age = now.getTime() - d.getTime();
  if (dayKey(iso) === dayKey(now.toISOString())) return formatTime(iso);
  if (age < 6 * DAY) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(d.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }) });
}

export function relativeDays(iso: string | null | undefined): string {
  if (!iso) return "";
  const target = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  const diff = Math.round((target.getTime() - Date.now()) / DAY);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff > 0) return `in ${diff} days`;
  return `${-diff} days ago`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/** First whitespace-separated token of a name, or null when there isn't one. */
export function firstNameOf(name: string | null | undefined): string | null {
  return name?.trim().split(/\s+/)[0] || null;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Splits a display name into first and last parts (everything after the
 *  first word is the last name, so "Mary Anne Lee" → "Mary" / "Anne Lee"). */
export function splitName(fullName: string | null | undefined): { firstName: string; lastName: string } {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export function joinName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}
