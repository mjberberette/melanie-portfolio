"use client";

import { Fragment, useActionState, useEffect, useId, useRef, useState } from "react";
import { Camera, Eye, EyeOff, ImagePlus, Loader2, Mail, Save, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormMessage, SubmitButton } from "@/components/form-bits";
import { AVATAR_MAX_BYTES, isAvatarType } from "@/lib/avatar";
import { initials } from "@/lib/format";
import type { Profile, WebsiteDetails } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  changeEmail,
  removeAvatar,
  revealHostingPassword,
  saveProfileDetails,
  saveWebsiteDetails,
  uploadAvatar,
  type FormState,
} from "./actions";

const IDLE: FormState = { status: "idle" };

/* Name, phone, company --------------------------------------------------- */

export function ProfileDetailsForm({ profile, admin = false }: { profile: Profile; admin?: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(saveProfileDetails, IDLE);
  return (
    <form action={action} className="surface space-y-5 p-5 sm:p-6">
      <input type="hidden" name="profileId" value={profile.id} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" htmlFor="firstName">
          <Input key={profile.firstName} id="firstName" name="firstName" defaultValue={profile.firstName} required autoComplete="given-name" className="bg-ink-raised" />
        </Field>
        <Field label="Last name" htmlFor="lastName">
          <Input key={profile.lastName} id="lastName" name="lastName" defaultValue={profile.lastName} autoComplete="family-name" className="bg-ink-raised" />
        </Field>
      </div>
      <div className={cn("grid gap-5", admin && "sm:grid-cols-2")}>
        <Field label="Phone" htmlFor="phone" hint="Optional. Used only if something needs a quick call.">
          <Input key={profile.phone ?? ""} id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ""} autoComplete="tel" placeholder="+1 (555) 000-0000" className="bg-ink-raised" />
        </Field>
        {admin && (
          <Field label="Company" htmlFor="company">
            <Input key={profile.company ?? ""} id="company" name="company" defaultValue={profile.company ?? ""} autoComplete="off" className="bg-ink-raised" />
          </Field>
        )}
      </div>
      <div className="flex items-center justify-between gap-4">
        <FormMessage state={state} />
        <SubmitButton pendingLabel="Saving…" className="ml-auto">
          <Save className="size-4" aria-hidden /> Save details
        </SubmitButton>
      </div>
    </form>
  );
}

/* Email ------------------------------------------------------------------ */

export function EmailForm({
  profile,
  pendingEmail,
  demo,
  self,
}: {
  profile: Profile;
  /** A new address awaiting confirmation (production only). */
  pendingEmail: string | null;
  demo: boolean;
  /** True when the signed-in user is editing their own account. */
  self: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(changeEmail, IDLE);
  const hint = demo
    ? "In demo mode the change applies immediately. In production you'd confirm it by email first."
    : self
      ? "You'll get a confirmation link at both your current and your new address. The change takes effect once you've confirmed — you keep signing in with the current one until then."
      : "Changes the client's sign-in address immediately, without a confirmation email.";
  return (
    <form action={action} className="surface space-y-5 p-5 sm:p-6">
      <input type="hidden" name="profileId" value={profile.id} />
      <Field label="Email" htmlFor="email" hint={hint}>
        <Input key={profile.email} id="email" name="email" type="email" defaultValue={profile.email} required autoComplete="email" className="bg-ink-raised" />
      </Field>
      {pendingEmail && (
        <p role="status" className="rounded-inner border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          A change to <span className="font-medium">{pendingEmail}</span> is waiting for confirmation. Open the links in the emails we sent to finish it.
        </p>
      )}
      <div className="flex items-center justify-between gap-4">
        <FormMessage state={state} />
        <SubmitButton variant="outline" pendingLabel="Sending…" className="ml-auto">
          <Mail className="size-4" aria-hidden /> {self && !demo ? "Send confirmation" : "Update email"}
        </SubmitButton>
      </div>
    </form>
  );
}

/* Website & hosting ------------------------------------------------------- */

/** The stored password is encrypted at rest and never rendered into the page.
 *  The field starts empty (blank = keep what's saved); pressing the eye fetches
 *  the plaintext for this owner/admin and fills it in so it can be read or
 *  edited. Typing a new value replaces it on save. */
function HostingPasswordField({ profileId, hasSaved }: { profileId: string; hasSaved: boolean }) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clear, setClear] = useState(false);

  async function toggle() {
    setError(null);
    if (show) return setShow(false);
    if (value === "" && hasSaved) {
      setLoading(true);
      const res = await revealHostingPassword(profileId);
      setLoading(false);
      if (res.status !== "ok") return setError(res.message ?? "Could not read the password.");
      setValue(res.password ?? "");
    }
    setShow(true);
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id="hostingPassword"
          name="hostingPassword"
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={clear}
          placeholder={hasSaved ? "Saved — leave blank to keep it" : "Not set"}
          autoComplete="off"
          spellCheck={false}
          className="bg-ink-raised pr-10 font-mono"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          disabled={loading || clear || (value === "" && !hasSaved)}
          aria-label={show ? "Hide password" : hasSaved && value === "" ? "Reveal saved password" : "Show password"}
          aria-pressed={show}
          className="absolute top-1/2 right-1 -translate-y-1/2 text-bone-faint hover:text-bone"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
      {hasSaved && (
        <label className="flex items-center gap-2 text-xs text-bone-dim">
          <input
            type="checkbox"
            name="clearHostingPassword"
            checked={clear}
            onChange={(e) => setClear(e.target.checked)}
            className="size-3.5 accent-vermilion"
          />
          Remove the saved password
        </label>
      )}
      {error && (
        <p role="alert" className="text-xs text-vermilion-soft">
          {error}
        </p>
      )}
    </div>
  );
}

export function WebsiteForm({ profileId, details }: { profileId: string; details: WebsiteDetails | null }) {
  const [state, action] = useActionState<FormState, FormData>(saveWebsiteDetails, IDLE);
  // Saved values come back normalised (e.g. a pasted URL → bare domain), so the
  // fields remount with the fresh defaults after each save.
  const version = details?.updatedAt ?? "new";
  return (
    <form action={action} autoComplete="off" className="surface space-y-8 p-5 sm:p-6">
      <input type="hidden" name="profileId" value={profileId} />

      <Fragment key={version}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Current website" htmlFor="currentUrl" hint="The site you have today, if any.">
            <Input id="currentUrl" name="currentUrl" type="text" inputMode="url" defaultValue={details?.currentUrl ?? ""} placeholder="https://www.example.com" className="bg-ink-raised" />
          </Field>
          <Field label="New domain" htmlFor="newDomain" hint="The domain you'd like the new site to live on.">
            <Input id="newDomain" name="newDomain" type="text" defaultValue={details?.newDomain ?? ""} placeholder="example.com" className="bg-ink-raised" />
          </Field>
        </div>

        <fieldset className="surface-inner space-y-5 p-4 sm:p-5">
          <legend className="eyebrow px-2 text-bone">Domain &amp; hosting login</legend>
          <p className="text-xs leading-relaxed text-bone-faint">
            Where your domain and hosting are managed, so DNS and launch can happen without a scramble. Only you and the studio can see this.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Provider" htmlFor="hostingProvider">
              <Input id="hostingProvider" name="hostingProvider" defaultValue={details?.hostingProvider ?? ""} placeholder="GoDaddy, Cloudflare, Squarespace…" className="bg-ink-raised" />
            </Field>
            <Field label="Login URL" htmlFor="hostingLoginUrl">
              <Input id="hostingLoginUrl" name="hostingLoginUrl" type="text" inputMode="url" defaultValue={details?.hostingLoginUrl ?? ""} placeholder="https://…" className="bg-ink-raised" />
            </Field>
            <Field label="Username or email" htmlFor="hostingUsername">
              <Input id="hostingUsername" name="hostingUsername" defaultValue={details?.hostingUsername ?? ""} autoComplete="off" className="bg-ink-raised" />
            </Field>
            <Field label="Password" htmlFor="hostingPassword" hint="Stored encrypted. Only shown when you ask, and only to you and the studio.">
              <HostingPasswordField profileId={profileId} hasSaved={details?.hasHostingPassword ?? false} />
            </Field>
          </div>
          <Field label="Notes" htmlFor="hostingNotes" hint="Two-factor setup, who else has access, anything that helps.">
            <Textarea id="hostingNotes" name="hostingNotes" rows={3} defaultValue={details?.hostingNotes ?? ""} className="bg-ink-raised" />
          </Field>
        </fieldset>
      </Fragment>

      <div className="flex items-center justify-between gap-4">
        <FormMessage state={state} />
        <SubmitButton pendingLabel="Saving…" className="ml-auto">
          <Save className="size-4" aria-hidden /> Save website details
        </SubmitButton>
      </div>
    </form>
  );
}

/* Avatar ------------------------------------------------------------------ */

export function AvatarUploader({ profile }: { profile: Profile }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [last, setLast] = useState<"upload" | "remove">("upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputId = useId();
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await uploadAvatar(prev, formData);
    if (result.status === "ok") {
      setPreview(null);
      formRef.current?.reset();
    }
    return result;
  }, IDLE);
  const [removeState, removeAction, removing] = useActionState<FormState, FormData>(removeAvatar, IDLE);

  // Object URLs hold the file in memory until revoked.
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  function choose(file: File | undefined) {
    setClientError(null);
    if (!file) return setPreview(null);
    if (!isAvatarType(file.type)) {
      setClientError("Use a JPG, PNG, WebP, or GIF image.");
      if (inputRef.current) inputRef.current.value = "";
      return setPreview(null);
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setClientError(`That picture is ${(file.size / 1024 / 1024).toFixed(1)} MB — keep it under 2 MB.`);
      if (inputRef.current) inputRef.current.value = "";
      return setPreview(null);
    }
    setPreview(URL.createObjectURL(file));
  }

  const busy = pending || removing;
  const shown = preview ?? profile.avatarUrl;
  const message: FormState = clientError ? { status: "error", message: clientError } : last === "upload" ? state : removeState;

  return (
    <div className="surface space-y-4 p-5 sm:p-6">
      <form ref={formRef} action={action} onSubmit={() => setLast("upload")} className="flex flex-col items-center gap-4 text-center">
        <input type="hidden" name="profileId" value={profile.id} />
        <label htmlFor={inputId} className="group relative cursor-pointer rounded-full outline-none focus-within:ring-3 focus-within:ring-ring/50">
          <Avatar className="size-28 border border-border after:hidden">
            {shown && <AvatarImage src={shown} alt="" key={shown} />}
            <AvatarFallback className="bg-ink-veil font-mono text-2xl text-bone">{initials(profile.fullName || profile.email)}</AvatarFallback>
          </Avatar>
          <span
            className="absolute inset-0 grid place-items-center rounded-full bg-ink/70 text-bone opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            aria-hidden
          >
            <Camera className="size-6" />
          </span>
          <span className="sr-only">{profile.avatarUrl ? "Choose a new picture" : "Choose a picture"}</span>
        </label>
        <input
          ref={inputRef}
          id={inputId}
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => choose(e.target.files?.[0])}
          disabled={busy}
        />

        {preview ? (
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="submit" size="sm" disabled={busy}>
              {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Save className="size-3.5" aria-hidden />}
              {pending ? "Uploading…" : profile.avatarUrl ? "Replace picture" : "Save picture"}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => choose(undefined)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
              <ImagePlus className="size-3.5" aria-hidden /> {profile.avatarUrl ? "Change picture" : "Upload picture"}
            </Button>
          </div>
        )}
      </form>

      {profile.avatarUrl && !preview && (
        <form action={removeAction} onSubmit={() => setLast("remove")} className="flex justify-center">
          <input type="hidden" name="profileId" value={profile.id} />
          <Button type="submit" variant="ghost" size="sm" disabled={busy} className="text-bone-dim hover:text-destructive">
            {removing ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Trash2 className="size-3.5" aria-hidden />} Remove picture
          </Button>
        </form>
      )}

      <p className="text-center text-xs text-bone-faint">JPG, PNG, WebP, or GIF up to 2 MB. Square images look best.</p>
      <div className="flex justify-center text-center">
        <FormMessage state={message} />
      </div>
    </div>
  );
}
