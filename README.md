[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/r92bbHwx)

# DermaSmart - Dermatology Clinic Management System

DermaSmart là hệ thống quản lý phòng khám da liễu toàn diện dành cho các cơ sở y tế và thẩm mỹ da liễu. Hệ thống tích hợp các công nghệ thông minh bao gồm trợ lý lễ tân ảo (DermaBot), trợ lý ghi chép bệnh án y khoa (Ambient Scribe) bằng mô hình ngôn ngữ lớn (Gemini), và module tự động phân tích tình trạng da mặt (MediaPipe & Gemini).

Dự án được xây dựng với mô hình tách biệt rõ ràng giữa giao diện Client (React) và cơ sở dữ liệu (Supabase) thông qua chính sách Row-Level Security (RLS) nghiêm ngặt để bảo vệ dữ liệu bệnh lý của bệnh nhân.

---

## 🛠️ Công nghệ cốt lõi

*   **Frontend**: React 18, Vite, React Router v7, Tailwind CSS, Framer Motion (hiệu ứng kính mờ - liquid glass).
*   **Database & Backend**: Supabase (PostgreSQL, Storage, Edge Functions, Realtime).
*   **AI & Computer Vision**:
    *   `@mediapipe/tasks-vision` hỗ trợ định vị vùng khuôn mặt trực tiếp tại trình duyệt.
    *   `@google/generative-ai` (thực thi thông qua Supabase Edge Functions để bảo mật API Key) đảm trách xử lý ngôn ngữ tự nhiên cho chatbot và ghi chép bệnh án.
*   **Thanh toán**: Tích hợp cổng thanh toán trực tuyến PayOS cho các giao dịch đặt cọc lịch khám.

---

## 📋 Tính năng phân quyền (5 Vai trò)

Hệ thống phân quyền chi tiết dựa trên `role_id` và các RLS policies trong cơ sở dữ liệu:

### 1. Bệnh nhân (Patient / Khách vãng lai)
*   **Đặt lịch khám trực tuyến**: Người dùng có thể chọn bác sĩ, dịch vụ và khung giờ mong muốn. Hỗ trợ đặt lịch cho cả bệnh nhân đã đăng ký tài khoản và khách vãng lai (áp dụng RPC để tránh tranh chấp slot khám trùng lặp trên DB).
*   **Soi da mặt AI (Free Skin Scan)**: Tải ảnh chụp khuôn mặt lên hệ thống để phân tích màu sắc ảnh và nhận diện các vấn đề về da (mụn trứng cá, mụn mủ, mụn sẩn, thâm nám, lỗ chân lông to, nếp nhăn, v.v.). Kết quả phân tích được lưu trữ an toàn tại Storage Bucket riêng tư (`skin-scans`) và hiển thị qua đường dẫn có thời hạn (signed URL). Để tối ưu lưu trữ, hệ thống tự động giới hạn tối đa 4 lượt quét gần nhất trên mỗi bệnh nhân.
*   **Trò chuyện với DermaBot**: Chatbot hỗ trợ giải đáp các thắc mắc về bảng giá dịch vụ, phí khám và thông tin bác sĩ. Người dùng có thể chuyển hướng cuộc trò chuyện trực tiếp đến nhân viên lễ tân khi cần.

### 2. Bác sĩ (Doctor)
*   **Bệnh án điện tử (EMR)**: Xem lịch sử bệnh lý, tạo hồ sơ chẩn đoán, ghi nhận triệu chứng và kê đơn thuốc cho bệnh nhân.
*   **Chỉ định kỹ thuật**: Ra chỉ định dịch vụ trị liệu chuyên sâu (laser, trị mụn, sẹo) chuyển giao trực tiếp cho kỹ thuật viên.
*   **AI Ambient Scribe**: Nhận nội dung cuộc hội thoại ghi âm/văn bản giữa bác sĩ và bệnh nhân, tự động phân tích và tạo bản nháp bệnh án chuẩn cấu trúc y khoa bao gồm triệu chứng, đề xuất chẩn đoán (kèm mã gợi ý ICD-10) và đơn thuốc dự kiến.

### 3. Lễ tân (Receptionist)
*   **Quản lý lịch hẹn**: Theo dõi toàn bộ lịch khám tổng quát trong ngày, tiếp nhận bệnh nhân vãng lai và xử lý việc đổi lịch hoặc hủy lịch.
*   **Thanh toán cọc & hóa đơn**: Quản lý hóa đơn dịch vụ, xác thực thanh toán tiền cọc qua cổng liên kết PayOS.
*   **Trực tổng đài chat**: Tiếp quản cuộc trò chuyện của bệnh nhân khi hệ thống DermaBot chuyển giao yêu cầu gặp nhân viên.

### 4. Kỹ thuật viên (Technician)
*   **Quản lý phiếu dịch vụ (Service Tickets)**: Tiếp nhận các chỉ định kỹ thuật từ bác sĩ.
*   **Thực hiện quy trình trị liệu**: Tiến hành các dịch vụ chăm sóc da chuyên sâu và cập nhật trạng thái hoàn thành kèm ghi chú kỹ thuật.

### 5. Quản trị viên (Admin)
*   Quản trị danh sách nhân sự (thêm mới bác sĩ, lễ tân, kỹ thuật viên và quản lý trạng thái tài khoản).
*   Quản lý danh mục dịch vụ khám, bảng giá dịch vụ và kho thuốc y tế.
*   Thiết lập các mã giảm giá (Vouchers) và theo dõi báo cáo doanh thu phòng khám.

---

## 📂 Cấu trúc thư mục dự án

```
├── docs/                    # Tài liệu đặc tả & tài liệu tham khảo kiểm thử Selenium
├── scripts/                 # Các script thiết lập dữ liệu mẫu nhanh
│   ├── seed-test-data.mjs   # Khởi tạo tài khoản nhân sự (Bác sĩ, Lễ tân) qua API Auth
│   └── seed_static_data.mjs # Khởi tạo danh mục tĩnh (Dịch vụ, Thuốc, Vouchers)
├── supabase/
│   ├── config.toml          # Tệp cấu hình dự án Supabase
│   ├── functions/           # Supabase Edge Functions (chat-bot, ambient-scribe, payos, send-clinic-email)
│   └── migrations/          # SQL Migrations thiết lập Schema, RLS & Trigger
├── src/
│   ├── components/          # React Components chia theo vai trò (Admin, Doctor, v.v.)
│   ├── context/             # Quản lý State chung (AuthContext)
│   ├── controllers/         # Custom hooks quản lý logic điều hướng & xử lý nghiệp vụ (Controller)
│   ├── models/              # Lớp tương tác và truy vấn trực tiếp đến Supabase DB (Model)
│   ├── services/            # Tương tác với Edge Functions (ScribeService, GeminiService, EmailService)
│   ├── views/               # Các trang giao diện chính (Dashboards, LandingPage, LoginPage)
│   ├── App.jsx              # Cấu hình định tuyến (Routing) & bộ lọc quyền (Guards)
│   └── main.jsx             # Điểm khởi chạy của ứng dụng React
└── Chay_Du_An.bat           # Tệp script khởi động nhanh dự án cho hệ điều hành Windows
```

---

## ⚡ Hướng dẫn cài đặt & Khởi chạy dự án ở máy cục bộ (Local)

### 1. Chuẩn bị môi trường
*   Cài đặt **Node.js** (Phiên bản 18 trở lên).
*   Tài khoản **Supabase** hoạt động (có thể sử dụng Supabase Cloud hoặc Supabase CLI để chạy Docker local).

### 2. Thiết lập cấu hình biến môi trường
Tạo tệp `.env` tại thư mục gốc của dự án (sao chép nội dung từ `.env.example`):
```ini
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Nếu chạy hoặc triển khai Edge Functions, hãy nạp khóa cấu hình API của Gemini vào Supabase Secrets:
```bash
supabase secrets set CHATBOT_API_KEY=your-gemini-api-key
```

### 3. Cài đặt các thư viện phụ thuộc
Chạy lệnh sau trong cửa sổ dòng lệnh tại thư mục gốc:
```bash
npm install
```

### 4. Thiết lập Cơ sở dữ liệu & Tạo dữ liệu mẫu ban đầu
*   **Bước 1**: Truy cập vào bảng điều khiển dự án Supabase -> **SQL Editor**, sao chép nội dung các tệp trong thư mục `supabase/migrations/` và thực thi lần lượt để thiết lập cấu trúc bảng, RLS và các hàm RPC.
*   **Bước 2**: Thực thi script nạp dữ liệu danh mục tĩnh (Dịch vụ y tế, thuốc, mã giảm giá):
    ```bash
    node scripts/seed_static_data.mjs
    ```
*   **Bước 3**: Khởi tạo tài khoản nhân viên y tế thử nghiệm:
    ```bash
    node scripts/seed-test-data.mjs
    ```

### 5. Khởi động ứng dụng
*   **Trên Windows**: Nhấp đúp trực tiếp vào tệp `Chay_Du_An.bat` tại thư mục gốc.
*   **Trên hệ điều hành khác**: Chạy lệnh:
    ```bash
    npm run dev
    ```
Ứng dụng sẽ tự động mở trình duyệt và chạy tại địa chỉ `http://localhost:5173/`.

---

## 🔑 Tài khoản đăng nhập thử nghiệm (Seeded Accounts)

Hệ thống có hai bộ dữ liệu tài khoản để kiểm tra tùy thuộc vào môi trường bạn sử dụng:

### Bộ tài khoản 1: Tài khoản có sẵn trong cơ sở dữ liệu (Live DB)
*   **Mật khẩu đăng nhập chung**: `Derma@2026`

| Vai trò | Email đăng nhập | Tên nhân sự / Người dùng |
| :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@dermasmart.vn` | Quản trị viên Hệ thống |
| **Lễ tân (Receptionist)** | `receptionist@dermasmart.vn` | Nguyễn Thu |
| **Bác sĩ (Doctor)** | `doctor1@dermasmart.vn` | BS. CKII. Trần Văn Anh |
| **Bác sĩ (Doctor)** | `doctor2@dermasmart.vn` | ThS. BS. Nguyễn Thị Bảo Bối |
| **Bệnh nhân (Patient)** | `patient1@gmail.com` | Lê Minh Khôi |
| **Bệnh nhân (Patient)** | `patient2@gmail.com` | Trần Thị Hồng Nhung |

### Bộ tài khoản 2: Tài khoản được tạo khi chạy script `seed-test-data.mjs` cục bộ
*   **Mật khẩu đăng nhập chung**: `DermaTest#2026`

| Vai trò | Email đăng nhập | Tên nhân sự / Người dùng |
| :--- | :--- | :--- |
| **Lễ tân (Receptionist)** | `receptionist@dermatest.local` | Lễ tân Nguyễn Thu |
| **Bác sĩ (Doctor)** | `doctor1@dermatest.local` | BS. CKII. Phạm Thanh Hà |
| **Bác sĩ (Doctor)** | `doctor2@dermatest.local` | ThS. BS. Đỗ Quang Huy |
| **Bác sĩ (Doctor)** | `doctor3@dermatest.local` | BS. CKI. Vũ Khánh Linh |

*Để thử nghiệm vai trò Bệnh nhân mới, bạn có thể thực hiện đăng ký tài khoản (Sign Up) trực tiếp trên trang Đăng nhập.*
