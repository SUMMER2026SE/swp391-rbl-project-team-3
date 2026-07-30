-- ============================================================================
-- A) Bổ sung khoá ngoại còn thiếu   B) Xoá 4 bảng chết
--
-- Bối cảnh: `service_tickets.technician_id` là TEXT và KHÔNG có khoá ngoại, nên
-- khi xoá tài khoản KTV test (2026-07-30) một phiếu thủ thuật đã hoàn thành bị
-- mồ côi âm thầm — database không hề chặn. Migration này đóng đúng lỗ hổng đó.
--
-- Đã kiểm chứng trên dữ liệu thật trước khi viết:
--   * invoices.patient_id            : 46/46 là UUID hợp lệ, 0 mồ côi  -> ép được
--   * service_tickets.technician_id  : 22 UUID hợp lệ + 1 NULL, 0 mồ côi -> ép được
--   * feedbacks.technician_id        : đã là uuid, 0 mồ côi -> thêm FK thẳng
--   * chat_sessions.patient_id       : 82/82 dùng tiền tố 'pat-guest-...' nên
--     KHÔNG thể thêm FK — đây là thiết kế cố ý cho chat khách vãng lai (giống
--     messages.patient_id). Bỏ qua có chủ đích.
--
-- Quy tắc xoá: technician_id dùng ON DELETE SET NULL (xoá KTV thì giữ lại kết
-- quả thủ thuật, chỉ gỡ tham chiếu — đúng tình huống vừa xảy ra).
-- invoices.patient_id để mặc định NO ACTION: chặn xoá bệnh nhân còn hoá đơn,
-- bảo vệ dấu vết tài chính thay vì xoá dây chuyền.
-- ============================================================================

-- ── A1. invoices.patient_id : text -> uuid + FK ──
-- Policy inv_select đang so sánh auth.uid()::text = patient_id, phải bỏ trước
-- khi đổi kiểu rồi tạo lại đúng kiểu uuid.
drop policy if exists "inv_select" on public.invoices;

alter table public.invoices
  alter column patient_id type uuid using case when patient_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then patient_id::uuid else null end;

alter table public.invoices
  drop constraint if exists invoices_patient_id_fkey;
alter table public.invoices
  add constraint invoices_patient_id_fkey
  foreign key (patient_id) references public.patient_profiles(patient_id);

create policy "inv_select" on public.invoices
  for select using (
    auth.uid() = patient_id
    or public.current_role_id() in (1,2,3,4)
  );

-- ── A2. service_tickets.technician_id : text -> uuid + FK (SET NULL) ──
alter table public.service_tickets
  alter column technician_id type uuid using case when technician_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then technician_id::uuid else null end;

alter table public.service_tickets
  drop constraint if exists service_tickets_technician_id_fkey;
alter table public.service_tickets
  add constraint service_tickets_technician_id_fkey
  foreign key (technician_id) references public.users(user_id) on delete set null;

-- ── A3. feedbacks.technician_id : đã là uuid, chỉ thêm FK ──
alter table public.feedbacks
  drop constraint if exists feedbacks_technician_id_fkey;
alter table public.feedbacks
  add constraint feedbacks_technician_id_fkey
  foreign key (technician_id) references public.users(user_id) on delete set null;

-- ── A4. Cập nhật RPC gộp tài khoản: bỏ ép ::text cho invoices ──
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
    if v_current_user_id is null then
        return json_build_object('success', false, 'error_code', 'UNAUTHORIZED',
            'message', 'Vui lòng đăng nhập để thực hiện thao tác này.');
    end if;

    select email into v_email from auth.users where id = v_current_user_id;
    if v_email is null then
        return json_build_object('success', false, 'error_code', 'UNAUTHORIZED',
            'message', 'Không xác định được email tài khoản hiện tại.');
    end if;

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

    if v_old_user_id is null then
        return json_build_object('success', true, 'merged', false, 'error_code', 'NO_LEGACY',
            'message', 'Không có tài khoản cũ cần gộp.');
    end if;

    if v_old_user_id = v_current_user_id then
        return json_build_object('success', false, 'error_code', 'INVALID_MERGE',
            'message', 'Không thể gộp tài khoản vào chính nó.');
    end if;

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

    update public.users
       set email = v_email || '_merged_' || v_old_user_id::text
     where user_id = v_old_user_id;

    insert into public.users (user_id, role_id, email, full_name, phone, gender, date_of_birth, status)
    values (v_current_user_id, 5, v_email, coalesce(v_old_name, 'Bệnh nhân'),
            v_old_phone, coalesce(v_old_gender, 'Khác'), v_old_dob, 'ACTIVE')
    on conflict (user_id) do nothing;

    insert into public.patient_profiles (patient_id, address, allergy_note, medical_history,
                                         emergency_contact, blood_type, height, weight)
    select v_current_user_id, address, allergy_note, medical_history,
           emergency_contact, blood_type, height, weight
      from public.patient_profiles where patient_id = v_old_user_id
    on conflict (patient_id) do nothing;
    insert into public.patient_profiles (patient_id)
    values (v_current_user_id) on conflict (patient_id) do nothing;

    update public.appointments     set patient_id = v_current_user_id where patient_id = v_old_user_id;
    update public.medical_records  set patient_id = v_current_user_id where patient_id = v_old_user_id;
    update public.feedbacks        set patient_id = v_current_user_id where patient_id = v_old_user_id;
    update public.payments         set patient_id = v_current_user_id where patient_id = v_old_user_id;
    update public.ai_skin_analyses set patient_id = v_current_user_id where patient_id = v_old_user_id;
    update public.prescriptions    set patient_id = v_current_user_id where patient_id = v_old_user_id;
    update public.skin_images      set patient_id = v_current_user_id where patient_id = v_old_user_id;
    -- invoices.patient_id gio da la uuid (khong con ep ::text)
    update public.invoices         set patient_id = v_current_user_id where patient_id = v_old_user_id;

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

-- ============================================================================
-- B) Xoá 4 bảng chết: 0 dòng dữ liệu VÀ 0 dòng code tham chiếu.
--    Bảng con xoá trước để không vướng khoá ngoại nội bộ.
--    (lab_tests / treatment_plans thuộc phân hệ xét nghiệm & phác đồ chưa từng
--     được xây dựng — luồng cận lâm sàng hiện chạy qua service_tickets.)
-- ============================================================================
drop table if exists public.lab_test_results;
drop table if exists public.treatment_procedures;
drop table if exists public.lab_tests;
drop table if exists public.treatment_plans;
