-- Doctors must be able to create appointments (tái khám / follow-ups).
--
-- The previous `booking_insert` policy allowed INSERT only for ADMIN (1) and
-- RECEPTIONIST (4) — DOCTOR (2) was left out. Every follow-up a doctor created
-- from the EMR for a real (non-guest) patient was silently rejected by RLS:
-- AppointmentModel.create() swallowed the error and returned null, so the UI
-- reported "Tạo lịch tái khám thất bại".
--
-- UPDATE on appointments already allows roles 1,2,3,4 (staff_update_appointments),
-- so INSERT being narrower than UPDATE was the inconsistency, not the intent.
-- Technicians (3) still cannot create appointments — they never book.

drop policy if exists "booking_insert" on public.appointments;

create policy "booking_insert"
  on public.appointments
  for insert
  with check (
    -- a patient booking for themselves
    auth.uid() = patient_id
    -- ADMIN, DOCTOR (follow-ups), RECEPTIONIST (walk-ins / phone bookings)
    or current_role_id() = any (array[1, 2, 4])
    -- anonymous guest bookings, pinned to the shared FK anchor row
    or patient_id = '18504773-0f51-405a-aa32-70cae403be6e'::uuid
  );
