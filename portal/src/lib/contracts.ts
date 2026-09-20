/** Shared rules for agreement PDFs — checked in the browser before the upload
 *  starts and again on the server against the stored bytes. */
export const CONTRACT_PDF_MAX_BYTES = 20 * 1024 * 1024;
export const CONTRACT_PDF_MAX_LABEL = "20 MB";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuid = (s: string): boolean => UUID.test(s);

/** True when the bytes start with the `%PDF-` file signature. */
export function looksLikePdf(head: Uint8Array): boolean {
  return head.length >= 5 && String.fromCharCode(...head.slice(0, 5)) === "%PDF-";
}

export function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

/** Turns a failed storage upload (HTTP status + response body) into a message
 *  the admin can act on. Works for Supabase Storage's JSON errors and for the
 *  demo-mode upload route. */
export function describeUploadFailure(status: number, body: string): string {
  let detail = "";
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string };
    detail = parsed.message ?? parsed.error ?? "";
  } catch {
    detail = body.slice(0, 200);
  }
  const lower = detail.toLowerCase();
  if (status === 413 || lower.includes("exceeded the maximum") || lower.includes("too large")) {
    return `The storage service rejected the file as too large. PDFs need to be under ${CONTRACT_PDF_MAX_LABEL}; try compressing it (e.g. "Reduce File Size" in Preview or Acrobat).`;
  }
  if (status === 415 || lower.includes("mime type")) return "Only PDF files are supported.";
  if (status === 409 || lower.includes("already exists")) return "That upload already finished. Submit the form again to send the agreement.";
  if (status === 401 || status === 403 || lower.includes("jwt") || lower.includes("expired") || lower.includes("token")) {
    return "The upload link expired before the file finished. Try sending again.";
  }
  if (status === 0) return "The upload was interrupted. Check your connection and try again.";
  return `The PDF couldn't be uploaded (${status}${detail ? `: ${detail}` : ""}). Try again.`;
}
