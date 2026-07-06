[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/r92bbHwx)

# Dermatology Clinic Management System (Hệ thống Quản lý Phòng khám Da liễu)

Dự án phát triển hệ thống quản lý phòng khám da liễu thông minh (SWP391), tích hợp chatbot AI hỗ trợ đặt lịch khám, soi da, tư vấn dịch vụ và kết nối trực tiếp với nhân viên lễ tân.

---

## 🤖 Hướng dẫn Chạy Dự án & Sử dụng Chatbot AI

Hệ thống chatbot của dự án sử dụng **Google Gemini AI** thông qua **Supabase Edge Function** đã được triển khai sẵn trên máy chủ dùng chung. Bạn **không cần** tự đăng ký API Key hay cài đặt môi trường chạy AI phức tạp dưới máy local.

### 1. Thiết lập biến môi trường (Chỉ làm lần đầu)

Khi clone dự án về máy, bạn cần cấu hình thông tin kết nối tới hệ thống dữ liệu dùng chung của nhóm:

1. Nhân bản file `.env.example` ở thư mục gốc và đổi tên thành `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Mở file `.env.local` vừa tạo và điền thông tin kết nối Supabase dùng chung của nhóm (liên hệ trưởng nhóm để lấy thông tin này):
   ```env
   VITE_SUPABASE_URL=https://nmcnwoqkikfmyjxwnfer.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   ```

### 2. Khởi động ứng dụng

Sau khi đã thiết lập file `.env.local`, bạn có thể chạy dự án bình thường:

```bash
# Cài đặt các thư viện cần thiết
npm install

# Khởi chạy giao diện phát triển
npm run dev
```

Mở trình duyệt theo địa chỉ local hiển thị trên terminal (thường là `http://localhost:5173`) để trải nghiệm hệ thống và chat thử với AI chatbot ở góc dưới màn hình.

---

## 🔒 Quy tắc đẩy mã nguồn lên GitHub an toàn

Để bảo vệ thông tin bảo mật của dự án:
1. **Không commit** file `.env.local` lên GitHub. File này đã được thêm vào `.gitignore` tự động.
2. Khi chỉnh sửa xong code, bạn tiến hành push code như bình thường:
   ```bash
   git add .
   git commit -m "commit message của bạn"
   git push origin main
   ```