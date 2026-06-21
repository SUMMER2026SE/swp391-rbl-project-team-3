-- 2026-06-21 — Chat: Supabase Realtime + Bot→Human handoff
-- ─────────────────────────────────────────────────────────────────────────────
-- Builds on 2026-06-16_schema_sync.sql (public.messages). Two additions:
--
-- (1) public.chat_sessions
--     One row per patient conversation. Holds the handoff state machine
--     (BOT → WAITING_FOR_AGENT → WITH_AGENT → RESOLVED), live "is typing"
--     flags, and the agent's last-read marker (drives the unread badge —
--     unread = PATIENT messages created after last_read_at). The frontend
--     ChatSessionModel falls back to localStorage when this table is missing
--     (PGRST205), so running this migration is optional but enables true
--     server-side, cross-device handoff + presence.
--
-- (2) Realtime publication
--     Adds messages + chat_sessions to supabase_realtime so the Patient
--     widget and Receptionist dashboard receive INSERT/UPDATE events instead
--     of polling. REPLICA IDENTITY FULL so UPDATE payloads carry old+new rows.
--
-- No DROPs, no destructive changes. RLS permissive to match anon-key usage —
-- tighten before production (same SECURITY NOTE as the messages table).

-- ── (1) public.chat_sessions ────────────────────────────────────────────────
create table if not exists public.chat_sessions (
  patient_id     text primary key,
  patient_name   text,
  status         text not null default 'BOT',   -- BOT | WAITING_FOR_AGENT | WITH_AGENT | RESOLVED
  agent_id       text,
  agent_typing   boolean not null default false,
  patient_typing boolean not null default false,
  last_read_at   timestamptz,                    -- agent's read marker → unread badge
  updated_at     timestamptz not null default now()
);

create index if not exists idx_chat_sessions_status  on public.chat_sessions (status);
create index if not exists idx_chat_sessions_updated on public.chat_sessions (updated_at desc);

alter table public.chat_sessions enable row level security;

grant select, insert, update, delete on public.chat_sessions to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'chat_sessions'
      and policyname = 'chat_sessions_all_access'
  ) then
    create policy chat_sessions_all_access on public.chat_sessions
      for all to anon, authenticated
      using (true) with check (true);
  end if;
end $$;

-- ── (2) Realtime publication ────────────────────────────────────────────────
-- Full row image on UPDATE so postgres_changes UPDATE payloads are complete.
alter table public.messages       replica identity full;
alter table public.chat_sessions  replica identity full;

-- Add both tables to the supabase_realtime publication (idempotent).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
    ) then
      alter publication supabase_realtime add table public.messages;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_sessions'
    ) then
      alter publication supabase_realtime add table public.chat_sessions;
    end if;
  end if;
end $$;
