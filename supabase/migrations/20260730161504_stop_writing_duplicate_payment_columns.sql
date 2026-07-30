-- Ngung ghi 2 cot TRUNG LAP cua bang payments trong 3 RPC guest.
--   payments.method  === payments.payment_method
--   payments.status  === payments.payment_status
-- 42/42 dong du lieu luon giong het nhau; moi cho doc deu dung cot chuan
-- (payment_method / payment_status) hoac da co fallback.
--
-- Dinh nghia ham lay NGUYEN VEN tu database dang chay (pg_get_functiondef),
-- chi bo dung 2 cot thua trong cau INSERT.
-- Cac cot se DROP o migration sau, CHI SAU KHI frontend da deploy len Vercel.

CREATE OR REPLACE FUNCTION public.book_guest_appointment(p_anchor_id uuid, p_doctor_id uuid, p_appointment_date date, p_start_time time without time zone, p_end_time time without time zone, p_guest_name text, p_guest_phone text, p_notes text DEFAULT NULL::text, p_service text DEFAULT NULL::text, p_fee text DEFAULT NULL::text, p_status text DEFAULT 'Chờ xác nhận'::text, p_deposit_amount numeric DEFAULT 0, p_payment_method text DEFAULT 'CHUYEN_KHOAN'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
            deposit_amount, payment_method, payment_status
        ) values (
            p_anchor_id, v_new_appointment_id, p_deposit_amount, 0, p_deposit_amount,
            p_deposit_amount, p_payment_method, 'PENDING'
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
$function$;

CREATE OR REPLACE FUNCTION public.confirm_guest_appointment(p_appointment_id integer, p_guest_name text DEFAULT NULL::text, p_guest_phone text DEFAULT NULL::text, p_status text DEFAULT 'Đã xác nhận'::text, p_deposit_amount numeric DEFAULT 0, p_payment_method text DEFAULT 'QR Code'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
            deposit_amount, payment_method, payment_status
        ) values (
            v_patient_id, p_appointment_id, p_deposit_amount, 0, p_deposit_amount,
            p_deposit_amount, p_payment_method, 'PENDING'
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
$function$;

CREATE OR REPLACE FUNCTION public.reschedule_guest_appointment(p_appointment_id integer, p_anchor_id uuid, p_new_date date, p_new_start_time time without time zone, p_new_end_time time without time zone, p_new_doctor_id uuid DEFAULT NULL::uuid, p_surcharge_amount numeric DEFAULT 0, p_payment_method text DEFAULT 'QR Code'::text, p_reason text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    v_new_payment_id integer;
    v_count          integer;
    v_status         text;
begin
    if p_anchor_id is distinct from '18504773-0f51-405a-aa32-70cae403be6e'::uuid then
        return json_build_object('success', false, 'error_code', 'INVALID_ANCHOR',
            'message', 'Yeu cau khong hop le.');
    end if;

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

    -- Record the within-24h surcharge atomically, accumulating onto an existing
    -- payments row (e.g. the booking deposit) instead of violating
    -- UNIQUE(appointment_id).
    if p_surcharge_amount > 0 then
        insert into public.payments (
            patient_id, appointment_id, total_amount, discount_amount, final_amount,
            payment_method, payment_status
        ) values (
            p_anchor_id, p_appointment_id, p_surcharge_amount, 0, p_surcharge_amount,
            p_payment_method, 'PENDING'
        )
        on conflict (appointment_id) do update
           set total_amount = public.payments.total_amount + excluded.total_amount,
               final_amount = public.payments.final_amount + excluded.final_amount
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
$function$;
