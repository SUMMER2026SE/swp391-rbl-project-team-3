-- Thêm cột patient_name và patient_phone vào bảng appointments để không cần join
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS patient_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS patient_phone VARCHAR(20);

-- Cập nhật patient_name cho các lịch hẹn cũ dựa trên bảng users (nếu có user_id)
UPDATE public.appointments
SET patient_name = u.full_name
FROM public.users u
WHERE public.appointments.patient_id = u.user_id::uuid
  AND public.appointments.patient_name IS NULL;
