"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, PenLine, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignaturePad } from "@/components/signature-pad";
import { signContractAction, type SignState } from "./actions";

export function SignPanel({ contractId, defaultName }: { contractId: string; defaultName: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<SignState, FormData>(signContractAction, { status: "idle" });
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [png, setPng] = useState<string | null>(null);
  const [name, setName] = useState(defaultName);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (state.status === "signed") {
      toast.success("Agreement signed", { description: "Your countersigned copy is ready to download." });
      router.refresh();
    }
  }, [state, router]);

  const ready = consent && name.trim().length >= 2 && (mode === "type" || Boolean(png));

  return (
    <form action={action} className="surface space-y-6 p-5 sm:p-6" data-tone="accent">
      <input type="hidden" name="contractId" value={contractId} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="signatureImage" value={png ?? ""} />

      <div className="flex items-center gap-2">
        <PenLine className="size-4 text-vermilion" aria-hidden />
        <h2 className="eyebrow text-bone">Sign this agreement</h2>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signerName">Full legal name</Label>
        <Input
          id="signerName"
          name="signerName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
          className="h-11 bg-ink-raised"
        />
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as "draw" | "type")}>
        <div className="flex items-center justify-between">
          <Label>Signature</Label>
          <TabsList className="h-8">
            <TabsTrigger value="draw" className="px-3 text-xs">
              Draw
            </TabsTrigger>
            <TabsTrigger value="type" className="px-3 text-xs">
              Type
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="draw" className="mt-3">
          <SignaturePad onChange={setPng} disabled={pending} />
        </TabsContent>
        <TabsContent value="type" className="mt-3">
          <div className="grid h-40 place-items-center rounded-inner border border-input bg-ink px-6">
            <span className="font-serif text-4xl italic text-bone" aria-live="polite">
              {name.trim() || "Your name"}
            </span>
          </div>
          <p className="mt-2 text-xs text-bone-faint">Your typed name is adopted as your signature.</p>
        </TabsContent>
      </Tabs>

      <div className="flex items-start gap-3 surface-inner p-4">
        <input type="hidden" name="consent" value={consent ? "on" : ""} />
        <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
        <Label htmlFor="consent" className="text-sm leading-relaxed font-normal text-bone-dim">
          I have read this agreement and agree to sign it electronically. I understand my electronic signature is legally
          binding, and that my name, the time, and my IP address will be recorded on the signature certificate.
        </Label>
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-sm text-vermilion-soft">
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={!ready || pending} className="h-12 w-full text-base font-medium">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden /> Signing…
          </>
        ) : (
          <>
            <ShieldCheck className="size-4" aria-hidden /> Sign agreement
          </>
        )}
      </Button>
    </form>
  );
}
