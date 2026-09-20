import { type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { CONTRACT_PDF_MAX_BYTES, CONTRACT_PDF_MAX_LABEL, isUuid, looksLikePdf } from "@/lib/contracts";
import { getStore } from "@/lib/store";

/** Receives an agreement PDF for a store without external storage (demo
 *  mode). In production the browser uploads straight to Supabase Storage via
 *  a signed URL instead, so this route never sees multi-megabyte bodies on
 *  Vercel. Admin only; `id` is the upload ticket from createContractUpload. */
export async function PUT(request: NextRequest, { params }: RouteContext<"/api/contracts/upload/[id]">) {
  const { id } = await params;
  const profile = await getSession();
  if (!profile) return json(401, "Unauthorized");
  if (profile.role !== "admin") return json(403, "Forbidden");
  if (!isUuid(id)) return json(400, "Invalid upload id");

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > CONTRACT_PDF_MAX_BYTES) return json(413, `The object exceeded the maximum allowed size (${CONTRACT_PDF_MAX_LABEL})`);

  const pdf = new Uint8Array(await request.arrayBuffer());
  if (pdf.byteLength === 0) return json(400, "Empty upload");
  if (pdf.byteLength > CONTRACT_PDF_MAX_BYTES) return json(413, `The object exceeded the maximum allowed size (${CONTRACT_PDF_MAX_LABEL})`);
  if (!looksLikePdf(pdf)) return json(415, "mime type is not supported: only application/pdf is allowed");

  await getStore().putContractUpload(id, pdf);
  return Response.json({ Key: `contracts/${id}/original.pdf` });
}

function json(status: number, message: string) {
  return Response.json({ statusCode: String(status), error: message, message }, { status });
}
