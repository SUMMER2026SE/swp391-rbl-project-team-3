-- ============================================================================
-- Guest deposit recording: extend the guest booking RPCs to write the payments
-- row atomically (anon has no INSERT on payments after the RLS lockdown).
--
-- Corrections vs. the provided template (verified live; the template would fail
-- 100% into SYSTEM_ERROR):
--   * NO `amount` column      -> total_amount + final_amount (both NOT NULL).
--   * NO `payment_type` column -> dropped.
--   * PK is payment_id INTEGER -> RETURNING payment_id (INTEGER), not id/uuid.
--   * Anchor is the real guest anchor 18504773-... (the receptionist row we
--     reuse), NOT the zero-uuid, which would reject EVERY guest booking.
--   * The deployed function is 11-arg (p_service/p_fee/p_status); adding params
--     changes the signature, so DROP the old one first to avoid an ambiguous
--     overload, then recreate keeping ALL prior params and behaviour.
--
-- The deposit in the live hold->confirm UI flow is collected at CONFIRM, so the
-- payment insert is added to BOTH RPCs: book_guest_appointment (direct/one-shot)
-- and confirm_guest_appointment (the hold->confirm path the frontend uses).
-- ============================================================================

drop function if exists public.book_guest_appointment(uuid,uuid,date,time,time,text,text,text,text,text,text);
drop function if exists public.confirm_guest_appointment(integer,text,text,text);

-- book_guest_appointment (+ optional deposit)
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
    p_status text default 'Chờ xác nhận',
    p_deposit_amount numeric default 0,
    p_payment_method text default 'CHUYEN_KHOAN'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_new_appointment_id integer;
    v_new_payment_id     integer;
begin
    if p_anchor_id is distinct from '18504773-0f51-405a-aa32-70cae403be6e'::uuid then
        return json_build_object('success', false, 'error_code', 'INVALID_ANCHOR',
            'message', 'Dat lich khach vang lai chi duoc phep qua tai khoan guest chung.');
    end if;

    if p_status not in ('Đang giữ chỗ', 'Chờ xác nhận', 'Đã xác nhận') then
        return json_build_object('success', false, 'error_code', 'INVALID_STATUS',
            'message', 'Trang thai dat lich khong hop le.');
    end if;

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

    -- Atomic deposit record (partial -> PENDING; does not flip appointment status).
    if p_deposit_amount > 0 then
        insert into public.payments (
            patient_id, appointment_id, total_amount, discount_amount, final_amount,
            payment_method, payment_status, method, status
        ) values (
            p_anchor_id, v_new_appointment_id, p_deposit_amount, 0, p_deposit_amount,
            p_payment_method, 'PENDING', p_payment_method, 'PENDING'
        )
        returning payment_id into v_new_payment_id;
    end if;

    return json_build_object('success', true,
        'appointment_id', v_new_appointment_id,
        'payment_id', v_new_payment_id);

exception
    when unique_violation then
        return json_build_object('success', false, 'error_code', 'SLOT_TAKEN',
            'message', 'Lich kham da bi nguoi khac dat. Vui long chon gio khac.');
    when others then
        return json_build_object('success', false, 'error_code', 'SYSTEM_ERROR', 'message', sqlerrm);
end;
$$;

-- confirm_guest_appointment (+ optional deposit; this is where the hold->confirm
-- UI actually collects the deposit)
create or replace function public.confirm_guest_appointment(
    p_appointment_id integer,
    p_guest_name text default null,
    p_guest_phone text default null,
    p_status text default 'Đã xác nhận',
    p_deposit_amount numeric default 0,
    p_payment_method text default 'QR Code'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_patient_id     uuid;
    v_new_payment_id integer;
begin
    if p_status not in ('Chờ xác nhận', 'Đã xác nhận') then
        return json_build_object('success', false, 'error_code', 'INVALID_STATUS',
            'message', 'Trang thai xac nhan khong hop le.');
    end if;

    update public.appointments
       set status        = p_status,
           patient_name  = coalesce(p_guest_name, patient_name),
           patient_phone = coalesce(p_guest_phone, patient_phone)
     where appointment_id = p_appointment_id
       and patient_id = '18504773-0f51-405a-aa32-70cae403be6e'::uuid
       and status in ('Đang giữ chỗ', 'Chờ xác nhận')
    returning patient_id into v_patient_id;

    if v_patient_id is null then
        return json_build_object('success', false, 'error_code', 'NOT_FOUND',
            'message', 'Khong tim thay giu cho hop le de xac nhan.');
    end if;

    -- Record the deposit atomically (only once).
    if p_deposit_amount > 0
       and not exists (select 1 from public.payments where appointment_id = p_appointment_id) then
        insert into public.payments (
            patient_id, appointment_id, total_amount, discount_amount, final_amount,
            payment_method, payment_status, method, status
        ) values (
            v_patient_id, p_appointment_id, p_deposit_amount, 0, p_deposit_amount,
            p_payment_method, 'PENDING', p_payment_method, 'PENDING'
        )
        returning payment_id into v_new_payment_id;
    end if;

    return json_build_object('success', true,
        'appointment_id', p_appointment_id,
        'payment_id', v_new_payment_id);

exception
    when unique_violation then
        return json_build_object('success', false, 'error_code', 'SLOT_TAKEN',
            'message', 'Lich kham da bi nguoi khac dat. Vui long chon gio khac.');
    when others then
        return json_build_object('success', false, 'error_code', 'SYSTEM_ERROR', 'message', sqlerrm);
end;
$$;

-- Re-grant (DROP removed the old grants).
revoke execute on function public.book_guest_appointment(uuid,uuid,date,time,time,text,text,text,text,text,text,numeric,text) from public;
grant  execute on function public.book_guest_appointment(uuid,uuid,date,time,time,text,text,text,text,text,text,numeric,text) to anon, authenticated;
revoke execute on function public.confirm_guest_appointment(integer,text,text,text,numeric,text) from public;
grant  execute on function public.confirm_guest_appointment(integer,text,text,text,numeric,text) to anon, authenticated;
