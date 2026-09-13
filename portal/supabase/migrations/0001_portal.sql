-- Client portal schema. Run in the Supabase SQL editor (or `supabase db push`).
-- The app talks to the database from the server with the service-role key and
-- scopes every query to the signed-in user, so RLS here is defence in depth:
-- the anon/public key can never read anything.

create extension if not exists "pgcrypto";

-- Profiles mirror auth.users and carry the portal role.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  company text,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, company)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'company'
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  summary text not null default '',
  status text not null default 'on_track'
    check (status in ('on_track', 'awaiting_client', 'at_risk', 'on_hold', 'complete')),
  phase text not null default 'discovery'
    check (phase in ('discovery', 'strategy', 'design', 'build', 'launch')),
  start_date date not null default current_date,
  target_launch date,
  next_step text,
  created_at timestamptz not null default now()
);
create index if not exists projects_client_idx on public.projects (client_id);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  due_date date,
  completed_at timestamptz,
  sort_order int not null default 0
);
create index if not exists milestones_project_idx on public.milestones (project_id);

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null default 'update' check (kind in ('update', 'deliverable', 'decision')),
  title text not null,
  body text not null default '',
  link_url text,
  link_label text,
  created_at timestamptz not null default now()
);
create index if not exists project_updates_project_idx on public.project_updates (project_id, created_at desc);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  title text not null,
  description text,
  status text not null default 'awaiting_signature'
    check (status in ('awaiting_signature', 'signed', 'void')),
  document_sha256 text not null,
  sent_at timestamptz not null default now(),
  signed_at timestamptz,
  signer_name text,
  signer_email text,
  signer_ip text,
  signer_user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists contracts_client_idx on public.contracts (client_id);

-- Row-level security: clients read their own rows, admins read everything,
-- nobody writes through the public API (the server uses the service role).
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.milestones enable row level security;
alter table public.project_updates enable row level security;
alter table public.contracts enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

drop policy if exists "profiles: own or admin" on public.profiles;
create policy "profiles: own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "projects: own or admin" on public.projects;
create policy "projects: own or admin" on public.projects
  for select using (client_id = auth.uid() or public.is_admin());

drop policy if exists "milestones: own or admin" on public.milestones;
create policy "milestones: own or admin" on public.milestones
  for select using (
    exists (select 1 from public.projects p where p.id = project_id and (p.client_id = auth.uid() or public.is_admin()))
  );

drop policy if exists "updates: own or admin" on public.project_updates;
create policy "updates: own or admin" on public.project_updates
  for select using (
    exists (select 1 from public.projects p where p.id = project_id and (p.client_id = auth.uid() or public.is_admin()))
  );

drop policy if exists "contracts: own or admin" on public.contracts;
create policy "contracts: own or admin" on public.contracts
  for select using (client_id = auth.uid() or public.is_admin());

-- Private bucket for agreement PDFs: <contract id>/original.pdf and signed.pdf.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contracts', 'contracts', false, 26214400, array['application/pdf'])
on conflict (id) do nothing;
