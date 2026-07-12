-- PostgREST 'insert ... returning' (used by AppointmentModel.create to get the
-- new appointment_id back for the hold->confirm flow) requires the inserted row
-- to ALSO pass a SELECT policy. Anonymous guests book via the shared anchor row,
-- so grant read on anchor rows only. Deliberate, limited trade-off: guest-anchor
-- appointment rows are readable by anon (vs. the previously fully-open table).
-- Proper long-term fix: a SECURITY DEFINER booking RPC.
drop policy if exists "guest_anchor_read" on public.appointments;
create policy "guest_anchor_read" on public.appointments
  for select using (patient_id = '18504773-0f51-405a-aa32-70cae403be6e'::uuid);
