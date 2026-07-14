-- ============================================================================
-- Deposit tracking on payments — restores the "deduct booking deposit at the
-- cashier desk" behaviour that regressed when BillingCheckout hardcoded
-- `prior = 0` (commit 6c3de08).
--
-- Problem: `payments` is one accumulated row per appointment (UNIQUE
-- appointment_id) and has no transaction-type column, so a 50k walk-in booking
-- deposit and a 50k within-24h reschedule surcharge are indistinguishable.
-- A deposit is a PREPAYMENT toward the bill (must be deducted at settlement);
-- a surcharge is an EXTRA charge already collected (must NOT be deducted).
--
-- Solution: `payments.deposit_amount` accumulates only the deposit portion.
--   * client addPayment threads it through (walk-in booking deposit),
--   * guest booking RPCs stamp it on their atomic deposit insert,
--   * the reschedule surcharge paths leave it at 0.
-- The cashier then computes: net payable = bill total − deposit_amount − voucher.
--
-- Also fixed here: reschedule_guest_appointment inserted the surcharge row
-- blindly — if a payments row already existed for the appointment (e.g. a
-- deposit), the UNIQUE(appointment_id) violation was caught by the generic
-- handler and surfaced as a bogus SLOT_TAKEN, rolling back the whole
-- reschedule. The surcharge now upserts (accumulates) instead.
-- ============================================================================

alter table public.payments
  add column if not exists deposit_amount numeric not null default 0;

-- ── book_guest_appointment: stamp deposit_amount on the atomic deposit row ──
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
            deposit_amount, payment_method, payment_status, method, status
        ) values (
            p_anchor_id, v_new_appointment_id, p_deposit_amount, 0, p_deposit_amount,
            p_deposit_amount, p_payment_method, 'PENDING', p_payment_method, 'PENDING'
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

-- ── confirm_guest_appointment: same deposit stamp on the hold→confirm path ──
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
            deposit_amount, payment_method, payment_status, method, status
        ) values (
            v_patient_id, p_appointment_id, p_deposit_amount, 0, p_deposit_amount,
            p_deposit_amount, p_payment_method, 'PENDING', p_payment_method, 'PENDING'
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

-- ── reschedule_guest_appointment: surcharge must UPSERT, not INSERT ─────────
-- (an existing deposit row on the appointment previously turned the surcharge
-- insert into a UNIQUE violation → bogus SLOT_TAKEN → whole reschedule rolled
-- back). deposit_amount is intentionally NOT touched: a surcharge is not a
-- prepayment toward the bill.
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
            payment_method, payment_status, method, status
        ) values (
            p_anchor_id, p_appointment_id, p_surcharge_amount, 0, p_surcharge_amount,
            p_payment_method, 'PENDING', p_payment_method, 'PENDING'
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
$$;
