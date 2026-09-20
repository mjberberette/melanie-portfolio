-- Encrypt hosting/domain passwords at rest with Supabase Vault. Run after
-- 0002_profile_details.sql.
--
-- The plain-text `client_websites.hosting_password` column goes away. Each
-- password becomes a Vault secret (encrypted with the project's Vault key,
-- which never leaves Supabase); the row only keeps the secret's id. Reads and
-- writes go through two security-definer functions that only the service
-- role may execute, so the plaintext is handled exclusively on the server and
-- never reaches the anon/authenticated API roles or the browser bundle.
--
-- If `create extension` fails with a permissions error, enable "Vault" once
-- from Dashboard → Database → Extensions and re-run this file.

create extension if not exists supabase_vault;

alter table public.client_websites
  add column if not exists hosting_password_secret_id uuid;

-- Set, replace, or (with null / '') remove the password for a profile.
create or replace function public.set_hosting_password(p_profile_id uuid, p_password text)
returns void
language plpgsql
security definer set search_path = public, vault
as $$
declare
  v_secret_id uuid;
begin
  select hosting_password_secret_id into v_secret_id
  from public.client_websites
  where profile_id = p_profile_id;

  if not found then
    raise exception 'No website details for profile %', p_profile_id;
  end if;

  if p_password is null or p_password = '' then
    if v_secret_id is not null then
      delete from vault.secrets where id = v_secret_id;
      update public.client_websites set hosting_password_secret_id = null where profile_id = p_profile_id;
    end if;
    return;
  end if;

  if v_secret_id is null then
    v_secret_id := vault.create_secret(
      p_password,
      'hosting_password:' || p_profile_id::text,
      'Domain/hosting login password for portal profile ' || p_profile_id::text
    );
    update public.client_websites set hosting_password_secret_id = v_secret_id where profile_id = p_profile_id;
  else
    perform vault.update_secret(v_secret_id, p_password);
  end if;
end;
$$;

-- Decrypt on demand. Returns null when no password is stored.
create or replace function public.get_hosting_password(p_profile_id uuid)
returns text
language sql
stable
security definer set search_path = public, vault
as $$
  select s.decrypted_secret
  from public.client_websites w
  join vault.decrypted_secrets s on s.id = w.hosting_password_secret_id
  where w.profile_id = p_profile_id;
$$;

revoke all on function public.set_hosting_password(uuid, text) from public, anon, authenticated;
revoke all on function public.get_hosting_password(uuid) from public, anon, authenticated;
grant execute on function public.set_hosting_password(uuid, text) to service_role;
grant execute on function public.get_hosting_password(uuid) to service_role;

-- Don't leave orphaned secrets behind when a client (and their row) is deleted.
create or replace function public.delete_hosting_password_secret()
returns trigger
language plpgsql
security definer set search_path = public, vault
as $$
begin
  if old.hosting_password_secret_id is not null then
    delete from vault.secrets where id = old.hosting_password_secret_id;
  end if;
  return old;
end;
$$;

drop trigger if exists on_client_website_deleted on public.client_websites;
create trigger on_client_website_deleted
  after delete on public.client_websites
  for each row execute procedure public.delete_hosting_password_secret();

-- Backfill: move any plain-text passwords into Vault, then drop the column.
do $$
declare
  r record;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'client_websites' and column_name = 'hosting_password'
  ) then
    for r in
      select profile_id, hosting_password
      from public.client_websites
      where hosting_password is not null and hosting_password <> '' and hosting_password_secret_id is null
    loop
      perform public.set_hosting_password(r.profile_id, r.hosting_password);
    end loop;
  end if;
end;
$$;

alter table public.client_websites drop column if exists hosting_password;
