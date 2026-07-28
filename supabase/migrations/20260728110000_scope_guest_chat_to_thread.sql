-- ============================================================================
-- 20260728 — Guest chat: prove ownership of the thread instead of just being anon.
--
-- 20260713193000_guest_chat_access.sql granted anon access with
--   `patient_id like 'pat-guest-%'`
-- and justified it with "the random uuid is the only secret". It wasn't a secret
-- in practice: the policy never required the caller to *present* that uuid, so a
-- single unfiltered `GET /rest/v1/messages` returned every visitor's guest
-- conversation (24 rows across 62 threads at audit time on 2026-07-28).
--
-- The widget now talks to guest threads through a dedicated client that sends
-- the thread id as the `x-guest-thread` request header (src/guestChatClient.js),
-- so the policy can compare against it. Realtime cannot send custom headers, so
-- guest threads no longer receive postgres_changes frames — FloatingChatbot
-- polls instead (POLL_MS). Signed-in patients and staff are unaffected: they
-- match on auth.uid() / current_role_id() exactly as before.
--
-- ⚠ Deploy order: ship the frontend build BEFORE applying this migration. An old
--   bundle (no header) degrades to the localStorage chat fallback — messages
--   stop being persisted for the receptionist until the new build is live.
-- ============================================================================

-- Header lookup, NULL-safe:
--   * REST  → PostgREST sets request.headers to a JSON object.
--   * Realtime / direct SQL → the setting is absent, so this returns NULL and
--     every guest branch below evaluates to false.
create or replace function public.guest_thread_header()
  returns text
  language sql
  stable
as $$
  select nullif(current_setting('request.headers', true), '')::json ->> 'x-guest-thread';
$$;

-- ---------------------------------------------------------------------------
-- MESSAGES
-- ---------------------------------------------------------------------------
drop policy if exists "msg_select_chat" on public.messages;
create policy "msg_select_chat" on public.messages
  for select using (
    patient_id = 'pat-' || auth.uid()::text
    or (
      patient_id like 'pat-guest-%'
      and patient_id = public.guest_thread_header()
    )
  );

drop policy if exists "msg_insert_chat" on public.messages;
create policy "msg_insert_chat" on public.messages
  for insert with check (
    (
      patient_id = 'pat-' || auth.uid()::text
      or (
        patient_id like 'pat-guest-%'
        and patient_id = public.guest_thread_header()
      )
    )
    and mode in ('AI', 'Live')
    and (sender_id = patient_id or sender_id in ('bot', 'system'))
  );

-- ---------------------------------------------------------------------------
-- CHAT_SESSIONS (staff branch unchanged — the agent queue must list every thread)
-- ---------------------------------------------------------------------------
drop policy if exists "cs_select" on public.chat_sessions;
create policy "cs_select" on public.chat_sessions
  for select using (
    patient_id = 'pat-' || auth.uid()::text
    or (patient_id like 'pat-guest-%' and patient_id = public.guest_thread_header())
    or public.current_role_id() in (1, 2, 3, 4)
  );

drop policy if exists "cs_insert" on public.chat_sessions;
create policy "cs_insert" on public.chat_sessions
  for insert with check (
    patient_id = 'pat-' || auth.uid()::text
    or (patient_id like 'pat-guest-%' and patient_id = public.guest_thread_header())
    or public.current_role_id() in (1, 2, 3, 4)
  );

drop policy if exists "cs_update" on public.chat_sessions;
create policy "cs_update" on public.chat_sessions
  for update using (
    patient_id = 'pat-' || auth.uid()::text
    or (patient_id like 'pat-guest-%' and patient_id = public.guest_thread_header())
    or public.current_role_id() in (1, 2, 3, 4)
  );
