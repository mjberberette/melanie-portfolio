import { MESSAGE_MAX_LENGTH } from "@/lib/types";

/** Messages are plain text. Bodies are stored exactly as typed apart from
 *  normalising line endings, dropping control characters, and trimming, and
 *  are rendered as text nodes — never as HTML — with line breaks preserved
 *  and bare http(s) URLs turned into links. */
export function normaliseMessageBody(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    // Everything in C0 except tab and newline, plus DEL and C1.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function messageBodyProblem(body: string): string | null {
  if (body.length === 0) return "Write a message first.";
  if (body.length > MESSAGE_MAX_LENGTH) return `Messages need to be under ${MESSAGE_MAX_LENGTH.toLocaleString("en-US")} characters.`;
  return null;
}

export type MessageSegment = { type: "text"; value: string } | { type: "link"; href: string; label: string } | { type: "break" };

const URL_RE = /\bhttps?:\/\/[^\s<>"'`]+/gi;

const PAIRS: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
const count = (s: string, ch: string) => s.split(ch).length - 1;

/** Trailing punctuation is almost always the sentence's, not the URL's; a
 *  closing bracket only belongs to the URL when it has a matching opener. */
function trimUrl(url: string): string {
  let end = url.length;
  for (;;) {
    const ch = url[end - 1];
    if (!ch) break;
    if (/[.,;:!?'"]/.test(ch)) {
      end--;
    } else if (ch in PAIRS) {
      const slice = url.slice(0, end);
      if (count(slice, ch) <= count(slice, PAIRS[ch]!)) break;
      end--;
    } else {
      break;
    }
  }
  return url.slice(0, end);
}

function isSafeHref(href: string): boolean {
  try {
    const u = new URL(href);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Splits a body into text, link, and line-break segments for rendering. */
export function segmentMessageBody(body: string): MessageSegment[] {
  const out: MessageSegment[] = [];
  const lines = body.split("\n");
  lines.forEach((line, i) => {
    let last = 0;
    for (const match of line.matchAll(URL_RE)) {
      const start = match.index;
      const url = trimUrl(match[0]);
      if (!url || !isSafeHref(url)) continue;
      if (start > last) out.push({ type: "text", value: line.slice(last, start) });
      out.push({ type: "link", href: url, label: url });
      last = start + url.length;
    }
    if (last < line.length) out.push({ type: "text", value: line.slice(last) });
    if (i < lines.length - 1) out.push({ type: "break" });
  });
  return out;
}

/** One-line teaser for inbox rows and notification emails. */
export function messagePreview(body: string, max = 90): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}
