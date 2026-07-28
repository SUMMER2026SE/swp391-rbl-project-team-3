-- ============================================================================
-- 20260728 — Close the RLS holes found while auditing the Vercel deployment.
--
-- Live state BEFORE this migration (verified on the production database):
--   15 public tables had RLS OFF while the `anon` role still held the default
--   SELECT/INSERT/UPDATE/DELETE grants. Anyone holding the (publicly embedded)
--   anon key could therefore read *and destroy* clinical data:
--
--     medical_records (21 rows: diagnosis, symptoms, doctor_note, patient_id)
--     prescriptions (20 rows), prescription_details, lab_tests,
--     lab_test_results, treatment_plans, treatment_procedures, system_logs,
--     services, medicines, roles, doctor_profiles, employee_profiles,
--     doctor_schedules, consultation_slots
--
-- Model applied here (same vocabulary as 20260712152942_secure_remaining_tables):
--   * PHI tables      → patient reads own row, staff (1,2,3,4) read all,
--                       clinicians (1,2[,3]) write, admin (1) deletes.
--   * Reference data  → public SELECT (landing page + booking need it),
--                       staff-only writes.
--   * system_logs     → admin reads, staff append, nobody edits/deletes.
--
-- Role ids via public.current_role_id(): 1 ADMIN, 2 DOCTOR, 3 TECHNICIAN,
-- 4 RECEPTIONIST. All id columns below are uuid, so auth.uid() compares directly
-- without a cast (verified against information_schema).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. ENABLE RLS
-- ---------------------------------------------------------------------------
alter table public.medical_records      enable row level security;
alter table public.prescriptions        enable row level security;
alter table public.prescription_details enable row level security;
alter table public.lab_tests            enable row level security;
alter table public.lab_test_results     enable row level security;
alter table public.treatment_plans      enable row level security;
alter table public.treatment_procedures enable row level security;
alter table public.system_logs          enable row level security;
alter table public.services             enable row level security;
alter table public.medicines            enable row level security;
alter table public.roles                enable row level security;
alter table public.doctor_profiles      enable row level security;
alter table public.employee_profiles    enable row level security;
alter table public.doctor_schedules     enable row level security;
alter table public.consultation_slots   enable row level security;

-- ---------------------------------------------------------------------------
-- 2. MEDICAL_RECORDS — patient reads own, staff read all, doctors write.
-- ---------------------------------------------------------------------------
drop policy if exists "mr_select" on public.medical_records;
create policy "mr_select" on public.medical_records
  for select using (
    patient_id = auth.uid()
    or public.current_role_id() in (1, 2, 3, 4)
  );

drop policy if exists "mr_insert" on public.medical_records;
create policy "mr_insert" on public.medical_records
  for insert with check (public.current_role_id() in (1, 2));

drop policy if exists "mr_update" on public.medical_records;
create policy "mr_update" on public.medical_records
  for update using (public.current_role_id() in (1, 2))
  with check (public.current_role_id() in (1, 2));

drop policy if exists "mr_delete" on public.medical_records;
create policy "mr_delete" on public.medical_records
  for delete using (public.current_role_id() = 1);

-- ---------------------------------------------------------------------------
-- 3. PRESCRIPTIONS + PRESCRIPTION_DETAILS
--    Details have no patient column — ownership is inherited through the
--    parent prescription (the subquery is itself filtered by rx_select).
-- ---------------------------------------------------------------------------
drop policy if exists "rx_select" on public.prescriptions;
create policy "rx_select" on public.prescriptions
  for select using (
    patient_id = auth.uid()
    or public.current_role_id() in (1, 2, 3, 4)
  );

drop policy if exists "rx_insert" on public.prescriptions;
create policy "rx_insert" on public.prescriptions
  for insert with check (public.current_role_id() in (1, 2));

drop policy if exists "rx_update" on public.prescriptions;
create policy "rx_update" on public.prescriptions
  for update using (public.current_role_id() in (1, 2))
  with check (public.current_role_id() in (1, 2));

drop policy if exists "rx_delete" on public.prescriptions;
create policy "rx_delete" on public.prescriptions
  for delete using (public.current_role_id() = 1);

drop policy if exists "rxd_select" on public.prescription_details;
create policy "rxd_select" on public.prescription_details
  for select using (
    exists (
      select 1 from public.prescriptions p
      where p.prescription_id = prescription_details.prescription_id
    )
  );

drop policy if exists "rxd_write" on public.prescription_details;
create policy "rxd_write" on public.prescription_details
  for all using (public.current_role_id() in (1, 2))
  with check (public.current_role_id() in (1, 2));

-- ---------------------------------------------------------------------------
-- 4. LAB_TESTS + LAB_TEST_RESULTS (results inherit ownership from the test)
-- ---------------------------------------------------------------------------
drop policy if exists "lt_select" on public.lab_tests;
create policy "lt_select" on public.lab_tests
  for select using (
    patient_id = auth.uid()
    or public.current_role_id() in (1, 2, 3, 4)
  );

drop policy if exists "lt_write" on public.lab_tests;
create policy "lt_write" on public.lab_tests
  for all using (public.current_role_id() in (1, 2, 3))
  with check (public.current_role_id() in (1, 2, 3));

drop policy if exists "ltr_select" on public.lab_test_results;
create policy "ltr_select" on public.lab_test_results
  for select using (
    exists (
      select 1 from public.lab_tests t
      where t.lab_test_id = lab_test_results.lab_test_id
    )
  );

drop policy if exists "ltr_write" on public.lab_test_results;
create policy "ltr_write" on public.lab_test_results
  for all using (public.current_role_id() in (1, 2, 3))
  with check (public.current_role_id() in (1, 2, 3));

-- ---------------------------------------------------------------------------
-- 5. TREATMENT_PLANS + TREATMENT_PROCEDURES
--    Technicians execute procedures, so they may update the ones assigned to
--    them; plan authorship stays with doctors/admin.
-- ---------------------------------------------------------------------------
drop policy if exists "tp_select" on public.treatment_plans;
create policy "tp_select" on public.treatment_plans
  for select using (
    patient_id = auth.uid()
    or public.current_role_id() in (1, 2, 3, 4)
  );

drop policy if exists "tp_write" on public.treatment_plans;
create policy "tp_write" on public.treatment_plans
  for all using (public.current_role_id() in (1, 2))
  with check (public.current_role_id() in (1, 2));

drop policy if exists "tpr_select" on public.treatment_procedures;
create policy "tpr_select" on public.treatment_procedures
  for select using (
    exists (
      select 1 from public.treatment_plans p
      where p.plan_id = treatment_procedures.plan_id
    )
  );

drop policy if exists "tpr_write" on public.treatment_procedures;
create policy "tpr_write" on public.treatment_procedures
  for all using (
    public.current_role_id() in (1, 2)
    or (public.current_role_id() = 3 and technician_id = auth.uid())
  )
  with check (
    public.current_role_id() in (1, 2)
    or (public.current_role_id() = 3 and technician_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 6. SYSTEM_LOGS — append-only audit trail. Admin reads; staff append.
-- ---------------------------------------------------------------------------
drop policy if exists "sl_select" on public.system_logs;
create policy "sl_select" on public.system_logs
  for select using (public.current_role_id() = 1);

drop policy if exists "sl_insert" on public.system_logs;
create policy "sl_insert" on public.system_logs
  for insert with check (public.current_role_id() in (1, 2, 3, 4));

-- ---------------------------------------------------------------------------
-- 7. REFERENCE DATA — public SELECT (landing page, booking form and the
--    chat-bot's price context all read these anonymously), staff-only writes.
-- ---------------------------------------------------------------------------
drop policy if exists "svc_select" on public.services;
create policy "svc_select" on public.services for select using (true);

drop policy if exists "svc_write" on public.services;
create policy "svc_write" on public.services
  for all using (public.current_role_id() = 1)
  with check (public.current_role_id() = 1);

drop policy if exists "med_select" on public.medicines;
create policy "med_select" on public.medicines
  for select using (auth.uid() is not null);

drop policy if exists "med_write" on public.medicines;
create policy "med_write" on public.medicines
  for all using (public.current_role_id() in (1, 2))
  with check (public.current_role_id() in (1, 2));

-- roles: reference lookup for signed-in users; nobody writes it from the app.
drop policy if exists "role_select" on public.roles;
create policy "role_select" on public.roles
  for select using (auth.uid() is not null);

-- doctor_profiles / employee_profiles: the public doctor directory reads these
-- through the anon client (useDoctors.js, DoctorModel.js). Owners edit their own
-- row from /profile; admin edits anyone.
drop policy if exists "dp_select" on public.doctor_profiles;
create policy "dp_select" on public.doctor_profiles for select using (true);

drop policy if exists "dp_write" on public.doctor_profiles;
create policy "dp_write" on public.doctor_profiles
  for all using (doctor_id = auth.uid() or public.current_role_id() = 1)
  with check (doctor_id = auth.uid() or public.current_role_id() = 1);

drop policy if exists "ep_select" on public.employee_profiles;
create policy "ep_select" on public.employee_profiles for select using (true);

drop policy if exists "ep_write" on public.employee_profiles;
create policy "ep_write" on public.employee_profiles
  for all using (employee_id = auth.uid() or public.current_role_id() = 1)
  with check (employee_id = auth.uid() or public.current_role_id() = 1);

-- doctor_schedules / consultation_slots: the booking form reads availability
-- before login, so SELECT stays public; only staff may change a schedule.
drop policy if exists "dsch_select" on public.doctor_schedules;
create policy "dsch_select" on public.doctor_schedules for select using (true);

drop policy if exists "dsch_write" on public.doctor_schedules;
create policy "dsch_write" on public.doctor_schedules
  for all using (public.current_role_id() in (1, 2, 4))
  with check (public.current_role_id() in (1, 2, 4));

drop policy if exists "cs_slot_select" on public.consultation_slots;
create policy "cs_slot_select" on public.consultation_slots for select using (true);

drop policy if exists "cs_slot_write" on public.consultation_slots;
create policy "cs_slot_write" on public.consultation_slots
  for all using (public.current_role_id() in (1, 2, 4))
  with check (public.current_role_id() in (1, 2, 4));

-- ---------------------------------------------------------------------------
-- 8. Defence in depth — anon has no business writing to clinical tables at all,
--    so drop the grants as well as relying on the policies above.
-- ---------------------------------------------------------------------------
revoke insert, update, delete, truncate on
  public.medical_records,
  public.prescriptions,
  public.prescription_details,
  public.lab_tests,
  public.lab_test_results,
  public.treatment_plans,
  public.treatment_procedures,
  public.system_logs
from anon;

-- ---------------------------------------------------------------------------
-- 9. users — the anon client only ever needs the public doctor/technician
--    directory columns, but a table-level SELECT grant exposed email, phone
--    and date_of_birth of all 9 staff members. Column-level grants cannot be
--    subtracted from a table-level grant, so revoke and re-grant precisely.
--    (`authenticated` keeps the full table grant.)
-- ---------------------------------------------------------------------------
revoke select on public.users from anon;
grant select (user_id, role_id, full_name, avatar_url, status, created_at)
  on public.users to anon;
