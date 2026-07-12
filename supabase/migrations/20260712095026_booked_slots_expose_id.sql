-- booked_slots needs appointment_id so the booking flow can exclude the
-- caller's own hold row when validating (id is a plain sequence, non-PII).
-- CREATE OR REPLACE VIEW cannot reorder existing columns -> drop & recreate.
drop view if exists public.booked_slots;

create view public.booked_slots as
  select appointment_id, doctor_id, appointment_date, start_time, end_time, status, created_at
  from public.appointments;

grant select on public.booked_slots to anon, authenticated;
