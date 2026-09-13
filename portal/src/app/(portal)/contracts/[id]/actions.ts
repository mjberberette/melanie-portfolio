"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { getStore } from "@/lib/store";

export interface SignState {
  status: "idle" | "error" | "signed";
  message?: string;
}

const schema = z.object({
  contractId: z.string().min(1),
  signerName: z.string().trim().min(2, "Enter your full legal name as it should appear on the agreement."),
  mode: z.enum(["draw", "type"]),
  signatureImage: z.string().optional(),
  consent: z.literal("on", { message: "You need to agree to sign electronically before continuing." }),
});

export async function signContractAction(_prev: SignState, formData: FormData): Promise<SignState> {
  const profile = await requireSession();
  const parsed = schema.safeParse({
    contractId: formData.get("contractId"),
    signerName: formData.get("signerName"),
    mode: formData.get("mode"),
    signatureImage: formData.get("signatureImage") || undefined,
    consent: formData.get("consent"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };

  const { contractId, signerName, mode, signatureImage } = parsed.data;
  if (mode === "draw" && !signatureImage?.startsWith("data:image/png;base64,")) {
    return { status: "error", message: "Draw your signature in the box, or switch to typing your name." };
  }
  if (signatureImage && signatureImage.length > 400_000) {
    return { status: "error", message: "That signature image is too large. Try drawing it again." };
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "").split(",")[0].trim() || null;
  const userAgent = h.get("user-agent");

  try {
    await getStore().signContract(
      { contractId, signerName, signatureImage: mode === "draw" ? signatureImage! : null, ip, userAgent },
      profile,
    );
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Signing failed. Please try again." };
  }

  revalidatePath("/", "layout");
  return { status: "signed" };
}
