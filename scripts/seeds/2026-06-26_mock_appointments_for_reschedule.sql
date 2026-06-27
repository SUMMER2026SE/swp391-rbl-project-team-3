-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: mock appointments for testing the "Đổi lịch hẹn" (Reschedule) flow
-- Created: 2026-06-26
--
-- PURPOSE
--   Drops 5 fake, reschedule-eligible appointments onto the board so the
--   upgraded Reschedule modal (new Date + new Doctor) can be exercised safely
--   against the real database without touching production patient data.
--
-- SAFE-BY-DESIGN
--   • Links to EXISTING doctors (users.role_id = 2) and patients
--     (users.role_id = 5) — never invents users, never hardcodes UUIDs.
--   • Every row is tagged reason = 'MOCK-RESCHEDULE-2026-06-26' so it can be
--     deleted in one statement (see the ROLLBACK block at the bottom).
--   • Idempotent: re-running first clears the previous mock batch, so you never
--     accumulate duplicates.
--
-- STATUS MAPPING (important)
--   The brief asked for 'Chờ khám' (Pending) / 'Đã xác nhận' (Confirmed). The
--   live lifecycle vocabulary (see src/components/Receptionist/receptionistData.js
--   → APT_STATUS) has no 'Chờ khám'; the real "pending approval" value is
--   'Chờ xác nhận'. We therefore seed the canonical eligible statuses
--   'Đã xác nhận' (Confirmed) and 'Chờ xác nhận' (Pending) so the rows are
--   genuinely reschedulable in the UI. Both pass the patient-portal
--   ACTIVE_STATUSES + "upcoming" gate that unlocks the "Đổi lịch" button.
--
-- HOW TO APPLY
--   Paste into Supabase Dashboard → SQL Editor → Run.
-- ─────────────────────────────────────────────────────────────────────────────

-- Clear any previous run of THIS seed (idempotent — leaves all other data alone).
delete from public.appointments
where reason = 'MOCK-RESCHEDULE-2026-06-26';

with
  -- Active doctors, numbered so we can round-robin them across the mock rows.
  docs as (
    select user_id,
           row_number() over (order by full_name) as rn
    from public.users
    where role_id = 2
      and coalesce(status, 'ACTIVE') = 'ACTIVE'
  ),
  -- Patients, numbered the same way.
  pats as (
    select user_id, full_name, phone,
           row_number() over (order by full_name) as rn
    from public.users
    where role_id = 5
  ),
  doc_count as (select count(*)::int as n from docs),
  pat_count as (select count(*)::int as n from pats),
  -- The mock rows. days_ahead keeps every appointment in the future so it is
  -- "upcoming" (and thus reschedulable); times are within a normal clinic shift.
  seed (n, days_ahead, start_time, status, service, fee) as (
    values
      (1, 2, time '09:00', N'Đã xác nhận',  N'Khám Da Liễu Tổng Quát',       '300,000 VNĐ'),
      (2, 3, time '10:30', N'Chờ xác nhận',  N'Điều Trị Mụn Chuyên Sâu',      '450,000 VNĐ'),
      (3, 4, time '14:00', N'Đã xác nhận',  N'Trẻ Hóa Da Công Nghệ Cao',     '800,000 VNĐ'),
      (4, 5, time '15:30', N'Chờ xác nhận',  N'Soi Da & Tư Vấn Chăm Sóc Da',  '250,000 VNĐ'),
      (5, 6, time '08:30', N'Đã xác nhận',  N'Điều Trị Nám - Tàn Nhang',     '600,000 VNĐ')
  )
insert into public.appointments (
  doctor_id, patient_id, patient_name, patient_phone,
  service, fee, status,
  appointment_date, start_time, end_time,
  reason, reschedule_count
)
select
  d.user_id,
  p.user_id,
  p.full_name,
  p.phone,
  s.service,
  s.fee,
  s.status,
  (current_date + s.days_ahead),
  s.start_time,
  (s.start_time + interval '30 minutes')::time,
  'MOCK-RESCHEDULE-2026-06-26',
  0
from seed s
-- Round-robin assignment. nullif(...,0) makes the modulo (and therefore the
-- whole insert) yield zero rows — instead of erroring — if the clinic has no
-- doctors or no patients yet.
join docs d on d.rn = ((s.n - 1) % nullif((select n from doc_count), 0)) + 1
join pats p on p.rn = ((s.n - 1) % nullif((select n from pat_count), 0)) + 1;

-- Verify what landed.
select appointment_id, appointment_date, start_time, status,
       patient_name, doctor_id, service, reschedule_count
from public.appointments
where reason = 'MOCK-RESCHEDULE-2026-06-26'
order by appointment_date, start_time;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK (run to remove every mock row created by this seed):
--   delete from public.appointments
--   where reason = 'MOCK-RESCHEDULE-2026-06-26';
-- ─────────────────────────────────────────────────────────────────────────────
