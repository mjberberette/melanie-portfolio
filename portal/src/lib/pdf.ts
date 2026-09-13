import { createHash } from "node:crypto";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

const INK = rgb(0.06, 0.06, 0.07);
const DIM = rgb(0.45, 0.44, 0.42);
const VERMILION = rgb(1, 0.29, 0.11);
const RULE = rgb(0.85, 0.84, 0.82);

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const probe = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(probe, size) > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = probe;
      }
    }
    lines.push(line);
  }
  return lines;
}

export interface SignatureStamp {
  contractId: string;
  contractTitle: string;
  signerName: string;
  signerEmail: string;
  signedAt: Date;
  ip: string | null;
  userAgent: string | null;
  documentSha256: string;
  /** PNG data URL from the signature pad; null when the client typed their name. */
  signatureImage: string | null;
}

/** Appends a signature certificate page and stamps the signature block onto
 *  the final page of the agreement. Returns the new PDF bytes. */
export async function stampSignature(original: Uint8Array, s: SignatureStamp): Promise<Uint8Array> {
  const doc = await PDFDocument.load(original, { ignoreEncryption: true });
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const script = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const signaturePng = s.signatureImage
    ? await doc.embedPng(Buffer.from(s.signatureImage.split(",")[1] ?? "", "base64"))
    : null;

  const when = s.signedAt.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");

  /* Signature block on the last page of the agreement */
  const last = doc.getPage(doc.getPageCount() - 1);
  const { width } = last.getSize();
  const blockH = 92;
  const margin = 56;
  const y = 40;
  last.drawRectangle({ x: margin, y, width: width - margin * 2, height: blockH, borderColor: RULE, borderWidth: 1 });
  last.drawText("ELECTRONICALLY SIGNED", { x: margin + 14, y: y + blockH - 20, size: 7.5, font: bold, color: VERMILION });
  if (signaturePng) {
    const h = 44;
    const w = Math.min(200, (signaturePng.width / signaturePng.height) * h);
    last.drawImage(signaturePng, { x: margin + 14, y: y + 14, width: w, height: h });
  } else {
    last.drawText(s.signerName, { x: margin + 14, y: y + 28, size: 24, font: script, color: INK });
  }
  const metaX = width / 2 + 10;
  last.drawText(s.signerName, { x: metaX, y: y + blockH - 38, size: 10, font: bold, color: INK });
  last.drawText(s.signerEmail, { x: metaX, y: y + blockH - 52, size: 8.5, font: sans, color: DIM });
  last.drawText(when, { x: metaX, y: y + blockH - 66, size: 8.5, font: sans, color: DIM });
  last.drawText(`Ref ${s.contractId}`, { x: metaX, y: y + blockH - 80, size: 7.5, font: sans, color: DIM });

  /* Certificate page */
  const page = doc.addPage([612, 792]);
  let cy = 792 - 72;
  const x = 64;
  const contentW = 612 - x * 2;

  page.drawText("SIGNATURE CERTIFICATE", { x, y: cy, size: 8, font: bold, color: VERMILION });
  cy -= 30;
  for (const ln of wrap(s.contractTitle, bold, 22, contentW)) {
    page.drawText(ln, { x, y: cy, size: 22, font: bold, color: INK });
    cy -= 26;
  }
  cy += 8;
  page.drawText("Melanie Berberette — Client Portal · portal.melanieberberette.design", { x, y: cy, size: 9, font: sans, color: DIM });
  cy -= 28;
  page.drawLine({ start: { x, y: cy }, end: { x: 612 - x, y: cy }, thickness: 1, color: RULE });
  cy -= 30;

  const row = (label: string, value: string) => {
    page.drawText(label.toUpperCase(), { x, y: cy, size: 7.5, font: bold, color: DIM });
    const lines = wrap(value, sans, 10, contentW - 150);
    lines.forEach((ln, i) => page.drawText(ln, { x: x + 150, y: cy - i * 13, size: 10, font: sans, color: INK }));
    cy -= Math.max(1, lines.length) * 13 + 12;
  };

  row("Signed by", s.signerName);
  row("Email", s.signerEmail);
  row("Signed at", when);
  row("IP address", s.ip ?? "Not recorded");
  row("Device", s.userAgent ?? "Not recorded");
  row("Reference", s.contractId);
  row("Document SHA-256", s.documentSha256);

  cy -= 10;
  page.drawText("SIGNATURE", { x, y: cy, size: 7.5, font: bold, color: DIM });
  cy -= 8;
  if (signaturePng) {
    const h = 70;
    const w = Math.min(300, (signaturePng.width / signaturePng.height) * h);
    page.drawImage(signaturePng, { x, y: cy - h, width: w, height: h });
    cy -= h + 10;
  } else {
    cy -= 34;
    page.drawText(s.signerName, { x, y: cy, size: 32, font: script, color: INK });
    cy -= 14;
    page.drawText("Typed signature — adopted by the signer as their legal mark", { x, y: cy, size: 8, font: sans, color: DIM });
    cy -= 10;
  }
  page.drawLine({ start: { x, y: cy }, end: { x: x + 300, y: cy }, thickness: 1, color: INK });
  cy -= 34;

  const legal =
    "By signing, the signer agreed to conduct this transaction electronically and adopted the signature above as the legal equivalent of a handwritten signature, in accordance with the U.S. ESIGN Act and UETA. The SHA-256 fingerprint above identifies the exact document that was presented and signed; any alteration to the agreement would change this value.";
  wrap(legal, sans, 8.5, contentW).forEach((ln) => {
    page.drawText(ln, { x, y: cy, size: 8.5, font: sans, color: DIM });
    cy -= 12;
  });

  doc.setModificationDate(s.signedAt);
  return doc.save();
}

/** Builds a simple, real-looking agreement PDF. Used to seed demo mode. */
export async function buildAgreementPdf(input: {
  title: string;
  clientName: string;
  company: string;
  effectiveDate: string;
  sections: { heading: string; body: string }[];
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const x = 64;
  const contentW = 612 - x * 2;
  let page: PDFPage = doc.addPage([612, 792]);
  let cy = 792 - 72;

  const ensure = (needed: number) => {
    if (cy - needed < 80) {
      page = doc.addPage([612, 792]);
      cy = 792 - 72;
    }
  };

  page.drawText("AGREEMENT", { x, y: cy, size: 8, font: bold, color: VERMILION });
  cy -= 30;
  for (const ln of wrap(input.title, bold, 24, contentW)) {
    page.drawText(ln, { x, y: cy, size: 24, font: bold, color: INK });
    cy -= 28;
  }
  cy += 6;
  page.drawText(`Between Melanie Berberette Design and ${input.company} (“Client”), effective ${input.effectiveDate}.`, {
    x, y: cy, size: 10, font: sans, color: DIM,
  });
  cy -= 14;
  page.drawText(`Client representative: ${input.clientName}`, { x, y: cy, size: 10, font: sans, color: DIM });
  cy -= 26;
  page.drawLine({ start: { x, y: cy }, end: { x: 612 - x, y: cy }, thickness: 1, color: RULE });
  cy -= 28;

  input.sections.forEach((sec, i) => {
    ensure(60);
    page.drawText(`${i + 1}. ${sec.heading}`, { x, y: cy, size: 12, font: bold, color: INK });
    cy -= 18;
    for (const ln of wrap(sec.body, sans, 10, contentW)) {
      ensure(14);
      page.drawText(ln, { x, y: cy, size: 10, font: sans, color: INK });
      cy -= 14;
    }
    cy -= 14;
  });

  ensure(160);
  return doc.save();
}
