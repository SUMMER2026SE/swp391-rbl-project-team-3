-- Migration: 2026-06-16 add direct FK doctor_profiles.doctor_id -> users.user_id
-- (non-destructive, idempotent, validated — 0 orphan rows confirmed beforehand)
--
-- WHY: useDoctors() / DoctorModel.getAllDoctors() run an embedded PostgREST query
--   users.select('... doctor_profiles(...) ...')
-- which fails with PGRST200 ("Could not find a relationship between 'users' and
-- 'doctor_profiles'"). doctor_profiles.doctor_id only had an FK to
-- employee_profiles (users <- employee_profiles <- doctor_profiles). PostgREST
-- does not traverse multi-hop chains, so the embed needs a DIRECT users<->
-- doctor_profiles relationship. The existing FK to employee_profiles is kept.

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class c1 on c1.oid = con.conrelid
    join pg_class c2 on c2.oid = con.confrelid
    where con.contype = 'f'
      and c1.relname = 'doctor_profiles'
      and c2.relname = 'users'
  ) then
    alter table public.doctor_profiles
      add constraint doctor_profiles_doctor_id_users_fkey
      foreign key (doctor_id) references public.users (user_id) on delete cascade;
  end if;
end $$;

-- Ask PostgREST to refresh its schema cache so the new relationship is usable.
notify pgrst, 'reload schema';
