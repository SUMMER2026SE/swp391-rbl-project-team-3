-- ============================================================================
-- RLS for the final 5 tables — Least Privilege, public reads preserved.
-- Staff bypass reuses public.current_role_id() (1 ADMIN,2 DOCTOR,3 TECH,4 RECEP).
--
-- Discovered schema facts (verified live — NOT the template's assumptions):
--   * service_tickets has NO patient_id — the patient link is appointment_id
--     (bigint) -> appointments.appointment_id, so "patient views own" is a
--     subquery (patients already see their own appointments via that table's RLS).
--   * invoices.patient_id is TEXT      -> auth.uid()::text cast.
--   * messages.sender_id/receiver_id/patient_id are all TEXT -> ::text casts.
--   * service_tickets/invoices/messages already had RLS ON with permissive
--     "*_all_access" (USING true) policies — dropped below. feedbacks &
--     doctor_shifts were RLS-OFF.
--   * feedbacks.patient_id / doctor_shifts.doctor_id are UUID.
-- ============================================================================

-- 1. ENABLE RLS (idempotent; three already on)
alter table public.service_tickets enable row level security;
alter table public.invoices        enable row level security;
alter table public.messages        enable row level security;
alter table public.feedbacks       enable row level security;
alter table public.doctor_shifts   enable row level security;

-- 2. DROP EXISTING / prior policies (clean slate)
drop policy if exists "service_tickets_all_access" on public.service_tickets;
drop policy if exists "st_select"        on public.service_tickets;
drop policy if exists "st_insert"        on public.service_tickets;
drop policy if exists "st_update"        on public.service_tickets;
drop policy if exists "st_delete"        on public.service_tickets;
drop policy if exists "invoices_all_access" on public.invoices;
drop policy if exists "inv_select"       on public.invoices;
drop policy if exists "inv_insert"       on public.invoices;
drop policy if exists "inv_update"       on public.invoices;
drop policy if exists "messages_all_access" on public.messages;
drop policy if exists "msg_select"       on public.messages;
drop policy if exists "msg_insert"       on public.messages;
drop policy if exists "msg_update_staff" on public.messages;
drop policy if exists "msg_delete_staff" on public.messages;
drop policy if exists "fb_select"        on public.feedbacks;
drop policy if exists "fb_insert"        on public.feedbacks;
drop policy if exists "fb_update"        on public.feedbacks;
drop policy if exists "fb_delete"        on public.feedbacks;
drop policy if exists "ds_select"        on public.doctor_shifts;
drop policy if exists "ds_insert"        on public.doctor_shifts;
drop policy if exists "ds_update"        on public.doctor_shifts;
drop policy if exists "ds_delete"        on public.doctor_shifts;

-- 3. SERVICE_TICKETS — strictly private (patient reads own via appointment; staff all)
create policy "st_select" on public.service_tickets
  for select using (
    appointment_id in (select a.appointment_id from public.appointments a where a.patient_id = auth.uid())
    or public.current_role_id() in (1,2,3,4)
  );
create policy "st_insert" on public.service_tickets
  for insert with check (public.current_role_id() in (1,2,3,4));
create policy "st_update" on public.service_tickets
  for update using (public.current_role_id() in (1,2,3,4));
create policy "st_delete" on public.service_tickets
  for delete using (public.current_role_id() in (1,2,3,4));

-- 4. INVOICES — strictly private (patient_id is TEXT). Anon: NONE.
create policy "inv_select" on public.invoices
  for select using (
    auth.uid()::text = patient_id
    or public.current_role_id() in (1,2,3,4)
  );
create policy "inv_insert" on public.invoices
  for insert with check (public.current_role_id() in (1,2,3,4));
create policy "inv_update" on public.invoices
  for update using (public.current_role_id() in (1,2,3,4));

-- 5. MESSAGES — private chat (sender/receiver/patient are TEXT). Staff: all.
create policy "msg_select" on public.messages
  for select using (
    auth.uid()::text = sender_id
    or auth.uid()::text = receiver_id
    or auth.uid()::text = patient_id
    or public.current_role_id() in (1,2,3,4)
  );
create policy "msg_insert" on public.messages
  for insert with check (
    auth.uid()::text = sender_id
    or public.current_role_id() in (1,2,3,4)
  );
create policy "msg_update_staff" on public.messages
  for update using (public.current_role_id() in (1,2,3,4));
create policy "msg_delete_staff" on public.messages
  for delete using (public.current_role_id() in (1,2,3,4));

-- 6. FEEDBACKS — public reviews (anon SELECT). Patient inserts/edits own; staff manage.
create policy "fb_select" on public.feedbacks
  for select using (true);
create policy "fb_insert" on public.feedbacks
  for insert with check (auth.uid() = patient_id);
create policy "fb_update" on public.feedbacks
  for update using (auth.uid() = patient_id or public.current_role_id() in (1,2,3,4));
create policy "fb_delete" on public.feedbacks
  for delete using (public.current_role_id() in (1,2,3,4));

-- 7. DOCTOR_SHIFTS — public availability (anon SELECT; booking reads this). Staff manage.
create policy "ds_select" on public.doctor_shifts
  for select using (true);
create policy "ds_insert" on public.doctor_shifts
  for insert with check (public.current_role_id() in (1,2,3,4));
create policy "ds_update" on public.doctor_shifts
  for update using (public.current_role_id() in (1,2,3,4));
create policy "ds_delete" on public.doctor_shifts
  for delete using (public.current_role_id() in (1,2,3,4));
