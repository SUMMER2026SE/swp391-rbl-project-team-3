// ─── Mock Doctors ────────────────────────────────────────────────────────────
export const doctors = [
    {
        id: "doc-01",
        name: "BS. CKII. Trần Văn A",
        title: "Giám đốc chuyên môn",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKEOLtn7bX1j7Zj8H8Jgrd5tm5Nms_14tDyN2ORvpoLoRUnyEdhnv5mFJ0xgWRih3680BUnvZPK1swb5wL3z45P_LO1QO7fL-e3kJezz2Z0gOhbOHTi66es7YihIzfzNd6UbeEmsxiNx-kI1bUeZgt7PN1BTHnqGCh3zeKWcl7QwLqMb_okdqroz89R3OhSgUFq7n_HRVW_3H50QTSj_ZrM9ISxDX8tI_anUHW_qXodwGPeTuRsRwil6UQ17TwKY9fanH_uILavXPK",
        experience: "20 năm kinh nghiệm",
        specialties: ["Trị liệu Laser", "Da liễu thẩm mỹ", "Chẩn đoán bệnh lý"],
        bio: "Bác sĩ Trần Văn A là Giám đốc chuyên môn với hơn 20 năm kinh nghiệm trong ngành da liễu lâm sàng và thẩm mỹ. Bác sĩ chuyên môn sâu về chẩn đoán chính xác các bệnh lý da phức tạp và ứng dụng công nghệ điều trị Laser thế hệ mới.",
        consultationFee: "500,000 VNĐ",
        rating: 4.9,
        reviewsCount: 156,
        schedule: [
            { day: "Thứ Hai", hours: "08:00 - 17:00" },
            { day: "Thứ Tư", hours: "08:00 - 12:00" },
            { day: "Thứ Sáu", hours: "13:30 - 17:00" }
        ]
    },
    {
        id: "doc-02",
        name: "ThS. BS. Nguyễn Thị B",
        title: "Chuyên gia Da liễu thẩm mỹ",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBt2esct_8y4gBctODjPCkYarwiTlXBeYGf9ROq8bb3QcEauPGz5QnY5VPmeMSsebZRJMkZlCdharhNmL7fN48wclPIfTpJI-ifokFi5FfKURcqKhnBwCrP-9_UGy_eCJw4crZTq33P4OxdyNXakyBR2L6UQNVL-dXLAgy_LFiw8QsnQbMiPrD7Wr9_328tVXUSFQ4lfX4JkaCiPk-SsYq3mSc6iGNkF47RU1JgpT4OSYNmBOvZzxFcbgPXPHr_If9GFD0HWeMdsbU1",
        experience: "12 năm kinh nghiệm",
        specialties: ["Trị liệu nám", "Chăm sóc da cá nhân", "Thẩm mỹ không xâm lấn"],
        bio: "Thạc sĩ Bác sĩ Nguyễn Thị B là chuyên gia uy tín hàng đầu trong lĩnh vực Thẩm mỹ Da liễu không xâm lấn. Bác sĩ nổi tiếng với các phác đồ chăm sóc và phục hồi cấu trúc da tự nhiên, điều trị nám và lão hóa chuyên sâu.",
        consultationFee: "400,000 VNĐ",
        rating: 4.8,
        reviewsCount: 112,
        schedule: [
            { day: "Thứ Ba", hours: "08:00 - 17:00" },
            { day: "Thứ Năm", hours: "08:00 - 17:00" },
            { day: "Thứ Bảy", hours: "08:00 - 12:00" }
        ]
    },
    {
        id: "doc-03",
        name: "KTV. Lê Thị C",
        title: "Chuyên gia phân tích da liễu AI",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOvstfM_6hjJJ5YCSOBxCzfwbclWI1ikrRl-icFlIHxF4NygZvQxx96GFjFZxtZfN6DVX7pnrS7TqXMZUjIJfYmnBmJt_xPeHBmYZygGsmOKIPBjBM8i3v26RezTALfNa8HpJUnkSbhJc9EtGiYfDAiBXyKOX9luu3_8JaZeWEeVzHXrxAjFArFG7Hl4-cun-bgSaNdsp_yOQ1rG5R3gxsbzFqHx6KnNeKgMSV2VvD1MaqniR6tvUjr6SxPrg-FoHQyjTl83glA0FY",
        experience: "8 năm kinh nghiệm",
        specialties: ["Phân tích chỉ số da AI", "Vận hành máy soi da quang phổ", "Tư vấn công nghệ chăm sóc"],
        bio: "Kỹ thuật viên Lê Thị C có chuyên môn sâu sắc về vận hành các hệ thống soi da quang phổ đa tầng kết hợp phân tích AI tiên tiến. Cô giúp khách hàng đọc hiểu các chỉ số da chi tiết và định hướng liệu trình tối ưu nhất.",
        consultationFee: "200,000 VNĐ",
        rating: 4.7,
        reviewsCount: 88,
        schedule: [
            { day: "Thứ Hai", hours: "08:00 - 17:00" },
            { day: "Thứ Tư", hours: "08:00 - 17:00" },
            { day: "Thứ Sáu", hours: "08:00 - 17:00" }
        ]
    }
];

// ─── Mock Patients ───────────────────────────────────────────────────────────
export const mockPatients = [
    {
        id: "pat-01",
        fullName: "Lê Minh Khôi",
        phone: "0901 234 567",
        email: "leminhkhoi@gmail.com",
        gender: "Nam",
        dob: "1995-03-15",
        address: "45 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
        avatar: "https://i.pravatar.cc/150?u=pat01",
        medicalHistory: ["Viêm da cơ địa", "Mụn trứng cá nặng"],
    },
    {
        id: "pat-02",
        fullName: "Trần Thị Hồng Nhung",
        phone: "0912 345 678",
        email: "hongnhung.tran@gmail.com",
        gender: "Nữ",
        dob: "1990-08-22",
        address: "123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh",
        avatar: "https://i.pravatar.cc/150?u=pat02",
        medicalHistory: ["Nám da hỗn hợp", "Tàn nhang"],
    },
    {
        id: "pat-03",
        fullName: "Phạm Đức Anh",
        phone: "0933 456 789",
        email: "ducanh.pham@gmail.com",
        gender: "Nam",
        dob: "1988-12-05",
        address: "78 Lê Lợi, Quận 3, TP. Hồ Chí Minh",
        avatar: "https://i.pravatar.cc/150?u=pat03",
        medicalHistory: ["Vảy nến thể mảng"],
    },
    {
        id: "pat-04",
        fullName: "Nguyễn Hoàng Mai",
        phone: "0944 567 890",
        email: "hoangmai.nguyen@gmail.com",
        gender: "Nữ",
        dob: "1997-05-10",
        address: "200 Cách Mạng Tháng Tám, Quận Tân Bình, TP. Hồ Chí Minh",
        avatar: "https://i.pravatar.cc/150?u=pat04",
        medicalHistory: ["Da nhạy cảm", "Rosacea"],
    },
    {
        id: "pat-05",
        fullName: "Võ Thanh Tùng",
        phone: "0955 678 901",
        email: "thanhtung.vo@gmail.com",
        gender: "Nam",
        dob: "1992-11-30",
        address: "56 Trần Hưng Đạo, Quận 5, TP. Hồ Chí Minh",
        avatar: "https://i.pravatar.cc/150?u=pat05",
        medicalHistory: ["Nấm da", "Viêm nang lông"],
    },
];

// ─── Mock Services ───────────────────────────────────────────────────────────
export const mockServices = [
    { id: "svc-01", name: "Khám Da Liễu Tổng Quát", price: "300,000 VNĐ", duration: "30 phút" },
    { id: "svc-02", name: "Soi Da AI Chuyên Sâu", price: "500,000 VNĐ", duration: "45 phút" },
    { id: "svc-03", name: "Trị Liệu Laser Fractional CO2", price: "2,500,000 VNĐ", duration: "60 phút" },
    { id: "svc-04", name: "Điều Trị Nám Chuyên Sâu", price: "1,800,000 VNĐ", duration: "50 phút" },
    { id: "svc-05", name: "Peel Da Sinh Học", price: "800,000 VNĐ", duration: "40 phút" },
    { id: "svc-06", name: "Tiêm Filler & Botox", price: "3,000,000 VNĐ", duration: "30 phút" },
    { id: "svc-07", name: "Trị Mụn Chuyên Sâu", price: "600,000 VNĐ", duration: "45 phút" },
];

// ─── Mock Time Slots ─────────────────────────────────────────────────────────
export const mockTimeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "13:30", "14:00", "14:30", "15:00",
    "15:30", "16:00", "16:30",
];

// ─── Mock Appointments ───────────────────────────────────────────────────────
export const mockAppointments = [
    // ── Upcoming ──
    {
        id: "apt-01",
        patientId: "pat-01",
        patientName: "Lê Minh Khôi",
        doctorId: "doc-01",
        doctorName: "BS. CKII. Trần Văn A",
        date: "2026-06-05",
        time: "09:00",
        status: "Đang chờ",
        service: "Khám Da Liễu Tổng Quát",
        paymentStatus: "Chưa thanh toán",
        fee: "300,000 VNĐ",
        notes: "Khám tái khám viêm da cơ địa, theo dõi liệu trình.",
    },
    {
        id: "apt-02",
        patientId: "pat-01",
        patientName: "Lê Minh Khôi",
        doctorId: "doc-02",
        doctorName: "ThS. BS. Nguyễn Thị B",
        date: "2026-06-12",
        time: "14:00",
        status: "Đang chờ",
        service: "Trị Mụn Chuyên Sâu",
        paymentStatus: "Chưa thanh toán",
        fee: "600,000 VNĐ",
        notes: "",
    },
    {
        id: "apt-03",
        patientId: "pat-02",
        patientName: "Trần Thị Hồng Nhung",
        doctorId: "doc-02",
        doctorName: "ThS. BS. Nguyễn Thị B",
        date: "2026-06-07",
        time: "10:00",
        status: "Đang chờ",
        service: "Điều Trị Nám Chuyên Sâu",
        paymentStatus: "Chưa thanh toán",
        fee: "1,800,000 VNĐ",
        notes: "Lần điều trị thứ 3 trong liệu trình 6 buổi.",
    },
    {
        id: "apt-04",
        patientId: "pat-04",
        patientName: "Nguyễn Hoàng Mai",
        doctorId: "doc-01",
        doctorName: "BS. CKII. Trần Văn A",
        date: "2026-06-08",
        time: "08:30",
        status: "Chờ xác nhận",
        service: "Soi Da AI Chuyên Sâu",
        paymentStatus: "Chưa thanh toán",
        fee: "500,000 VNĐ",
        notes: "Lần đầu soi da, cần đánh giá tình trạng rosacea.",
    },
    // ── Past / Completed ──
    {
        id: "apt-05",
        patientId: "pat-01",
        patientName: "Lê Minh Khôi",
        doctorId: "doc-01",
        doctorName: "BS. CKII. Trần Văn A",
        date: "2026-05-20",
        time: "09:30",
        status: "Đã khám",
        service: "Khám Da Liễu Tổng Quát",
        paymentStatus: "Đã thanh toán",
        fee: "300,000 VNĐ",
        diagnosis: "Viêm da cơ địa mức độ trung bình",
        prescription: "Hydrocortisone 1%, Cetirizine 10mg x 14 ngày",
        feedback: "Bác sĩ rất tận tâm, giải thích rõ ràng. 5 sao!",
        notes: "Tái khám sau 2 tuần.",
    },
    {
        id: "apt-06",
        patientId: "pat-01",
        patientName: "Lê Minh Khôi",
        doctorId: "doc-03",
        doctorName: "KTV. Lê Thị C",
        date: "2026-05-10",
        time: "15:00",
        status: "Đã khám",
        service: "Soi Da AI Chuyên Sâu",
        paymentStatus: "Đã thanh toán",
        fee: "500,000 VNĐ",
        diagnosis: "Chỉ số ẩm 38/100, dầu 72/100, sắc tố melanin tăng vùng T-zone",
        prescription: "Serum Niacinamide 10%, SPF 50+ hàng ngày",
        feedback: "",
        notes: "",
    },
    {
        id: "apt-07",
        patientId: "pat-02",
        patientName: "Trần Thị Hồng Nhung",
        doctorId: "doc-02",
        doctorName: "ThS. BS. Nguyễn Thị B",
        date: "2026-05-15",
        time: "10:30",
        status: "Đã khám",
        service: "Điều Trị Nám Chuyên Sâu",
        paymentStatus: "Đã thanh toán",
        fee: "1,800,000 VNĐ",
        diagnosis: "Nám hỗn hợp vùng gò má, cải thiện 40% sau buổi 2",
        prescription: "Tretinoin 0.05%, Arbutin serum, SPF 50+",
        feedback: "Kết quả rất khả quan, da đều màu hơn rõ rệt.",
        notes: "Lần điều trị thứ 2.",
    },
    {
        id: "apt-08",
        patientId: "pat-03",
        patientName: "Phạm Đức Anh",
        doctorId: "doc-01",
        doctorName: "BS. CKII. Trần Văn A",
        date: "2026-05-18",
        time: "08:00",
        status: "Đã khám",
        service: "Trị Liệu Laser Fractional CO2",
        paymentStatus: "Chờ xác nhận",
        fee: "2,500,000 VNĐ",
        diagnosis: "Vảy nến thể mảng, đáp ứng tốt với laser",
        prescription: "Calcipotriol ointment, Tacrolimus 0.1%",
        feedback: "",
        notes: "Cần theo dõi tại nhà, tránh nắng 7 ngày.",
    },
    {
        id: "apt-09",
        patientId: "pat-05",
        patientName: "Võ Thanh Tùng",
        doctorId: "doc-01",
        doctorName: "BS. CKII. Trần Văn A",
        date: "2026-05-25",
        time: "11:00",
        status: "Đã khám",
        service: "Khám Da Liễu Tổng Quát",
        paymentStatus: "Đã thanh toán",
        fee: "300,000 VNĐ",
        diagnosis: "Nấm da vùng bẹn, viêm nang lông nhẹ",
        prescription: "Ketoconazole cream 2%, Clindamycin gel 1%",
        feedback: "Phòng khám sạch sẽ, nhân viên thân thiện.",
        notes: "",
    },
    // ── Cancelled ──
    {
        id: "apt-10",
        patientId: "pat-01",
        patientName: "Lê Minh Khôi",
        doctorId: "doc-02",
        doctorName: "ThS. BS. Nguyễn Thị B",
        date: "2026-05-28",
        time: "14:30",
        status: "Đã hủy",
        service: "Peel Da Sinh Học",
        paymentStatus: "Chưa thanh toán",
        fee: "800,000 VNĐ",
        notes: "Bệnh nhân hủy do bận công tác.",
    },
];

// ─── Mock Chat Messages ──────────────────────────────────────────────────────
export const mockChatMessages = [
    {
        id: "msg-01",
        senderId: "bot",
        senderName: "DermaSmart AI",
        senderRole: "BOT",
        text: "Xin chào! Tôi là trợ lý AI của DermaSmart. Tôi có thể giúp bạn đặt lịch khám, kiểm tra tình trạng da hoặc giải đáp thắc mắc. Bạn cần hỗ trợ gì hôm nay?",
        timestamp: "2026-06-01T08:00:00Z",
        mode: "AI",
    },
    {
        id: "msg-02",
        senderId: "pat-01",
        senderName: "Lê Minh Khôi",
        senderRole: "PATIENT",
        text: "Chào bạn, tôi muốn hỏi về lịch khám ngày mai với BS. Trần Văn A có còn không?",
        timestamp: "2026-06-01T08:01:30Z",
        mode: "AI",
    },
    {
        id: "msg-03",
        senderId: "bot",
        senderName: "DermaSmart AI",
        senderRole: "BOT",
        text: "BS. CKII. Trần Văn A hiện còn trống lịch vào ngày mai (02/06) lúc 09:00 và 10:30. Bạn muốn đặt khung giờ nào ạ?",
        timestamp: "2026-06-01T08:02:00Z",
        mode: "AI",
    },
    {
        id: "msg-04",
        senderId: "pat-01",
        senderName: "Lê Minh Khôi",
        senderRole: "PATIENT",
        text: "Cho tôi chuyển sang nói chuyện với nhân viên lễ tân được không?",
        timestamp: "2026-06-01T08:03:15Z",
        mode: "AI",
    },
    {
        id: "msg-05",
        senderId: "bot",
        senderName: "DermaSmart AI",
        senderRole: "BOT",
        text: "Đã chuyển sang kênh hỗ trợ trực tiếp. Nhân viên lễ tân sẽ phản hồi bạn trong giây lát. 🎧",
        timestamp: "2026-06-01T08:03:20Z",
        mode: "AI",
    },
    {
        id: "msg-06",
        senderId: "staff-01",
        senderName: "Lễ tân Hoàng Anh",
        senderRole: "RECEPTIONIST",
        text: "Chào anh Khôi! Em là Hoàng Anh, lễ tân phòng khám DermaSmart. Anh cần hỗ trợ gì thêm về lịch khám ạ?",
        timestamp: "2026-06-01T08:05:00Z",
        mode: "Live",
    },
    {
        id: "msg-07",
        senderId: "pat-01",
        senderName: "Lê Minh Khôi",
        senderRole: "PATIENT",
        text: "Chào em, anh muốn đổi lịch khám từ ngày 05/06 sang 06/06 được không? Anh bận họp buổi sáng ngày 5.",
        timestamp: "2026-06-01T08:06:10Z",
        mode: "Live",
    },
    {
        id: "msg-08",
        senderId: "staff-01",
        senderName: "Lễ tân Hoàng Anh",
        senderRole: "RECEPTIONIST",
        text: "Dạ để em kiểm tra lịch BS. Trần Văn A ngày 06/06. Ngày 06/06 là thứ Sáu, BS có lịch từ 13:30 - 17:00. Anh có muốn chọn khung 14:00 không ạ?",
        timestamp: "2026-06-01T08:07:30Z",
        mode: "Live",
    },
    {
        id: "msg-09",
        senderId: "pat-01",
        senderName: "Lê Minh Khôi",
        senderRole: "PATIENT",
        text: "14:00 ngày 06/06 được nhé. Cảm ơn em!",
        timestamp: "2026-06-01T08:08:00Z",
        mode: "Live",
    },
    {
        id: "msg-10",
        senderId: "staff-01",
        senderName: "Lễ tân Hoàng Anh",
        senderRole: "RECEPTIONIST",
        text: "Dạ em đã cập nhật lịch cho anh rồi ạ. Anh nhớ đến trước 15 phút để làm thủ tục nhé. Chúc anh một ngày tốt lành! 😊",
        timestamp: "2026-06-01T08:09:00Z",
        mode: "Live",
    },
];

// ─── Mock Medical Records ────────────────────────────────────────────────────
export const mockMedicalRecords = [
    {
        id: "rec-01",
        patientId: "pat-01",
        date: "20/05/2026",
        doctor: "BS. CKII. Trần Văn A",
        specialty: "Da liễu",
        diagnosis: "Viêm da cơ địa (Eczema) mức độ trung bình",
        prescription: "Hydrocortisone 1%, Cetirizine 10mg x 14 ngày",
        status: "completed",
        notes: "Tái khám sau 2 tuần. Tránh tiếp xúc xà phòng mạnh.",
    },
    {
        id: "rec-02",
        patientId: "pat-01",
        date: "10/05/2026",
        doctor: "KTV. Lê Thị C",
        specialty: "Phân tích AI",
        diagnosis: "Chỉ số ẩm 38/100, dầu 72/100, melanin tăng T-zone",
        prescription: "Serum Niacinamide 10%, SPF 50+ hàng ngày",
        status: "completed",
        notes: "Tái soi sau 1 tháng để đánh giá hiệu quả.",
    },
    {
        id: "rec-03",
        patientId: "pat-02",
        date: "15/05/2026",
        doctor: "ThS. BS. Nguyễn Thị B",
        specialty: "Laser & Thẩm mỹ",
        diagnosis: "Nám hỗn hợp vùng gò má, cải thiện 40% sau buổi 2",
        prescription: "Tretinoin 0.05%, Arbutin serum, SPF 50+",
        status: "completed",
        notes: "Buổi điều trị thứ 2/6. Kết quả khả quan.",
    },
    {
        id: "rec-04",
        patientId: "pat-03",
        date: "18/05/2026",
        doctor: "BS. CKII. Trần Văn A",
        specialty: "Da liễu",
        diagnosis: "Vảy nến thể mảng, đáp ứng tốt với laser",
        prescription: "Calcipotriol ointment, Tacrolimus 0.1%",
        status: "completed",
        notes: "Theo dõi tại nhà, tránh nắng 7 ngày sau laser.",
    },
];

// ─── Mock AI Skin Results ────────────────────────────────────────────────────
export const mockAISkinResults = [
    {
        id: "ai-res-01",
        patientId: "pat-01",
        date: "2026-06-05T08:30:00Z",
        imageUrl: "https://example.com/ai-skin-scan-1.jpg",
        overallScore: 78,
        metrics: {
            acne: { score: 45, severity: "High", description: "Multiple pustules detected on cheeks." },
            pigmentation: { score: 80, severity: "Low", description: "Minor sun spots." },
            hydration: { score: 60, severity: "Moderate", description: "Slightly dry around T-zone." },
            wrinkles: { score: 90, severity: "Low", description: "Minimal fine lines." }
        },
        highlights: [
            { x: 120, y: 150, radius: 20, type: "acne", color: "rgba(239, 68, 68, 0.5)" }, // Red highlight
            { x: 300, y: 200, radius: 15, type: "pigmentation", color: "rgba(245, 158, 11, 0.5)" } // Amber highlight
        ]
    }
];

// ─── Mock Prescriptions ──────────────────────────────────────────────────────
export const mockPrescriptions = [
    {
        id: "presc-01",
        appointmentId: "apt-01",
        patientId: "pat-01",
        doctorId: "doc-01",
        date: "2026-06-05",
        medications: [
            {
                name: "Isotretinoin 20mg",
                dosage: "1 viên/ngày",
                frequency: "Sau bữa ăn tối",
                duration: "30 ngày",
                instructions: "Uống nhiều nước, tránh thai tuyệt đối, bôi kem chống nắng."
            },
            {
                name: "Clindamycin 1% Gel",
                dosage: "Một lớp mỏng",
                frequency: "2 lần/ngày (Sáng, Tối)",
                duration: "Chấm mụn viêm",
                instructions: "Chỉ bôi vùng mụn, tránh vùng mắt và niêm mạc."
            }
        ],
        generalInstructions: "Tái khám sau 1 tháng. Dừng thuốc nếu có dấu hiệu dị ứng nghiêm trọng."
    }
];

// ─── Mock Lab Tests ──────────────────────────────────────────────────────────
export const mockLabTests = [
    {
        id: "lab-01",
        patientId: "pat-01",
        appointmentId: "apt-01",
        testName: "Xét nghiệm máu tổng quát & Chức năng gan",
        dateRequested: "2026-06-01",
        dateCompleted: "2026-06-02",
        status: "Completed",
        resultsUrl: "https://example.com/lab-report-01.pdf",
        summary: "Men gan (AST/ALT) trong giới hạn bình thường. Đủ điều kiện sử dụng Isotretinoin."
    }
];

// ─── Mock Assigned Tasks (Technician) ─────────────────────────────────────────
export const mockAssignedTasks = [
    {
        id: "TASK-001",
        patientId: "PAT-1029",
        patientName: "Nguyễn Văn A",
        age: 28,
        gender: "Nam",
        procedureType: "Soi da cắt lớp",
        assignedBy: "Dr. Trần B",
        status: "Chờ thực hiện",
        requestTime: "2026-06-01T08:30:00",
        notes: "Kiểm tra kỹ vùng má phải có dấu hiệu thâm nám sâu.",
        procedureDetails: {
            type: "Imaging",
            requiredImages: 3
        }
    },
    {
        id: "TASK-002",
        patientId: "PAT-1035",
        patientName: "Trần Thị C",
        age: 45,
        gender: "Nữ",
        procedureType: "Xét nghiệm máu tổng quát",
        assignedBy: "Dr. Lê D",
        status: "Chờ thực hiện",
        requestTime: "2026-06-01T09:00:00",
        notes: "Ưu tiên làm nhanh, bệnh nhân đang đợi kết quả để kê đơn.",
        procedureDetails: {
            type: "LabTest",
            metrics: ["Hồng cầu", "Bạch cầu", "Đường huyết", "Men gan"]
        }
    }
];

// ─── Mock Technician Shifts ──────────────────────────────────────────────────
export const mockTechnicianShifts = [
    {
        id: "SHIFT-01",
        date: "2026-06-01",
        shift: "Sáng (08:00 - 12:00)",
        status: "Confirmed"
    },
    {
        id: "SHIFT-02",
        date: "2026-06-01",
        shift: "Chiều (13:30 - 17:30)",
        status: "Pending"
    }
];

// ————— Mock Employees ———————————————————————————————————————————————————————————
export const mockEmployees = [
    {
        id: "EMP-001",
        name: "Dr. Nguyễn Văn A",
        role: "Bác sĩ",
        department: "Da liễu tổng quát",
        email: "nguyenvana@pristine.com",
        phone: "0901234567",
        status: "Hoạt động",
        joinDate: "2023-01-15"
    },
    {
        id: "EMP-002",
        name: "Trần Thị B",
        role: "Lễ tân",
        department: "Lễ tân",
        email: "tranthib@pristine.com",
        phone: "0909876543",
        status: "Hoạt động",
        joinDate: "2023-03-20"
    }
];

// ————— Mock Vouchers ————————————————————————————————————————————————————————————
export const mockVouchers = [
    {
        id: "VOUCH-NEW10",
        code: "WELCOME10",
        discountType: "Percentage",
        discountValue: 10,
        maxDiscountAmount: 500000,
        validFrom: "2024-01-01",
        validTo: "2024-12-31",
        status: "Hoạt động",
        usageCount: 45,
        maxUsage: 100
    },
    {
        id: "VOUCH-ACNE20",
        code: "ACNECLEAR",
        discountType: "Fixed",
        discountValue: 200000,
        maxDiscountAmount: 200000,
        validFrom: "2024-05-01",
        validTo: "2024-08-31",
        status: "Hết hạn",
        usageCount: 150,
        maxUsage: 150
    }
];

// ————— Mock System Logs —————————————————————————————————————————————————————————
export const mockSystemLogs = [
    {
        id: "LOG-1029",
        timestamp: "2024-06-01T08:30:00Z",
        actor: "Admin (Admin01)",
        action: "UPDATE_EMPLOYEE_ROLE",
        target: "EMP-002",
        details: "Thay đổi vai trò từ Lễ tân thành Lễ tân trưởng",
        severity: "Info"
    },
    {
        id: "LOG-1030",
        timestamp: "2024-06-01T09:15:22Z",
        actor: "Hệ thống",
        action: "AUTO_BACKUP",
        target: "Database",
        details: "Sao lưu tự động hàng ngày thành công",
        severity: "Success"
    }
];


