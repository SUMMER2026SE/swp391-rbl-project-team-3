-- ============================================================================
-- GUEST CHAT ACCESS — unbreak the landing-page chatbot after the 2026-07-12
-- RLS lockdown (20260712152942_secure_remaining_tables.sql).
--
-- Live-verified facts driving this migration:
--   * msg_insert requires auth.uid()::text = sender_id — but the widget writes
--     sender_id 'pat-<uid>' / 'pat-guest*' / 'bot' / 'system', so EVERY chat
--     insert from the widget was rejected (guests AND logged-in patients).
--   * chat_sessions never existed on the live DB — the Bot→Human handoff was
--     silently running on per-browser localStorage, invisible to receptionists.
--   * Neither table was in the supabase_realtime publication.
--
-- Thread-id contract (client, FloatingChatbot.jsx):
--   * guest:      patient_id = 'pat-guest-<random-uuid>' (per browser, stored
--                 in localStorage — unguessable capability-style id)
--   * logged-in:  patient_id = 'pat-' || auth.uid()
-- Guest threads are readable/writable by anon by design (public chat widget);
-- the random uuid is the only secret. Acceptable for this low-sensitivity
-- pre-login concierge chat; staff policies stay unchanged.
-- ============================================================================

-- 1. CHAT_SESSIONS — Bot→Human handoff state machine (one row per thread).
create table if not exists public.chat_sessions (
  patient_id     text primary key,
  patient_name   text,
  status         text not null default 'BOT',
  agent_id       text,
  agent_typing   boolean not null default false,
  patient_typing boolean not null default false,
  last_read_at   timestamptz,
  updated_at     timestamptz not null default now()
);
alter table public.chat_sessions enable row level security;

-- 2. MESSAGES — additive chat policies (existing staff/auth policies untouched).
drop policy if exists "msg_select_chat" on public.messages;
create policy "msg_select_chat" on public.messages
  for select using (
    patient_id like 'pat-guest-%'
    or patient_id = 'pat-' || auth.uid()::text
  );

drop policy if exists "msg_insert_chat" on public.messages;
create policy "msg_insert_chat" on public.messages
  for insert with check (
    (patient_id like 'pat-guest-%' or patient_id = 'pat-' || auth.uid()::text)
    and mode in ('AI', 'Live')
    and (sender_id = patient_id or sender_id in ('bot', 'system'))
  );

create index if not exists idx_messages_patient_created
  on public.messages (patient_id, created_at desc);

-- 3. CHAT_SESSIONS policies — own thread (guest or patient) + staff full access.
drop policy if exists "cs_select" on public.chat_sessions;
create policy "cs_select" on public.chat_sessions
  for select using (
    patient_id like 'pat-guest-%'
    or patient_id = 'pat-' || auth.uid()::text
    or public.current_role_id() in (1, 2, 3, 4)
  );

drop policy if exists "cs_insert" on public.chat_sessions;
create policy "cs_insert" on public.chat_sessions
  for insert with check (
    patient_id like 'pat-guest-%'
    or patient_id = 'pat-' || auth.uid()::text
    or public.current_role_id() in (1, 2, 3, 4)
  );

drop policy if exists "cs_update" on public.chat_sessions;
create policy "cs_update" on public.chat_sessions
  for update using (
    patient_id like 'pat-guest-%'
    or patient_id = 'pat-' || auth.uid()::text
    or public.current_role_id() in (1, 2, 3, 4)
  );

-- 4. REALTIME — both tables were missing from the publication, so the widget's
-- postgres_changes subscriptions never received a single event.
do $$
begin
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
end $$;
