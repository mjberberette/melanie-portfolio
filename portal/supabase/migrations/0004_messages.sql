-- In-portal messaging between each client and the studio. Run after
-- 0003_hosting_password_vault.sql in the Supabase SQL editor.
--
-- One conversation per client; messages carry the sender, a plain-text body,
-- and a read receipt. As everywhere else in the portal, writes happen on the
-- server through the service role. The select policies below matter more
-- than usual here: Supabase Realtime evaluates them when it decides which
-- inserted/updated rows to stream to a browser, so a client only ever
-- receives events for their own conversation.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  -- Denormalised from the sender's profile so unread counts are a single
  -- indexed predicate ("from the client, not yet read") without a join.
  sender_role text not null check (sender_role in ('client', 'admin')),
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
create index if not exists messages_unread_idx on public.messages (conversation_id, sender_role) where read_at is null;

-- Keep conversations.last_message_at current so the inbox can sort without
-- scanning messages.
create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
  after insert on public.messages
  for each row execute procedure public.touch_conversation();

revoke all on function public.touch_conversation() from public, anon, authenticated;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "conversations: own or admin" on public.conversations;
create policy "conversations: own or admin" on public.conversations
  for select to authenticated
  using (client_id = auth.uid() or public.is_admin());

drop policy if exists "messages: own or admin" on public.messages;
create policy "messages: own or admin" on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.client_id = auth.uid() or public.is_admin())
    )
  );

-- Realtime: stream inserts and read-receipt updates on `messages` to the
-- browser. The publication exists on every Supabase project; adding the
-- table is idempotent here. If this block is skipped or fails, turn it on
-- from Dashboard → Database → Publications → supabase_realtime → messages
-- (the portal falls back to polling every few seconds when no realtime
-- events arrive, so the chat still works either way).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
     )
  then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
