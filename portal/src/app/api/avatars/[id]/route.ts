import { type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getStore } from "@/lib/store";

/** Streams a profile picture to its owner or an admin. The `avatars` bucket
 *  is private; this route is the only way a browser gets at it. URLs carry a
 *  `?v=` that changes on every upload, so the response can be cached hard. */
export async function GET(_request: NextRequest, { params }: RouteContext<"/api/avatars/[id]">) {
  const { id } = await params;
  const profile = await getSession();
  if (!profile) return new Response("Unauthorized", { status: 401 });
  if (profile.role !== "admin" && profile.id !== id) return new Response("Not found", { status: 404 });

  const file = await getStore().getAvatar(id);
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(Buffer.from(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.bytes.byteLength),
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
