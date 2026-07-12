-- ============================================================================
-- RLS for payments / users / patient_profiles — Least Privilege.
--
-- Discovered schema facts (live-verified):
--   users.user_id (uuid PK, = auth.uid) · users.role_id (1 ADMIN · 2 DOCTOR ·
--   3 TECHNICIAN · 4 RECEPTIONIST · 5 PATIENT)
--   patient_profiles.patient_id (uuid PK → users.user_id)
--   payments.patient_id (uuid → patient_profiles.patient_id)
-- Staff bypass reuses the existing SECURITY DEFINER helper
-- public.current_role_id() (from 20260712093426) — definer execution also means
-- enabling RLS on `users` cannot recurse into these policies.
--
-- Flow-driven decisions (see frontend audit in the session summary):
--   • Doctor rows (role_id = 2) are readable by everyone — the public landing
--     page & booking form load the doctor directory via the anon client.
--     (User-approved deviation from "no anon SELECT".)
--   • users INSERT is allowed ONLY as self-provisioning a PATIENT row
--     (ProfileModel JIT-creates `role_id: 5` on first login). WITH CHECK pins
--     role_id = 5 so nobody self-registers as staff.
--   • users UPDATE-own pins role_id to its current value via
--     current_role_id() — otherwise "update own row" would let a patient set
--     their own role_id = 1 (privilege escalation).
--   • payments INSERT/UPDATE allow patient-own + staff: booking deposits are
--     recorded client-side by logged-in patients, and the cashier desk
--     (receptionist) writes/upserts settlement rows.
-- ============================================================================

-- 1. ENABLE RLS
alter table public.payments enable row level security;
alter table public.users enable row level security;
alter table public.patient_profiles enable row level security;

-- 2. DROP EXISTING POLICIES (clean slate — includes the template names)
drop policy if exists "Users can view own data and staff can view all" on public.users;
drop policy if exists "Users can update own data" on public.users;
drop policy if exists "Users view own data or staff view all" on public.users;
drop policy if exists "Users update own data" on public.users;
drop policy if exists "users_select" on public.users;
drop policy if exists "users_insert_self_patient" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "users_update_admin" on public.users;
drop policy if exists "users_delete_admin" on public.users;
drop policy if exists "Patients view own profile, staff view all" on public.patient_profiles;
drop policy if exists "Patients update own profile" on public.patient_profiles;
drop policy if exists "Patients insert own profile" on public.patient_profiles;
drop policy if exists "Patients view own profile or staff view all" on public.patient_profiles;
drop policy if exists "pp_select" on public.patient_profiles;
drop policy if exists "pp_insert" on public.patient_profiles;
drop policy if exists "pp_update" on public.patient_profiles;
drop policy if exists "pp_delete_staff" on public.patient_profiles;
drop policy if exists "Patients view own payments, staff view all" on public.payments;
drop policy if exists "Patients view own payments or staff view all" on public.payments;
drop policy if exists "pay_select" on public.payments;
drop policy if exists "pay_insert" on public.payments;
drop policy if exists "pay_update" on public.payments;

-- 3. USERS TABLE POLICIES
create policy "users_select" on public.users
  for select using (
    auth.uid() = user_id
    or public.current_role_id() in (1, 2, 3, 4)
    or role_id = 2  -- public doctor directory (landing page / booking form)
  );

create policy "users_insert_self_patient" on public.users
  for insert with check (
    auth.uid() = user_id
    and role_id = 5  -- JIT self-provision as PATIENT only
  );

create policy "users_update_own" on public.users
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and role_id = public.current_role_id()  -- role is immutable to its owner
  );

create policy "users_update_admin" on public.users
  for update using (public.current_role_id() = 1);

create policy "users_delete_admin" on public.users
  for delete using (public.current_role_id() = 1);

-- 4. PATIENT_PROFILES TABLE POLICIES
create policy "pp_select" on public.patient_profiles
  for select using (
    auth.uid() = patient_id
    or public.current_role_id() in (1, 2, 3, 4)
  );

create policy "pp_insert" on public.patient_profiles
  for insert with check (
    auth.uid() = patient_id
    or public.current_role_id() in (1, 2, 3, 4)  -- reception check-in / staff intake
  );

create policy "pp_update" on public.patient_profiles
  for update using (
    auth.uid() = patient_id
    or public.current_role_id() in (1, 2, 3, 4)
  );

create policy "pp_delete_staff" on public.patient_profiles
  for delete using (public.current_role_id() in (1, 4));

-- 5. PAYMENTS TABLE POLICIES — no anon access of any kind.
create policy "pay_select" on public.payments
  for select using (
    auth.uid() = patient_id
    or public.current_role_id() in (1, 2, 3, 4)
  );

create policy "pay_insert" on public.payments
  for insert with check (
    auth.uid() = patient_id                       -- patient records own deposit
    or public.current_role_id() in (1, 2, 3, 4)   -- cashier / staff settlement
  );

create policy "pay_update" on public.payments
  for update using (
    auth.uid() = patient_id                       -- deposit upsert conflict path
    or public.current_role_id() in (1, 2, 3, 4)
  );
