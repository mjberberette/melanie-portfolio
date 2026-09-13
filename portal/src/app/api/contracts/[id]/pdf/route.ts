import { type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getStore } from "@/lib/store";

/** Streams an agreement PDF to its owner (or an admin). `?signed=1` returns
 *  the countersigned copy with the certificate page; `?download=1` forces a
 *  file download instead of the inline viewer. */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/contracts/[id]/pdf">) {
  const { id } = await params;
  const profile = await getSession();
  if (!profile) return new Response("Unauthorized", { status: 401 });

  const store = getStore();
  const contract = await store.getContract(id);
  if (!contract || (profile.role !== "admin" && contract.clientId !== profile.id)) {
    return new Response("Not found", { status: 404 });
  }

  const wantSigned = request.nextUrl.searchParams.get("signed") === "1";
  const variant = wantSigned && contract.status === "signed" ? "signed" : "original";
  const bytes = await store.getContractPdf(id, variant);
  if (!bytes) return new Response("File missing", { status: 404 });

  const slug = contract.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  const filename = `${slug}${variant === "signed" ? "-signed" : ""}.pdf`;
  const disposition = request.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline";

  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
