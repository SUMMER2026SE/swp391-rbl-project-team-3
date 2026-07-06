# Dermatology Clinic Management System (Hệ thống Quản lý Phòng khám Da liễu)

Dự án phát triển hệ thống quản lý phòng khám da liễu thông minh (SWP391), tích hợp chatbot AI hỗ trợ đặt lịch khám, soi da, tư vấn dịch vụ và kết nối trực tiếp với nhân viên lễ tân.

---

## 🤖 Hướng dẫn Cấu hình Chatbot AI (Supabase Edge Function)

Hệ thống chatbot của dự án sử dụng **Google Gemini API** (`gemini-2.5-flash`) thông qua **Supabase Edge Function** (`chat-bot`). Việc gọi API ở phía backend giúp bảo mật API Key tối đa và cho phép các thành viên khác trong nhóm dễ dàng tải dự án từ GitHub về chạy mà không gặp lỗi.

### 1. Cách thiết lập biến môi trường cục bộ (Local Environment)

Khi clone dự án về, bạn cần cấu hình các biến môi trường để chạy cả Frontend và Edge Function.

#### Bước 1: Cấu hình Frontend
1. Nhân bản file `.env.example` ở thư mục gốc thành `.env.local` (nếu chưa có):
   ```bash
   cp .env.example .env.local
   ```
2. Điền thông tin kết nối Supabase của bạn:
   ```env
   VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```

#### Bước 2: Cấu hình Backend Edge Function
1. Tạo một file `.env` nằm trong thư mục `supabase/` (đường dẫn: `supabase/.env`):
   ```env
   CHATBOT_API_KEY=AIzaSy... (Điền Google Gemini API Key của bạn vào đây)
   ```
   *Lưu ý: Thư mục `supabase/.env` đã được cấu hình trong `.gitignore` để không bị đẩy lên GitHub.*

### 2. Cách lấy Google Gemini API Key miễn phí
1. Truy cập vào [Google AI Studio](https://aistudio.google.com/).
2. Đăng nhập bằng tài khoản Google của bạn.
3. Nhấn vào **Get API Key** và tạo một API Key mới.
4. Copy mã API Key vừa tạo (thường bắt đầu bằng `AIzaSy...`) và paste vào biến `CHATBOT_API_KEY` trong file `supabase/.env`.

### 3. Cách chạy dự án dưới máy Local

#### Chạy Frontend
Cài đặt các dependencies và chạy server phát triển của Vite:
```bash
npm install
npm run dev
```

#### Chạy Supabase Edge Functions Local (Giả lập)
Nếu bạn muốn kiểm tra hoặc chỉnh sửa chatbot cục bộ:
1. Đảm bảo đã cài đặt [Docker](https://www.docker.com/) và Docker đang chạy.
2. Khởi động Supabase local:
   ```bash
   supabase start
   ```
3. Chạy trình giả lập Edge Function cục bộ:
   ```bash
   supabase functions serve chat-bot --env-file supabase/.env --no-verify-jwt
   ```
   *Lúc này, Frontend của bạn khi gọi `supabase.functions.invoke('chat-bot')` sẽ tự động chuyển tiếp cuộc gọi đến Edge Function đang chạy ở cổng local `54321`.*

### 4. Cách đưa Edge Function lên môi trường Production (Supabase Cloud)

Khi deploy dự án thực tế, bạn cần làm 2 việc:
1. **Đặt Secret Key lên Supabase**:
   ```bash
   supabase secrets set CHATBOT_API_KEY=AIzaSy...
   ```
2. **Deploy Edge Function**:
   ```bash
   supabase functions deploy chat-bot --no-verify-jwt
   ```

---

## 🔒 Quy tắc đẩy mã nguồn lên GitHub an toàn

Để bảo vệ thông tin cá nhân và tránh lộ API keys:
1. **Tuyệt đối không commit** các file sau lên GitHub:
   - `.env`
   - `.env.local`
   - `supabase/.env`
2. Các file này đã được thêm vào `.gitignore`. Khi đẩy code lên, bạn chỉ cần chạy lệnh git thông thường:
   ```bash
   git add .
   git commit -m "feat: migrate chatbot logic to secure supabase edge function"
   git push origin main
   ```
3. Thành viên khác khi tải code về chỉ cần thực hiện theo mục **1. Cách thiết lập biến môi trường cục bộ** phía trên là có thể sử dụng chatbot bình thường.