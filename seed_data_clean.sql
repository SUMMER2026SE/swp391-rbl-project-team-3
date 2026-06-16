-- =====================================================================
-- KỊCH BẢN INSERT DỮ LIỆU MẪU (BỎ QUA PHẦN USERS ĐỂ TRÁNH LỖI UUID)
-- =====================================================================
-- Hướng dẫn: Mở Supabase -> SQL Editor -> Dán toàn bộ nội dung này và chạy.

-- 1. SERVICES (Dịch vụ khám)
INSERT INTO services (service_name, description, price, duration_minutes) VALUES
('General Skin Consultation', 'Initial checkup and consultation for general skin issues.', 300000.00, 30),
('Acne Treatment', 'Comprehensive acne treatment including extraction and light therapy.', 800000.00, 60),
('Laser Hair Removal', 'Permanent hair reduction using advanced laser technology.', 1500000.00, 45),
('Scar Revision Therapy', 'Treatment for reducing acne scars or surgical scars.', 2000000.00, 60)
ON CONFLICT DO NOTHING;

-- 2. MEDICINES (Thuốc)
INSERT INTO medicines (medicine_name, description) VALUES
('Hydrocortisone 1% Cream', 'Mild topical steroid for inflammation'),
('Isotretinoin 20mg', 'Oral medication for severe acne'),
('Cetirizine 10mg', 'Antihistamine for allergy relief')
ON CONFLICT DO NOTHING;

-- 3. VOUCHERS (Mã giảm giá)
INSERT INTO vouchers (discount_type, discount_value, start_date, end_date, status) VALUES
('PERCENTAGE', 10.00, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '30 days', 'ACTIVE'),
('FIXED', 50000.00, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '30 days', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- LƯU Ý QUAN TRỌNG VỀ BẢNG USERS, PATIENTS, DOCTORS:
-- Dữ liệu mẫu (Insert users id 1, 2, 3...) của bạn sẽ BỊ LỖI trên hệ thống vì 
-- Supabase yêu cầu user_id phải là kiểu chuỗi UUID và phải được tạo thông qua tính năng Authentication.
-- Bạn có thể chạy file scripts/seed-test-data.mjs (ở local) để tự động tạo Bác sĩ và Lễ tân bằng API một cách hợp lệ!
