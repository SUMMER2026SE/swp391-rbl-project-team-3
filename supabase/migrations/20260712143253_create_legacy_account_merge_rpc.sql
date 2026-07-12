-- ============================================================================
-- Legacy guest/account merge — atomic SECURITY DEFINER RPC.
--
-- Why this is broader than the template's D+E body: under the RLS deployed in
-- 20260712103129 the merge is broken at THREE layers, so the RPC must own all
-- of them (only a definer function can):
--   • DETECTION: a logged-in patient can no longer SELECT another patient's
--     (role_id=5) row by email, so the client can't even discover old_user_id.
--     → The RPC self-discovers via the caller's VERIFIED auth email.
--   • CLIENT A/B: renaming the old row's email is blocked (own-row only), so the
--     new-user INSERT hits the users.email UNIQUE conflict. → The RPC frees the
--     old email, then provisions the destination row by copying the old identity.
--   • D/E: cross-user UPDATE/DELETE is blocked. → done here under definer rights.
--
-- Verified schema facts (NOT the template's assumptions):
--   • PK/user id columns: users.user_id (uuid), patient_profiles.patient_id (uuid).
--   • service_tickets has NO patient_id column — EXCLUDED (the old client code
--     UPDATE'd a non-existent column; here it would abort the whole txn).
--   • invoices.patient_id is TEXT, not uuid — cast required.
--   • ALL tables FK'd to patient_profiles must be repointed, else the final
--     DELETE FROM patient_profiles fails on an FK violation. Full set below.
--
-- Security: destination is ALWAYS auth.uid() (never client-supplied). If a
-- p_old_user_id is passed it is still validated to belong to the caller's email,
-- so a caller can never merge someone else's account into their own.
-- ============================================================================

create or replace function public.merge_legacy_account(p_old_user_id uuid default null)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_current_user_id uuid := auth.uid();
    v_email           text;
    v_old_user_id     uuid;
    v_old_email       text;
    v_old_name        varchar;
    v_old_phone       varchar;
    v_old_gender      varchar;
    v_old_dob         date;
begin
    -- 1. Strict security validation
    if v_current_user_id is null then
        return json_build_object('success', false, 'error_code', 'UNAUTHORIZED',
            'message', 'Vui lòng đăng nhập để thực hiện thao tác này.');
    end if;

    select email into v_email from auth.users where id = v_current_user_id;
    if v_email is null then
        return json_build_object('success', false, 'error_code', 'UNAUTHORIZED',
            'message', 'Không xác định được email tài khoản hiện tại.');
    end if;

    -- Resolve the legacy account: explicit arg, else self-discover by email.
    if p_old_user_id is not null then
        v_old_user_id := p_old_user_id;
    else
        select user_id into v_old_user_id
        from public.users
        where role_id = 5
          and lower(email) = lower(v_email)
          and user_id <> v_current_user_id
        limit 1;
    end if;

    -- Nothing to merge → not an error; caller proceeds to normal JIT create.
    if v_old_user_id is null then
        return json_build_object('success', true, 'merged', false, 'error_code', 'NO_LEGACY',
            'message', 'Không có tài khoản cũ cần gộp.');
    end if;

    if v_old_user_id = v_current_user_id then
        return json_build_object('success', false, 'error_code', 'INVALID_MERGE',
            'message', 'Không thể gộp tài khoản vào chính nó.');
    end if;

    -- Anti-spoof: the legacy row MUST belong to the caller's own email.
    select email, full_name, phone, gender, date_of_birth
      into v_old_email, v_old_name, v_old_phone, v_old_gender, v_old_dob
      from public.users where user_id = v_old_user_id;

    if v_old_email is null then
        return json_build_object('success', true, 'merged', false, 'error_code', 'NO_LEGACY',
            'message', 'Tài khoản cũ không còn tồn tại.');
    end if;
    if lower(v_old_email) <> lower(v_email) then
        return json_build_object('success', false, 'error_code', 'FORBIDDEN',
            'message', 'Không thể gộp một tài khoản không thuộc về bạn.');
    end if;

    -- 2. Free the old email, then provision the destination user (copy identity).
    update public.users
       set email = v_email || '_merged_' || v_old_user_id::text
     where user_id = v_old_user_id;

    insert into public.users (user_id, role_id, email, full_name, phone, gender, date_of_birth, status)
    values (v_current_user_id, 5, v_email, coalesce(v_old_name, 'Bệnh nhân'),
            v_old_phone, coalesce(v_old_gender, 'Khác'), v_old_dob, 'ACTIVE')
    on conflict (user_id) do nothing;

    -- Destination patient_profiles (copy old; guarantee at least a bare row).
    insert into public.patient_profiles (patient_id, address, allergy_note, medical_history,
                                         emergency_contact, blood_type, height, weight)
    select v_current_user_id, address, allergy_note, medical_history,
           emergency_contact, blood_type, height, weight
      from public.patient_profiles where patient_id = v_old_user_id
    on conflict (patient_id) do nothing;
    insert into public.patient_profiles (patient_id)
    values (v_current_user_id) on conflict (patient_id) do nothing;

    -- 3. Cascade ALL patient_profiles children old -> new (repoint FKs).
    update public.appointments    set patient_id = v_current_user_id where patient_id = v_old_user_id;
    update public.medical_records set patient_id = v_current_user_id where patient_id = v_old_user_id;
    update public.feedbacks       set patient_id = v_current_user_id where patient_id = v_old_user_id;
    update public.payments        set patient_id = v_current_user_id where patient_id = v_old_user_id;
    update public.ai_skin_analyses set patient_id = v_current_user_id where patient_id = v_old_user_id;
    update public.lab_tests       set patient_id = v_current_user_id where patient_id = v_old_user_id;
    update public.prescriptions   set patient_id = v_current_user_id where patient_id = v_old_user_id;
    update public.skin_images     set patient_id = v_current_user_id where patient_id = v_old_user_id;
    update public.treatment_plans set patient_id = v_current_user_id where patient_id = v_old_user_id;
    -- invoices.patient_id is TEXT
    update public.invoices        set patient_id = v_current_user_id::text where patient_id = v_old_user_id::text;

    -- 4. Cleanup legacy (child before parent).
    delete from public.patient_profiles where patient_id = v_old_user_id;
    delete from public.users           where user_id   = v_old_user_id;

    return json_build_object('success', true, 'merged', true,
        'message', 'Gộp dữ liệu thành công.', 'old_user_id', v_old_user_id);

exception
    when others then
        return json_build_object('success', false, 'error_code', 'SYSTEM_ERROR', 'message', sqlerrm);
end;
$$;

revoke execute on function public.merge_legacy_account(uuid) from public;
grant execute on function public.merge_legacy_account(uuid) to authenticated;
