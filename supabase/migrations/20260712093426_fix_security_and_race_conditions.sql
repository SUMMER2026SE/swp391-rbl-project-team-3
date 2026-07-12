-- ============================================================================
-- FIX C3: PREVENT DOUBLE BOOKING (RACE CONDITION) — hardened
--
-- A plain UNIQUE constraint is wrong here for two reasons (verified live):
--   1. It fails to apply — cancelled+rebooked slots already collide (6 groups).
--   2. It would block a slot FOREVER once any appointment on it is cancelled.
-- So: dedupe the existing active collisions, then add a PARTIAL unique index
-- that only guards non-cancelled, non-hold rows. Holds ('Đang giữ chỗ') are
-- excluded on purpose: two users may hold concurrently, but the confirm step
-- (UPDATE hold → 'Đã xác nhận') hits the index, so a racing confirm still
-- loses cleanly at the database level.
-- ============================================================================

-- ── C3 · step 0: cancel duplicate ACTIVE rows, keeping the earliest per slot ──
with ranked as (
  select appointment_id,
         row_number() over (
           partition by doctor_id, appointment_date, start_time
           order by created_at asc nulls last, appointment_id asc
         ) as rn
  from public.appointments
  where status not in ('Đã hủy','Đã huỷ','CANCELLED','Cancelled','Canceled','Đang giữ chỗ')
)
update public.appointments a
set status = 'Đã hủy'
from ranked r
where a.appointment_id = r.appointment_id
  and r.rn > 1;

-- ── C3 · step 1: partial unique index over active rows ──
create unique index if not exists uniq_active_doctor_slot
  on public.appointments (doctor_id, appointment_date, start_time)
  where status not in ('Đã hủy','Đã huỷ','CANCELLED','Cancelled','Canceled','Đang giữ chỗ');

-- ============================================================================
-- FIX C2: LOCK DOWN PII (ROW LEVEL SECURITY) — role-aware
--
-- Patient-only policies would blank every staff portal and kill guest booking
-- (RLS is default-deny). Roles come from public.users.role_id:
--   1 ADMIN · 2 DOCTOR · 3 TECHNICIAN · 4 RECEPTIONIST · 5 PATIENT
-- The helper runs SECURITY DEFINER so it works regardless of future RLS on
-- public.users and stays out of policy-recursion trouble.
-- ============================================================================

create or replace function public.current_role_id()
returns integer
language sql stable security definer
set search_path = public
as $$
  select role_id from public.users where user_id = auth.uid();
$$;

grant execute on function public.current_role_id() to anon, authenticated;

alter table public.appointments enable row level security;

-- Idempotency: drop ours and the originally-proposed names if they exist.
drop policy if exists "staff_read_all_appointments"      on public.appointments;
drop policy if exists "patients_read_own_appointments"   on public.appointments;
drop policy if exists "booking_insert"                   on public.appointments;
drop policy if exists "staff_update_appointments"        on public.appointments;
drop policy if exists "patients_update_own_appointments" on public.appointments;
drop policy if exists "guest_anchor_update"              on public.appointments;
drop policy if exists "staff_delete_appointments"        on public.appointments;
drop policy if exists "Bệnh nhân chỉ xem lịch của mình" on public.appointments;
drop policy if exists "Bệnh nhân được phép đặt lịch"   on public.appointments;

-- READ: staff see everything; patients see only their own rows.
create policy "staff_read_all_appointments" on public.appointments
  for select using (public.current_role_id() in (1,2,3,4));

create policy "patients_read_own_appointments" on public.appointments
  for select using (auth.uid() = patient_id);

-- INSERT: logged-in patient books for self; admin/receptionist create for
-- anyone; anonymous guests book via the shared guest anchor row only.
create policy "booking_insert" on public.appointments
  for insert with check (
    auth.uid() = patient_id
    or public.current_role_id() in (1, 4)
    or patient_id = '18504773-0f51-405a-aa32-70cae403be6e'::uuid
  );

-- UPDATE: staff manage the lifecycle; patients reschedule/cancel their own;
-- anon guests may confirm their held anchor rows (hold → confirmed flow).
create policy "staff_update_appointments" on public.appointments
  for update using (public.current_role_id() in (1,2,3,4));

create policy "patients_update_own_appointments" on public.appointments
  for update using (auth.uid() = patient_id);

create policy "guest_anchor_update" on public.appointments
  for update using (patient_id = '18504773-0f51-405a-aa32-70cae403be6e'::uuid);

-- DELETE: admin / receptionist only.
create policy "staff_delete_appointments" on public.appointments
  for delete using (public.current_role_id() in (1, 4));

-- ── C2 · availability without PII ──
-- The public slot picker must know WHICH slots are taken without reading
-- patient rows. This view exposes only scheduling columns; it executes with
-- owner privileges (security_invoker = false), intentionally bypassing RLS
-- for these non-PII columns only.
create or replace view public.booked_slots as
  select doctor_id, appointment_date, start_time, end_time, status, created_at
  from public.appointments;

grant select on public.booked_slots to anon, authenticated;
