# DermaSmart — Tài liệu tham chiếu viết Selenium WebDriver (Java) cho tính năng Book Appointment

> Nguồn: đọc trực tiếp source React (`src/`) + truy vấn DB Supabase live ngày **17/07/2026**.
> ⚠️ **Toàn bộ codebase KHÔNG có `data-testid`, gần như không có `id`/`name`** (trừ trang Login). Locator bên dưới chủ yếu dựa vào text tiếng Việt + class Tailwind + thuộc tính ARIA. Khuyến nghị dùng XPath theo text vì class Tailwind rất dễ thay đổi.

---

## 1. Truy cập ứng dụng

| Mục | Giá trị |
|---|---|
| Chạy dev server | `npm run dev` (Vite, script `vite --open`) |
| Base URL | `http://localhost:5173` (port mặc định Vite; nếu bị chiếm Vite tự nhảy 5174…) |
| Trang Login | `http://localhost:5173/login` |
| Trang Book Appointment | **KHÔNG có route riêng** — là **modal** mở trên Landing Page `/` (component `BookAppointmentForm`, render trong `LandingPage.jsx` và `DoctorProfilePage.jsx` `/doctor/:id`) |
| Trang quản lý/hủy lịch của Patient | `/profile` → tab **"Lịch hẹn của tôi"** |
| Dashboard Receptionist | `/dashboard/receptionist` → tab sidebar **"Bàn Điều Phối"** (queue hôm nay) |

**Điều hướng mở form Book Appointment (sau khi login Patient):**
- Sau login, PATIENT được đưa về `/` (Landing Page).
- Click link nav **"Đặt lịch khám"** (thẻ `<a>` giữa navbar) **hoặc** nút hero **"Đặt lịch khám ngay"** → mở modal.
- Nếu chưa login mà click → tự redirect `/login`.
- XPath gợi ý: `//a[normalize-space()='Đặt lịch khám']` hoặc `//button[contains(.,'Đặt lịch khám ngay')]`

**Điều hướng dashboard Receptionist:** sidebar (DashboardShell) — nav items: `Tổng quan`, `Bàn Điều Phối`, `Quầy Thu Ngân`, `Chăm Sóc Khách Hàng`, `Đánh giá`. XPath: `//button[contains(.,'Bàn Điều Phối')]` (hoặc `//*[text()='Bàn Điều Phối']`).

---

## 2. Tài khoản test

**Mật khẩu chung cho account seed: `Derma@2026`** (đã verify hoạt động qua `signInWithPassword`; mật khẩu cũ `DermaTest#2026` KHÔNG đúng).

| Vai trò | Email | Tên hiển thị | Trạng thái DB |
|---|---|---|---|
| PATIENT | `patient1@gmail.com` | Lê Minh Khôi | ACTIVE |
| PATIENT | `patient2@gmail.com` | Trần Thị Hồng Nhung | ACTIVE |
| PATIENT | `patient3@gmail.com` | Phạm Đức Anh | ACTIVE |
| RECEPTIONIST | `receptionist@dermasmart.vn` | Nguyễn Thu | ACTIVE |
| RECEPTIONIST | `reception@dermasmart.vn` | Nguyễn Thị Lễ Tân | ACTIVE |
| DOCTOR | `doctor1@dermasmart.vn` | BS. CKII. Trần Văn Anh | ACTIVE |
| DOCTOR | `doctor2@dermasmart.vn` | ThS. BS. Nguyễn Thị Bảo Bối | ACTIVE |
| DOCTOR | `24tuoichuabo@gmail.com` | BS. Nguyễn Quang Nhựt | ACTIVE (không có ca trực tuần này) |
| ADMIN | `admin@dermasmart.vn` | Quản trị viên Hệ thống | ACTIVE |

### ⚠️ Patient INACTIVE — sự thật quan trọng
- Trong DB hiện tại **không có patient nào status INACTIVE**, và **code login KHÔNG kiểm tra `users.status`** khi đăng nhập bằng Supabase Auth → set `status='INACTIVE'` trong DB **không chặn được login**.
- Luồng "tài khoản bị khóa" duy nhất là **mock employee trong localStorage** (`useAuthController.jsx:293-309`): nếu localStorage key `admin-employees` chứa employee có `email` khớp và `status: 'Tạm khóa'` thì login báo lỗi **"Tài khoản này đã bị tạm khóa."** (mật khẩu path này là `initialPassword` hoặc `123456`).
- Cách tạo case "inactive" cho Selenium (chạy JS trước khi login):
```java
((JavascriptExecutor) driver).executeScript(
  "localStorage.setItem('admin-employees', JSON.stringify([{id:'emp-lock-1'," +
  "name:'BN Bị Khóa', email:'locked.patient@test.local', role:'PATIENT'," +
  "initialPassword:'123456', status:'Tạm khóa'}]))");
// login bằng locked.patient@test.local / 123456 → expect "Tài khoản này đã bị tạm khóa."
```

### Lịch làm việc bác sĩ (doctor_shifts, DB live, tuần 17–22/07/2026)
Cả 2 trạng thái `Đã xác nhận` và `Đã phân công` đều được form booking chấp nhận. Slot = 30 phút; **slot 11:00 & 11:30 luôn bị ẩn (nghỉ trưa)**.

| Ngày | BS. CKII. Trần Văn Anh (doctor1) | ThS. BS. Nguyễn Thị Bảo Bối (doctor2) |
|---|---|---|
| 17/07 (hôm nay) | 08:00–12:00 | 08:00–12:00, 13:00–21:00 |
| 18/07 | 07:00–11:30 | 08:00–12:00, 13:00–21:00 |
| 19/07 | — | 08:00–12:00, 13:00–21:00 |
| 20/07 | 08:00–12:00 | 08:00–12:00, 13:00–21:00 |
| 21/07 | — | 08:00–12:00, 13:00–21:00 |
| 22/07 | 13:00–17:00 | 08:00–12:00, 13:00–21:00 |

→ Case "doctor unavailable": chọn **doctor1 vào ngày 19/07 hoặc 21/07**.

---

## 3. Locator trang Login (`/login`, file `src/views/LoginPage.jsx`)

| Element | Locator | Ghi chú |
|---|---|---|
| Input email/SĐT | `By.id("email")` (cũng có `name="email"`, `type="text"`, placeholder `Nhập email hoặc số điện thoại`) | |
| Input password | `By.id("password")` (`name="password"`) | |
| Nút Login | `By.xpath("//button[@type='submit'][.//span[text()='Đăng nhập']]")` | Nút bị `disabled` khi đang loading |
| Checkbox ghi nhớ | `By.id("remember-me")` | |
| Element lỗi | `By.xpath("//div[contains(@class,'bg-error-container')]//p")` hoặc `//p[@class='text-sm font-medium']` | Banner đỏ phía trên form, animate bằng framer-motion |

**Text lỗi cố định:**
- Sai tài khoản/mật khẩu: `Email hoặc mật khẩu không chính xác.`
- Tài khoản bị khóa (chỉ mock-employee path, xem mục 2): `Tài khoản này đã bị tạm khóa.`
- Thiếu input: `Vui lòng nhập đầy đủ Email/SĐT và Mật khẩu.`
- Timeout mạng: `Yêu cầu hết thời gian phản hồi. Vui lòng thử lại.`

---

## 4. Locator form Book Appointment (modal, `src/components/PatientPortal/BookAppointmentForm.jsx`)

Modal root: `//h2[text()='Đặt lịch khám mới']/ancestor::div[contains(@class,'fixed')]` — z-index 9999, backdrop click sẽ ĐÓNG modal (trừ bước payment) → **tránh click vào backdrop**.

### ⚠️ KHÔNG có dropdown Service
Form hiện tại chỉ có 3 bước: **Ngày → Bác sĩ → Giờ**. `selectedCategory` bị hardcode `'cat-01'` (Khám da liễu tổng quát) và không có UI nào thay đổi được. Nếu test case của bạn yêu cầu "chọn Service" thì với UI hiện tại là **không thể** — hãy bỏ step đó hoặc đánh dấu N/A.

### Date picker (custom `GlassDatePicker`, KHÔNG phải `<input type="date">`)
| Element | Locator |
|---|---|
| Nút mở lịch | `//button[@aria-haspopup='dialog'][.//span[contains(text(),'Chọn ngày khám')]]` (sau khi chọn, text đổi thành `dd/MM/yyyy`) |
| Popup lịch | div chứa grid; tháng hiển thị: `//span[contains(text(),'Tháng')]` (vd `Tháng 7 2026`) |
| Nút tháng sau / trước | `//button[@aria-label='Tháng sau']` / `//button[@aria-label='Tháng trước']` |
| Chọn ngày N | `//div[@aria-haspopup] ...` đơn giản nhất: `//button[normalize-space()='18' and not(@disabled)]` trong popup |
| Ngày quá khứ | có attribute `disabled` (không click được) → **không thể chọn past date qua UI**, cũng không thể gõ sai format (không có input text) |

### Dropdown bác sĩ (custom `GlassSelect`, KHÔNG phải `<select>`)
| Element | Locator |
|---|---|
| Nút mở dropdown | `//button[@aria-haspopup='listbox']` (trong modal chỉ có 1). Placeholder: `Tự động chọn bác sĩ phù hợp` |
| Danh sách option | `//ul[@role='listbox']/li[@role='option']` |
| Option cụ thể | `//li[@role='option'][contains(.,'Trần Văn Anh')]` |
| Option "không chọn" | `//li[@role='option'][contains(.,'Không chọn — hệ thống tự sắp xếp')]` |

**Bác sĩ không khả dụng hiển thị thế nào:** dropdown luôn liệt kê TẤT CẢ bác sĩ (không ẩn ai). Nếu chọn bác sĩ không trực ngày đó, cột phải hiện thông báo đỏ:
`Bác sĩ bạn chọn không làm việc vào ngày này. Vui lòng chọn ngày khác hoặc bỏ chọn bác sĩ.`
Nếu ngày đó không ai trực: `Không có bác sĩ làm việc vào ngày đã chọn.`
Locator: `//div[contains(@class,'text-rose-500')][contains(.,'không làm việc vào ngày này')]`

### Time slot
| Element | Locator |
|---|---|
| Vùng slot | xuất hiện sau khi chọn ngày, header `Bước 3: Chọn giờ khám` |
| Slot khả dụng | `//button[@type='button'][normalize-space()='08:00' and not(@disabled)]` |
| Slot đã đặt/quá giờ | có `disabled` + class `line-through` (gạch ngang, xám) |
| Slot đang chọn | class chứa `bg-emerald-500` |

### Guest fields (chỉ hiện khi CHƯA login)
placeholder: `Họ và tên bệnh nhân`, `Số điện thoại`, `Địa chỉ Email` (đều `required` native HTML).

### Nút submit
`//button[@type='submit'][contains(.,'Tiếp tục thanh toán giữ chỗ')]` — text đầy đủ: **"Tiếp tục thanh toán giữ chỗ (50.000 VNĐ)"**.
Nút **`disabled` cho tới khi đủ ngày + giờ (+ thông tin liên hệ nếu guest)** → đây chính là cách app "validate field thiếu" (xem mục 5).

### Đổi bác sĩ trước khi confirm
- Ở bước form: có — mở lại dropdown bác sĩ chọn người khác (giờ đã chọn sẽ bị reset).
- Ở bước payment (QR): chỉ có nút **"Hủy giao dịch"** (`//button[text()='Hủy giao dịch']`) → quay lại form với error message, giờ đã chọn bị xóa.

### ⚠️ Bước thanh toán PayOS — chặn E2E "success"
Sau submit hợp lệ, form chuyển sang **bước Payment**: heading `Thanh toán phí giữ chỗ`, ảnh QR VietQR, đếm ngược **05:00**, poll trạng thái PayOS mỗi 3 giây. Bước **Success chỉ xuất hiện khi PayOS trả `PAID` (chuyển khoản thật)** — Selenium không thể tự hoàn tất. Chiến lược test:
1. Assert đến được bước payment (QR + countdown) = "đặt lịch hợp lệ".
2. Test negative cases (validate lỗi) — không cần thanh toán.
3. Muốn có appointment "thật" cho test hủy/receptionist: dùng **Walk-in booking của Receptionist** (nút `+` trên header dashboard receptionist, không qua PayOS) hoặc insert thẳng DB.
4. Hết 5 phút không thanh toán → bước Timeout: heading `Hết thời gian giữ chỗ!`.

---

## 5. Locator kết quả / thông báo

### Thành công (chỉ sau khi thanh toán PayOS)
| Element | Locator / Text |
|---|---|
| Heading success trong modal | `//h3[text()='Đặt lịch thành công!']` |
| Badge cọc | text `Đã thanh toán cọc 50,000 VNĐ` |
| Toast góc phải-dưới (GlobalToast, `App.jsx`) | `//div[contains(@class,'fixed')][.//h4[text()='Thành công']]` — message: `Thanh toán phí giữ chỗ thành công!`; toast email: `Đã gửi email xác nhận lịch hẹn tới <email>.` |
| Thời gian toast | **5000 ms** rồi tự ẩn; modal success tự đóng sau **3500 ms** |

### Validate field thiếu
**Không có lỗi per-field.** Cơ chế: nút submit `disabled` khi chưa đủ (ngày, giờ, bác sĩ auto-assign được; guest thêm 3 input `required` native). Assert bằng `getAttribute("disabled")`. Lỗi nghiệp vụ (sau khi bấm submit) hiện **một banner chung duy nhất** đầu form:

Banner lỗi: `//div[contains(@class,'bg-rose-50')][.//span[text()='Lỗi đặt lịch:']]`

### Text lỗi nghiệp vụ cố định (từ `AppointmentModel.validateBooking`)
| Case | Text |
|---|---|
| Ngày quá khứ (chỉ khi bypass UI) | `Ngày đặt khám tối thiểu phải từ hôm nay trở đi.` |
| Giờ đã qua (hôm nay) | `Khung giờ này đã qua, vui lòng chọn khung giờ khác.` |
| Bác sĩ không trực ngày đó | `Bác sĩ không có lịch trực vào ngày này. Lịch làm việc cố định của bác sĩ: ...` |
| Ngoài ca làm việc | `Khung giờ này nằm ngoài ca làm việc của bác sĩ.` |
| Slot đã bị đặt (doctor unavailable/slot full) | `Khung giờ này đã được đặt trước cho bác sĩ này. Vui lòng chọn khung giờ khác.` |
| Duplicate: đã có lịch cùng ngày | `Bạn đã có một lịch hẹn khác đăng ký cho ngày <date>. Mỗi người chỉ có thể đặt tối đa 1 lịch khám trong cùng một ngày.` |
| Quá 2 lịch sắp tới | `Bạn đã có 2 lịch hẹn sắp tới. Vui lòng hoàn thành hoặc hủy lịch cũ trước khi đặt lịch mới.` |
| Hủy giao dịch payment | `Giao dịch đã bị hủy. Khung giờ này vẫn đang bị khóa trong thời gian thanh toán (tối đa 5 phút).` |
| Lỗi RLS/DB | `Không thể lưu lịch hẹn vào cơ sở dữ liệu (Có thể do lỗi phân quyền RLS trên Supabase).` |

### Các case KHÔNG tồn tại trong UI hiện tại
- **Capacity slot (4/5):** không có — 1 slot = 1 booking/bác sĩ, slot full thì bị disabled/gạch ngang.
- **Invalid date format:** không thể xảy ra (date picker custom, không có input gõ tay).
- **Clinic closed:** không có message riêng; giờ nghỉ trưa 11:00/11:30 đơn giản bị ẩn khỏi danh sách, ngoài ca thì slot không được render.
- **Inactive account khi booking:** không kiểm tra.

---

## 6. Thông báo xác nhận (notification)

| Kênh | Chi tiết | Locator |
|---|---|---|
| Toast in-app | GlobalToast góc **phải-dưới**, 5s (xem mục 5) | `//h4[text()='Thành công']/following-sibling::p` |
| Email | Gửi thật qua edge function Brevo (`send-clinic-email`) tới email bệnh nhân — chỉ verify qua toast `Đã gửi email xác nhận lịch hẹn tới ...` | — |
| In-app notification (DB) | `NotificationModel.sendNotification('PATIENT', ...)` với title `Đặt lịch hẹn thành công` — **nhưng UI Patient hiện KHÔNG có chuông thông báo** (`/profile` không render Bell) → không assert được trên UI Patient | — |
| Chuông Receptionist | Header dashboard receptionist có nút Bell (icon, không text). Locator: `//button[.//*[name()='svg']][contains(@class,'rounded-2xl')]` — khuyên dùng: nút thứ 3 trong headerExtras, hoặc `//div[@class='relative']/button[contains(@class,'w-10 h-10')]`. Dropdown mở ra có header text `Thông báo`, nút `Đọc tất cả` | `//span[text()='Thông báo']` |

---

## 7. Hủy lịch & Receptionist visibility

### Patient hủy lịch (`/profile` → tab "Lịch hẹn của tôi", file `AppointmentsTab.jsx`)
| Element | Locator |
|---|---|
| Tab lịch hẹn | `//button[contains(.,'Lịch hẹn của tôi')]` |
| Card lịch hẹn | card trắng chứa tên bác sĩ + ngày giờ: `//h4[...]` — tìm theo: `//div[contains(@class,'rounded-2xl')][contains(.,'BS. CKII. Trần Văn Anh')][contains(.,'2026-07-18')]` |
| Nút Hủy lịch | trong card: `.//button[contains(.,'Hủy lịch')]` (chỉ hiện với lịch sắp tới, chưa hủy) |
| Dialog xác nhận | heading `//h3[text()='Xác nhận hủy lịch hẹn']`, câu `Bạn có chắc chắn muốn hủy lịch hẹn này không?`, note `Lưu ý: Bạn sẽ mất phí đặt cọc giữ chỗ.` |
| Nút xác nhận hủy | `//button[text()='Xác nhận hủy']` |
| Nút quay lại | `//button[text()='Quay lại']` |
| Lỗi hủy (nếu có) | banner `Lỗi hủy lịch:` trong dialog |
| Nút Đổi lịch | `.//button[contains(.,'Đổi lịch')]` (tối đa 2 lần; hết lượt hiện span `Đổi lịch (Hết lượt)`) |

### Tìm appointment trong màn hình Receptionist (`/dashboard/receptionist` → "Bàn Điều Phối", `TodayQueueBoard.jsx`)
- **Chỉ hiển thị lịch của HÔM NAY** (`date === TODAY_STR`), kanban 3 cột: **Chờ tiếp đón** (status `Đặt lịch thành công`/`Đã xác nhận`) → **Trong phòng khám** → chờ thanh toán. Lịch "Chờ tiếp đón" đã quá giờ hẹn sẽ bị ẨN (coi như no-show).
- Card bệnh nhân: tên trong `<h4>`, giờ + dịch vụ, tên bác sĩ màu teal.
- Locator tìm 1 appointment cụ thể:
  `//h4[normalize-space()='Lê Minh Khôi']/ancestor::div[contains(@class,'rounded-2xl')][contains(.,'08:30')]`
- Cột chứa card: `//h3[text()='Chờ tiếp đón']/ancestor::section`
- Nút hành động trên card: `Đã đến` (check-in, chỉ enable gần giờ hẹn), `Thu ngân`.
- Đếm số card cột: badge cạnh header cột.
- **Receptionist KHÔNG có nút Cancel appointment** trên queue board — hủy chỉ có từ phía Patient (hoặc DB).

---

## 8. Thời gian xử lý bất đồng bộ (đề xuất wait cho Selenium)

| Bước | Cơ chế | Đề xuất explicit wait |
|---|---|---|
| Login submit → redirect | Supabase auth (timeout nội bộ 15s) | `WebDriverWait` 15s cho URL đổi / element trang đích |
| Mở modal booking | Animation framer-motion ~250 ms | wait visibility heading `Đặt lịch khám mới`, 5s |
| Chọn ngày → render slot | Fetch `doctor_shifts` khi mở modal + tính client-side | wait 10s cho `Bước 3: Chọn giờ khám` hoặc message lỗi |
| Submit → bước payment | `validateBooking` = 3–5 query Supabase + insert hold + gọi edge function PayOS | wait **15s** cho heading `Thanh toán phí giữ chỗ` HOẶC banner `Lỗi đặt lịch:` |
| QR hiện ra | edge function PayOS; trước đó có **spinner** (div `animate-spin`) | wait 15s cho `img[alt='QR Code Thanh Toán']` |
| Payment poll | mỗi **3000 ms** | — |
| Success → modal tự đóng | **3500 ms** | assert heading trước 3.5s |
| Toast | hiện **5000 ms** | assert trong 5s |
| Hủy lịch confirm | 1 update Supabase | wait 10s cho dialog biến mất / card đổi trạng thái |
| Dropdown/date-picker animation | 180 ms | thường không cần wait riêng, nhưng nên dùng `elementToBeClickable` |

Không có spinner toàn trang khi submit booking (nút chỉ disabled qua ref, có thể vẫn clickable về DOM — chống double-click đã xử lý trong code bằng `isSubmittingRef`).

---

## 9. data-testid có sẵn

**KHÔNG CÓ.** Đã grep toàn bộ `src/` — 0 kết quả `data-testid`. Các attribute ổn định nhất hiện có:

| Trang | Attribute dùng được |
|---|---|
| Login | `id="email"`, `id="password"`, `id="remember-me"`, `button[type='submit']` |
| Booking modal | `aria-haspopup='dialog'` (date), `aria-haspopup='listbox'` + `role='listbox'/'option'` + `aria-selected` (doctor), `aria-expanded`, `button[type='submit']`, `aria-label='Tháng trước'/'Tháng sau'`, `img[alt='QR Code Thanh Toán']` |
| Còn lại | Chỉ có text tiếng Việt + class Tailwind |

> 💡 Đề xuất: nếu team đồng ý sửa code, chỉ cần thêm `data-testid` vào ~15 element trong `BookAppointmentForm.jsx`, `GlassSelect.jsx`, `GlassDatePicker.jsx`, `AppointmentsTab.jsx`, `TodayQueueBoard.jsx` là bộ test sẽ ổn định hơn nhiều.

---

## Phụ lục — mapping test case ↔ khả năng hiện tại

| Test case dự kiến | Khả thi qua UI? | Ghi chú |
|---|---|---|
| Login sai mật khẩu | ✅ | `Email hoặc mật khẩu không chính xác.` |
| Login tài khoản khóa | ⚠️ | Chỉ qua localStorage mock (mục 2) |
| Book thành công (happy path) | ⚠️ một phần | Assert đến bước QR payment; success cần thanh toán thật |
| Thiếu service | ❌ | Không có dropdown service |
| Thiếu date/time | ✅ | Nút submit disabled |
| Doctor unavailable | ✅ | Message đỏ trong panel slot |
| Slot full / vừa bị đặt | ✅ | Slot disabled hoặc banner `Khung giờ này đã được đặt trước...` |
| Duplicate cùng ngày | ✅ | Banner duplicate (cần 1 lịch có sẵn trong DB) |
| Past date / invalid format | ❌ qua UI | Date picker chặn từ đầu (chỉ test được ở tầng API) |
| Cancel appointment | ✅ | `/profile` → Hủy lịch → Xác nhận hủy |
| Receptionist thấy lịch | ✅ (chỉ lịch hôm nay) | Queue board, tìm theo tên bệnh nhân |
| Notification | ⚠️ | Toast + email; Patient không có chuông in-app |
