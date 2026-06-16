-- ============================================================================
-- 2026 DEEP AUDIT — non-destructive integrity-FK fixes (DRAFT — NOT executed)
-- ----------------------------------------------------------------------------
-- Source: deep audit 2026-06-16. The direct Postgres host was unreachable from
-- the agent environment (db.<ref>.supabase.co => ENOTFOUND), so relationships
-- were probed via PostgREST (REST) instead. These FK gaps were detected:
--
--   feedbacks        -> users   : PGRST200 (no relationship)
--   medical_records  -> users   : PGRST200 (no relationship)
--
-- The relationships the frontend ACTUALLY embeds today already work and need
-- nothing here (verified 200): feedbacks->patient_profiles, payments->
-- appointments, system_logs->users, users->doctor_profiles, users->
-- employee_profiles.
--
-- The constraints below are therefore DATA-INTEGRITY hardening (and enable
-- future `users` embeds on feedbacks / medical_records). They are:
--   * idempotent  — guarded by pg_constraint existence checks
--   * orphan-safe — added NOT VALID, so existing rows are NOT checked and the
--                   statement cannot fail on legacy orphan data; new rows ARE
--                   enforced and PostgREST still recognises the relationship.
--
-- HOW TO RUN: paste into Supabase Dashboard -> SQL Editor -> Run (the agent's
-- direct connection is down). After confirming no orphans, you may optionally
-- run `ALTER TABLE ... VALIDATE CONSTRAINT ...;` to validate historical rows.
-- ============================================================================

-- feedbacks.doctor_id -> users.user_id
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'feedbacks_doctor_id_users_fkey') then
    alter table public.feedbacks
      add constraint feedbacks_doctor_id_users_fkey
      foreign key (doctor_id) references public.users (user_id) not valid;
  end if;
end $$;

-- feedbacks.appointment_id -> appointments.appointment_id
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'feedbacks_appointment_id_fkey') then
    alter table public.feedbacks
      add constraint feedbacks_appointment_id_fkey
      foreign key (appointment_id) references public.appointments (appointment_id) not valid;
  end if;
end $$;

-- medical_records.patient_id -> users.user_id
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'medical_records_patient_id_users_fkey') then
    alter table public.medical_records
      add constraint medical_records_patient_id_users_fkey
      foreign key (patient_id) references public.users (user_id) not valid;
  end if;
end $$;

-- medical_records.doctor_id -> users.user_id
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'medical_records_doctor_id_users_fkey') then
    alter table public.medical_records
      add constraint medical_records_doctor_id_users_fkey
      foreign key (doctor_id) references public.users (user_id) not valid;
  end if;
end $$;

-- medical_records.appointment_id -> appointments.appointment_id
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'medical_records_appointment_id_fkey') then
    alter table public.medical_records
      add constraint medical_records_appointment_id_fkey
      foreign key (appointment_id) references public.appointments (appointment_id) not valid;
  end if;
end $$;

-- Refresh PostgREST's schema cache so the new relationships become embeddable.
notify pgrst, 'reload schema';
