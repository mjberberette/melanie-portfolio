-- Client profile self-service: split names, phone, avatar, and website /
-- hosting details. Run after 0001_portal.sql in the Supabase SQL editor.
--
-- As in 0001, the app reads and writes through the service role on the
-- server and scopes every query to the signed-in user; the policies below are
-- defence in depth so the anon/public key can never read another client's
-- data — in particular the hosting credentials in client_websites.

-- Profiles: separate first/last names (full_name stays and is kept in sync by
-- the app, so the greeting and every existing screen keep working), a phone
-- number, and the storage path of the avatar in the `avatars` bucket.
alter table public.profiles
  add column if not exists first_name text not null default '',
  add column if not exists last_name text not null default '',
  add column if not exists phone text,
  add column if not exists avatar_path text;

-- Backfill: first word → first_name, the rest → last_name.
update public.profiles
set
  first_name = split_part(btrim(full_name), ' ', 1),
  last_name  = btrim(substr(btrim(full_name), length(split_part(btrim(full_name), ' ', 1)) + 1))
where first_name = '' and last_name = '' and btrim(full_name) <> '';

-- Keep profiles.email in step when a user confirms an email change in Auth.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set email = lower(new.email) where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute procedure public.handle_user_email_change();

-- Website and hosting details, one row per client. Kept out of `profiles`
-- so the sensitive hosting login lives in its own table with its own policy.
-- (0003 moves `hosting_password` into Supabase Vault and drops the column.)
create table if not exists public.client_websites (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  current_url text,
  new_domain text,
  hosting_provider text,
  hosting_login_url text,
  hosting_username text,
  hosting_password text,
  hosting_notes text,
  updated_at timestamptz not null default now()
);

alter table public.client_websites enable row level security;

drop policy if exists "client_websites: own or admin" on public.client_websites;
create policy "client_websites: own or admin" on public.client_websites
  for select using (profile_id = auth.uid() or public.is_admin());

-- Private bucket for profile pictures: <profile id>/<timestamp>.<ext>.
-- Served to the owner or an admin through /api/avatars/[id].
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

drop policy if exists "avatars: read own or admin" on storage.objects;
create policy "avatars: read own or admin" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

drop policy if exists "avatars: upload own or admin" on storage.objects;
create policy "avatars: upload own or admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

drop policy if exists "avatars: replace own or admin" on storage.objects;
create policy "avatars: replace own or admin" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

drop policy if exists "avatars: delete own or admin" on storage.objects;
create policy "avatars: delete own or admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
