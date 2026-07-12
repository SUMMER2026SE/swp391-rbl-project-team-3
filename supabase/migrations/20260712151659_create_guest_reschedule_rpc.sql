-- ============================================================================
-- Guest reschedule + surcharge — atomic SECURITY DEFINER RPC.
-- Closes the last anon silent-failure: anon can't UPDATE appointments or INSERT
-- payments, so the whole reschedule (time move + optional within-24h surcharge)
-- runs server-side in one transaction.
--
-- Schema facts applied (NOT the template's):
--   * payments has NO `payment_type` and NO `amount` column -> total_amount +
--     final_amount (both NOT NULL); PK payment_id is INTEGER -> RETURNING payment_id.
--   * appointment_id is INTEGER; anchor is 18504773-... (reused receptionist row).
-- Enhancements over the template:
--   * p_new_doctor_id (the reschedule flow allows moving to another doctor).
--   * max-2-reschedule guard + reschedule_count increment (parity with the
--     authenticated reschedule business rule).
--   * A racing new slot hits the partial unique index -> SLOT_TAKEN.
-- ============================================================================

create or replace function public.reschedule_guest_appointment(
    p_appointment_id integer,
    p_anchor_id uuid,
    p_new_date date,
    p_new_start_time time,
    p_new_end_time time,
    p_new_doctor_id uuid default null,
    p_surcharge_amount numeric default 0,
    p_payment_method text default 'QR Code',
    p_reason text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_new_payment_id integer;
    v_count          integer;
    v_status         text;
begin
    -- 1. Only the shared guest anchor may be rescheduled through this RPC.
    if p_anchor_id is distinct from '18504773-0f51-405a-aa32-70cae403be6e'::uuid then
        return json_build_object('success', false, 'error_code', 'INVALID_ANCHOR',
            'message', 'Yeu cau khong hop le.');
    end if;

    -- 2. Locate the appointment (anchor-owned) and enforce the max-2 rule.
    select reschedule_count into v_count
      from public.appointments
     where appointment_id = p_appointment_id
       and patient_id = p_anchor_id;

    if not found then
        return json_build_object('success', false, 'error_code', 'NOT_FOUND',
            'message', 'Khong tim thay lich hen hop le de doi.');
    end if;

    if v_count >= 2 then
        return json_build_object('success', false, 'error_code', 'MAX_RESCHEDULE',
            'message', 'Ban da doi lich toi da 2 lan cho cuoc hen nay.');
    end if;

    -- 3. Move the appointment (new slot conflict -> unique_violation -> SLOT_TAKEN).
    update public.appointments
       set appointment_date = p_new_date,
           start_time       = p_new_start_time,
           end_time         = p_new_end_time,
           doctor_id        = coalesce(p_new_doctor_id, doctor_id),
           reason           = coalesce(p_reason, reason),
           status           = 'Đã xác nhận',
           reschedule_count = reschedule_count + 1
     where appointment_id = p_appointment_id
       and patient_id = p_anchor_id
    returning status into v_status;

    if v_status is null then
        return json_build_object('success', false, 'error_code', 'NOT_FOUND',
            'message', 'Khong tim thay lich hen hop le de doi.');
    end if;

    -- 4. Record the within-24h surcharge atomically (partial -> PENDING).
    if p_surcharge_amount > 0 then
        insert into public.payments (
            patient_id, appointment_id, total_amount, discount_amount, final_amount,
            payment_method, payment_status, method, status
        ) values (
            p_anchor_id, p_appointment_id, p_surcharge_amount, 0, p_surcharge_amount,
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
            'message', 'Lich kham moi da bi nguoi khac dat. Vui long chon gio khac.');
    when others then
        return json_build_object('success', false, 'error_code', 'SYSTEM_ERROR', 'message', sqlerrm);
end;
$$;

revoke execute on function public.reschedule_guest_appointment(integer,uuid,date,time,time,uuid,numeric,text,text) from public;
grant  execute on function public.reschedule_guest_appointment(integer,uuid,date,time,time,uuid,numeric,text,text) to anon, authenticated;
