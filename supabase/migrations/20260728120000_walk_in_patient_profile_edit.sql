-- ============================================================================
-- 20260728 — Walk-in booking: let the front desk correct an auto-filled profile.
--
-- The receptionist's "Đặt lịch trực tiếp" form looks a patient up by email and
-- pre-fills name / phone / dob / gender / address. Those fields are now editable
-- (a returning patient may have moved or changed number, and older profiles are
-- often incomplete), so the desk needs a way to write the corrections back.
--
-- RLS on public.users only allows UPDATE for the row owner or an ADMIN
-- (users_update_own / users_update_admin), so a RECEPTIONIST cannot patch a
-- patient row directly — hence this SECURITY DEFINER helper, mirroring
-- create_walk_in_patient but with the authorisation check that one is missing.
--
-- Role ids: 1 ADMIN, 2 DOCTOR, 3 TECHNICIAN, 4 RECEPTIONIST, 5 PATIENT.
-- ============================================================================

create or replace function public.update_walk_in_patient(
  p_user_id   uuid,
  p_full_name text,
  p_phone     text,
  p_gender    text,
  p_dob       date,
  p_address   text
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_role int := public.current_role_id();
begin
  -- Front desk and admin only.
  if v_role is null or v_role not in (1, 4) then
    return jsonb_build_object('success', false, 'error', 'Không có quyền cập nhật hồ sơ bệnh nhân.');
  end if;

  -- Never let this path touch a staff account.
  if not exists (
    select 1 from public.users u where u.user_id = p_user_id and u.role_id = 5
  ) then
    return jsonb_build_object('success', false, 'error', 'Hồ sơ không tồn tại hoặc không phải bệnh nhân.');
  end if;

  -- Blank input means "leave as is" — the form only sends fields it changed,
  -- but coalesce keeps a stray empty string from wiping a stored value.
  update public.users
     set full_name     = coalesce(nullif(btrim(p_full_name), ''), full_name),
         phone         = coalesce(nullif(btrim(p_phone), ''), phone),
         gender        = coalesce(nullif(btrim(p_gender), ''), gender),
         date_of_birth = coalesce(p_dob, date_of_birth)
   where user_id = p_user_id;

  if nullif(btrim(p_address), '') is not null then
    insert into public.patient_profiles (patient_id, address)
    values (p_user_id, btrim(p_address))
    on conflict (patient_id) do update set address = excluded.address;
  end if;

  return jsonb_build_object('success', true);

exception
  when unique_violation then
    return jsonb_build_object('success', false,
      'error', 'Số điện thoại này đã thuộc về một hồ sơ bệnh nhân khác.');
  when others then
    return jsonb_build_object('success', false, 'error', SQLERRM);
end;
$$;

revoke all on function public.update_walk_in_patient(uuid, text, text, text, date, text) from public;
revoke all on function public.update_walk_in_patient(uuid, text, text, text, date, text) from anon;
grant execute on function public.update_walk_in_patient(uuid, text, text, text, date, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Same treatment for its sibling: create_walk_in_patient is SECURITY DEFINER,
-- writes straight into auth.users + public.users, and was executable by PUBLIC
-- and anon with NO caller check — i.e. anyone holding the public anon key could
-- mint patient accounts. The walk-in form is the only caller and it always runs
-- as a signed-in receptionist.
-- ---------------------------------------------------------------------------
create or replace function public.create_walk_in_patient(
  p_user_id   uuid,
  p_full_name text,
  p_phone     text,
  p_email     text,
  p_gender    text,
  p_dob       date,
  p_address   text
) returns jsonb
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
    DECLARE
      v_now TIMESTAMPTZ := NOW();
      v_role INT := public.current_role_id();
    BEGIN
      -- Front desk and admin only (added 2026-07-28; the function used to accept
      -- calls from anon).
      IF v_role IS NULL OR v_role NOT IN (1, 4) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Không có quyền tạo hồ sơ bệnh nhân.');
      END IF;

      -- 1. Insert into auth.users first (satisfies FK constraint on public.users)
      INSERT INTO auth.users (
        id,
        aud,
        role,
        email,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_sso_user,
        is_anonymous,
        created_at,
        updated_at
      ) VALUES (
        p_user_id,
        'authenticated',
        'authenticated',
        p_email,
        v_now,
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', p_full_name, 'role', 'PATIENT'),
        false,
        false,
        v_now,
        v_now
      )
      ON CONFLICT (id) DO NOTHING;

      -- 2. Insert into public.users
      INSERT INTO public.users (user_id, role_id, full_name, phone, email, gender, date_of_birth, status)
      VALUES (p_user_id, 5, p_full_name, p_phone, p_email, p_gender, p_dob, 'ACTIVE')
      ON CONFLICT (user_id) DO NOTHING;

      -- 3. Insert into patient_profiles
      INSERT INTO public.patient_profiles (patient_id, address)
      VALUES (p_user_id, p_address)
      ON CONFLICT (patient_id) DO NOTHING;

      RETURN jsonb_build_object('success', true, 'user_id', p_user_id);
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object('success', false, 'error', SQLERRM);
    END;
$$;

revoke all on function public.create_walk_in_patient(uuid, text, text, text, text, date, text) from public;
revoke all on function public.create_walk_in_patient(uuid, text, text, text, text, date, text) from anon;
grant execute on function public.create_walk_in_patient(uuid, text, text, text, text, date, text) to authenticated;
