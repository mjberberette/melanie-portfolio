# Client Portal — portal.melanieberberette.design

A private portal where clients sign agreements and follow the status of their
project. It shares the portfolio's design language (ink, bone, vermilion, Grift)
and lives in this repository under `portal/`, but deploys as its own Vercel
project on the `portal.` subdomain.

## What it does

**For clients**

- Sign in with email + password, or by one-time magic link (invitation only — nobody
  can self-register). Accepting an invitation lands on a "create your password" step;
  a forgot-password flow emails a link to choose a new one.
- Overview: what needs their attention, active projects, latest updates, agreement counts.
- Projects: five-phase progress track (Discovery → Strategy → Design → Build → Launch),
  status, "what happens next", milestones, and a timeline of updates, deliverables,
  and decisions with links (Figma, Notion, staging…).
- Agreements: review the PDF in the browser, sign by drawing or typing, and download
  a countersigned copy. Signing appends a certificate page (name, email, time, IP,
  device, SHA-256 fingerprint of the exact document) and stamps a signature block on
  the final page. Signed agreements can't be altered afterwards.

**For you (admin)**

- Invite clients (sends the invitation email through Supabase Auth).
- Create projects; change phase, status, target launch, and next step; add and tick
  off milestones; post updates.
- Upload a PDF and send it for signature; withdraw agreements that are still pending.
- Every client-facing page has a "Manage" link when you're signed in as admin.

## Stack

Next.js (App Router, server actions), TypeScript, Tailwind CSS 4, shadcn/ui (Base UI),
`pdf-lib` for signature stamping, Supabase (Auth + Postgres + Storage) in production.

Without Supabase credentials the app runs in **demo mode**: an in-memory store with a
sample client, two projects, and two agreements (one already signed). No email is
sent — sign in from the login page with `jordan@everypeer.com` (client) or
`hello@melanieberberette.com` (admin). Demo data resets when the server restarts.

## Run locally

```bash
cd portal
npm install
npm run dev        # http://localhost:43418  (demo mode)
```

Copy `.env.example` to `.env.local` and fill in the Supabase values to run against a
real database locally.

## Go live

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. SQL Editor → paste and run `supabase/migrations/0001_portal.sql`. It creates the
   tables, row-level security, the profile trigger, and the private `contracts`
   storage bucket.
3. Authentication → Providers → Email: keep **Email** on, turn **Confirm email** on,
   and (recommended) turn **Allow new users to sign up** *off* — the app never creates
   users from the login page; you invite them from the admin area.
4. Authentication → URL Configuration:
   - Site URL: `https://portal.melanieberberette.design`
   - Redirect URLs: `https://portal.melanieberberette.design/auth/callback`
     (add `http://localhost:43418/**` for local testing). Sign-in, invitation, and
     password-reset links append `?next=…` to this URL. Any redirect back to the Site
     URL's hostname is accepted automatically, so production needs nothing extra; for
     other hosts the `**` wildcard is what lets the query string through.
   - Authentication → Providers → Email → **Minimum password length**: the app
     requires 10 characters mixing letters with numbers or symbols; set the project
     minimum to 10 as well (or higher — the dashboard's message is shown to the client).
5. Authentication → Emails → **SMTP Settings**: add a custom SMTP provider. The
   built-in Supabase sender is rate-limited (a few emails per hour) and meant only for
   testing, and the dashboard won't let you edit email templates until custom SMTP is
   configured. With [Resend](https://resend.com): verify `melanieberberette.design` as
   a sending domain, create an API key, then enter host `smtp.resend.com`, port `465`,
   username `resend`, password = the API key, and a sender such as
   `Melanie Berberette <portal@melanieberberette.design>`.
6. Authentication → Emails → **Templates**: open **Invite user**, **Magic link or
   OTP**, and **Reset password**, write the copy in your voice, and point the link at
   the portal's callback route rather than the default `{{ .ConfirmationURL }}`. This
   makes links work when opened on a different device than the one that requested
   them, and lands dashboard-sent invitations directly in the portal. The `type`
   parameter is what routes invitations to the create-password step and reset emails
   to the new-password step.

   Invite user:

   ```html
   <h2>You're invited to the portal</h2>
   <p>I've set up a private space where you can review and sign our agreements and
   follow the project as it moves. This link signs you in and lets you create a
   password for next time.</p>
   <p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite">Open the portal</a></p>
   ```

   Magic link or OTP:

   ```html
   <h2>Your sign-in link</h2>
   <p>Click below to sign in to the portal. The link works once and expires in an hour.</p>
   <p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink">Sign in</a></p>
   ```

   Reset password:

   ```html
   <h2>Reset your portal password</h2>
   <p>Click below to choose a new password. The link works once and expires in an hour.
   If you didn't ask for this, you can ignore it.</p>
   <p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery">Choose a new password</a></p>
   ```

   (The default `{{ .ConfirmationURL }}` links still work — the login page finishes
   those sign-ins in the browser and reads the link type from the URL fragment — but
   the `token_hash` form is more robust.)
7. Project Settings → API: copy the Project URL, the `anon` key, and the
   `service_role` key.

### 2. Vercel

1. New Project → import the `melanie-portfolio` repository again (a second Vercel
   project pointing at the same repo).
2. **Root Directory**: `portal`. Framework preset: Next.js.
3. Environment variables:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key (server-only) |
   | `NEXT_PUBLIC_PORTAL_URL` | `https://portal.melanieberberette.design` |
   | `PORTAL_ADMIN_EMAILS` | `hello@melanieberberette.com` (comma-separate more) |

4. Deploy, then Settings → Domains → add `portal.melanieberberette.design`.
5. At your DNS provider add a `CNAME` record: name `portal`, value
   `cname.vercel-dns.com`. Vercel issues the certificate automatically.

### 3. Your admin account

Invite yourself: with `PORTAL_ADMIN_EMAILS` set, sign in once with that address (use
Supabase → Authentication → Users → *Invite user* for the very first account, since
the admin area needs an admin to exist). The app promotes that email to admin on
first sign-in. From then on invite clients from **Studio admin → Invite client**.

## Troubleshooting

- **`404 DEPLOYMENT_NOT_FOUND` on the subdomain** — DNS is pointing at Vercel but the
  domain isn't attached to a project with a live production deployment. Open the portal
  project → Settings → Domains and make sure `portal.melanieberberette.design` is listed
  there (not on the portfolio project), then check Deployments for a green build. Root
  Directory must be `portal`.
- **Email link bounces back to the login page** — the redirect URL isn't allowed. In
  Supabase → Authentication → URL Configuration, add
  `https://portal.melanieberberette.design/auth/callback` to Redirect URLs and set the
  Site URL to `https://portal.melanieberberette.design`.
- **"That sign-in link is invalid or has expired"** — links are single-use and expire
  after an hour. Request a new one from the login page.
- **"That email and password don't match"** — the client may never have set a
  password (accounts invited before passwords existed). They can sign in with an
  emailed link and then visit `/set-password`, or use **Forgot password?** on the
  login page.
- **Password can't be saved after a reset link** — if "Secure password change" is on
  in Authentication → Providers → Email, Supabase wants a recent sign-in; recovery and
  invitation sessions count as recent, but a client who has been signed in for a long
  time should use the forgot-password flow instead of `/set-password`.
- **Signed in but no Studio admin link** — the email isn't in `PORTAL_ADMIN_EMAILS`
  (exact match, lower-case), or the variable was added after the last deploy; redeploy.

## Project layout

```
portal/
  src/app/(auth)/login        sign-in page + auth actions (password, magic link, demo)
  src/app/(auth)/set-password create a password after accepting an invitation
  src/app/(auth)/forgot-password, reset-password   password recovery
  src/app/auth/callback       turns email links into a session and routes by link type
  src/app/(portal)/           signed-in shell: overview, projects, contracts, admin
  src/app/api/contracts/…/pdf streams original/signed PDFs to their owner
  src/proxy.ts                refreshes the Supabase session cookie per request
  src/lib/auth.ts             getSession / requireSession / requireAdmin
  src/lib/store/              PortalStore interface, demo store, Supabase store
  src/lib/pdf.ts              signature stamping + certificate page (pdf-lib)
  supabase/migrations/        schema, RLS policies, storage bucket
```

## Notes on e-signatures

The signing flow records intent (explicit consent checkbox), identity (invited email
+ authenticated session), the exact document (SHA-256 fingerprint), and an audit trail
(timestamp, IP, user agent) — the ingredients the U.S. ESIGN Act and UETA look for in
a simple agreement. For high-value contracts or clients outside the U.S., pair it
with a dedicated provider or have counsel review your templates.
