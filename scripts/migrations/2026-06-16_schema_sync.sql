-- Migration: 2026-06-16 schema sync (non-destructive, idempotent)
-- Derived from a live introspection of the Supabase schema diffed against the
-- frontend models. Only two real DB-level gaps were found; everything else the
-- frontend needs already exists. No DROPs, no destructive changes.
--
-- (1) appointments.reschedule_count
--     Enables the "đổi lịch tối đa 2 lần" rule. AppointmentModel.reschedule()
--     already reads/writes this and degrades gracefully when absent.
--
-- (2) public.messages
--     ChatModel / ReceptionistChatModel use this table and fall back to
--     localStorage (PGRST205) when it's missing. Creating it enables real
--     server-side chat persistence. id columns are text to accept both real
--     user UUIDs and AI/bot pseudo-ids without insert failures. RLS is enabled
--     with a permissive policy to match the app's anon-key usage — see the
--     SECURITY NOTE in the final report; tighten before production.

-- ── (1) appointments.reschedule_count ────────────────────────────────────────
alter table public.appointments
  add column if not exists reschedule_count integer not null default 0;

comment on column public.appointments.reschedule_count
  is 'Number of times the patient has rescheduled this appointment (max 2 enforced in app).';

-- ── (2) public.messages ──────────────────────────────────────────────────────
create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     text,
  sender_name   text,
  sender_role   text,
  receiver_id   text,
  receiver_name text,
  patient_id    text,
  text          text,
  mode          text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_messages_patient on public.messages (patient_id);
create index if not exists idx_messages_pair    on public.messages (sender_id, receiver_id);
create index if not exists idx_messages_created on public.messages (created_at);

alter table public.messages enable row level security;

-- Explicit grants (idempotent) so the anon/authenticated API roles can use it.
grant select, insert, update, delete on public.messages to anon, authenticated;

-- Single permissive policy (created only if absent → idempotent).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'messages'
      and policyname = 'messages_all_access'
  ) then
    create policy messages_all_access on public.messages
      for all to anon, authenticated
      using (true) with check (true);
  end if;
end $$;
