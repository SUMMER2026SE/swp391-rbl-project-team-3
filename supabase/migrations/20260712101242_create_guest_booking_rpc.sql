-- ============================================================================
-- Guest booking via SECURITY DEFINER RPCs — closes the guest-anchor PII leak.
--
-- Schema corrections vs. the original draft (verified live):
--   • PK is appointment_id (integer sequence), NOT id / NOT uuid.
--   • The free-text column is `reason`, NOT `notes`.
-- Hardening vs. the original draft:
--   • p_anchor_id is VALIDATED against the fixed guest anchor — otherwise any
--     anonymous caller could use this definer function to insert appointments
--     impersonating an arbitrary patient_id.
--   • p_status is whitelisted (anon must not mint 'Đã thanh toán' etc.).
--   • A second RPC covers the guest hold → confirm step: with the read policy
--     gone, the old UPDATE ... RETURNING path fails RLS the same way inserts
--     did, so confirms must also run server-side.
-- ============================================================================

-- 1a. Atomic guest booking (INSERT). Race → unique_violation → SLOT_TAKEN.
create or replace function public.book_guest_appointment(
    p_anchor_id uuid,
    p_doctor_id uuid,
    p_appointment_date date,
    p_start_time time,
    p_end_time time,
    p_guest_name text,
    p_guest_phone text,
    p_notes text default null,
    p_service text default null,
    p_fee text default null,
    p_status text default 'Chờ xác nhận'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_new_appointment_id integer;
begin
    if p_anchor_id is distinct from '18504773-0f51-405a-aa32-70cae403be6e'::uuid then
        return json_build_object('success', false, 'error_code', 'INVALID_ANCHOR',
            'message', 'Đặt lịch khách vãng lai chỉ được phép qua tài khoản guest chung.');
    end if;

    if p_status not in ('Đang giữ chỗ', 'Chờ xác nhận', 'Đã xác nhận') then
        return json_build_object('success', false, 'error_code', 'INVALID_STATUS',
            'message', 'Trạng thái đặt lịch không hợp lệ.');
    end if;

    -- Satisfy the appointments.patient_id FK chain.
    insert into public.patient_profiles (patient_id)
    values (p_anchor_id)
    on conflict (patient_id) do nothing;

    insert into public.appointments (
        patient_id, doctor_id, appointment_date, start_time,
        end_time, patient_name, patient_phone, status, reason, service, fee
    ) values (
        p_anchor_id, p_doctor_id, p_appointment_date, p_start_time,
        p_end_time, p_guest_name, p_guest_phone, p_status, p_notes, p_service, p_fee
    )
    returning appointment_id into v_new_appointment_id;

    return json_build_object('success', true, 'appointment_id', v_new_appointment_id);

exception
    when unique_violation then
        return json_build_object('success', false, 'error_code', 'SLOT_TAKEN',
            'message', 'Lịch khám đã bị người khác đặt. Vui lòng chọn giờ khác.');
    when others then
        return json_build_object('success', false, 'error_code', 'SYSTEM_ERROR', 'message', sqlerrm);
end;
$$;

-- 1b. Guest hold → confirm (UPDATE). Only anchor rows, only from a hold state.
--     Racing confirms on the same slot hit the partial unique index → SLOT_TAKEN.
create or replace function public.confirm_guest_appointment(
    p_appointment_id integer,
    p_guest_name text default null,
    p_guest_phone text default null,
    p_status text default 'Đã xác nhận'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
    if p_status not in ('Chờ xác nhận', 'Đã xác nhận') then
        return json_build_object('success', false, 'error_code', 'INVALID_STATUS',
            'message', 'Trạng thái xác nhận không hợp lệ.');
    end if;

    update public.appointments
       set status        = p_status,
           patient_name  = coalesce(p_guest_name, patient_name),
           patient_phone = coalesce(p_guest_phone, patient_phone)
     where appointment_id = p_appointment_id
       and patient_id = '18504773-0f51-405a-aa32-70cae403be6e'::uuid
       and status in ('Đang giữ chỗ', 'Chờ xác nhận');

    if not found then
        return json_build_object('success', false, 'error_code', 'NOT_FOUND',
            'message', 'Không tìm thấy giữ chỗ hợp lệ để xác nhận.');
    end if;

    return json_build_object('success', true, 'appointment_id', p_appointment_id);

exception
    when unique_violation then
        return json_build_object('success', false, 'error_code', 'SLOT_TAKEN',
            'message', 'Lịch khám đã bị người khác đặt. Vui lòng chọn giờ khác.');
    when others then
        return json_build_object('success', false, 'error_code', 'SYSTEM_ERROR', 'message', sqlerrm);
end;
$$;

-- 2. Lock down execution permissions.
revoke execute on function public.book_guest_appointment from public;
grant execute on function public.book_guest_appointment to anon, authenticated;
revoke execute on function public.confirm_guest_appointment from public;
grant execute on function public.confirm_guest_appointment to anon, authenticated;

-- 3. Close the PII loophole: anon no longer needs ANY direct access to
--    guest-anchor rows — reads and writes both go through the RPCs.
drop policy if exists "guest_anchor_read" on public.appointments;
drop policy if exists "guest_anchor_update" on public.appointments;
