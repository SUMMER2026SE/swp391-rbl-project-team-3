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
        doctorId: "doc-01",
        doctorName: "BS. CKII. Trần Văn A",
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

// ─── Mock Medical Records (Full Detail) ─────────────────────────────────────
export const mockMedicalRecords = [
    {
        id: "rec-01",
        patientId: "pat-01",
        appointmentId: "apt-05",

        // ── Thông tin khám ──
        date: "20/05/2026",
        time: "09:30",
        doctorId: "doc-01",
        doctor: "BS. CKII. Trần Văn A",
        specialty: "Da liễu lâm sàng",
        service: "Khám Da Liễu Tổng Quát",
        fee: "300,000 VNĐ",
        paymentStatus: "Đã thanh toán",
        status: "completed",

        // ── Thông tin bệnh nhân tại thời điểm khám ──
        patient: {
            id: "pat-01",
            fullName: "Lê Minh Khôi",
            dob: "1995-03-15",
            gender: "Nam",
            phone: "0901 234 567",
            email: "leminhkhoi@gmail.com",
            address: "45 Nguyễn Huệ, Quận 1, TP. HCM",
            avatar: "https://i.pravatar.cc/150?u=pat01",
        },

        // ── Triệu chứng ──
        symptoms: "Da khô, ngứa ngáy nhiều vùng tay và cổ. Nổi mẩn đỏ tái phát sau 2 tuần dùng thuốc. Không sốt, không phù.",
        vitalSigns: {
            weight: "68 kg",
            height: "172 cm",
            bloodPressure: "118/76 mmHg",
            pulse: "72 lần/phút",
            temperature: "36.8°C",
            spo2: "98%",
        },

        // ── Chẩn đoán ──
        diagnosis: "Viêm da cơ địa (Eczema) mức độ trung bình",
        diagnosisCode: "L20.9",
        diagnosisDetail: "Bệnh nhân có tiền sử viêm da cơ địa. Hiện tái phát với các mảng đỏ ngứa đối xứng hai bên cẳng tay và cổ sau. Không có dấu hiệu nhiễm khuẩn thứ phát.",

        // ── Kết quả AI Skin Analysis ──
        aiAnalysis: {
            analysisDate: "20/05/2026",
            overallScore: 62,
            skinType: "Hỗn hợp thiên khô",
            metrics: [
                { label: "Độ ẩm", score: 38, maxScore: 100, severity: "Thấp", color: "rose", description: "Da thiếu ẩm nghiêm trọng, vùng má và cổ." },
                { label: "Dầu nhờn", score: 72, maxScore: 100, severity: "Cao", color: "amber", description: "Tiết dầu nhiều vùng T-zone." },
                { label: "Sắc tố (Melanin)", score: 55, maxScore: 100, severity: "Trung bình", color: "yellow", description: "Tăng sắc tố nhẹ do viêm cũ." },
                { label: "Độ nhạy cảm", score: 80, maxScore: 100, severity: "Cao", color: "rose", description: "Da phản ứng mạnh với tác nhân ngoài môi trường." },
                { label: "Nếp nhăn", score: 88, maxScore: 100, severity: "Thấp", color: "emerald", description: "Ít nếp nhăn, phù hợp độ tuổi." },
                { label: "Lỗ chân lông", score: 65, maxScore: 100, severity: "Trung bình", color: "sky", description: "Lỗ chân lông giãn nhẹ vùng mũi." },
            ],
            recommendation: "Ưu tiên dưỡng ẩm chuyên sâu, tránh sản phẩm có cồn và hương liệu. Sử dụng kem chống nắng vật lý SPF50+.",
            analyzedBy: "KTV. Lê Thị C",
        },

        // ── Kế hoạch điều trị ──
        treatmentPlan: {
            title: "Phác đồ điều trị Eczema — Giai đoạn cấp",
            duration: "4 tuần",
            sessions: 2,
            totalSessions: 3,
            steps: [
                { step: 1, description: "Bôi Hydrocortisone 1% vùng tổn thương 2 lần/ngày trong 7 ngày đầu." },
                { step: 2, description: "Dưỡng ẩm liên tục với kem Cetaphil hoặc Vaseline sau mỗi lần tắm." },
                { step: 3, description: "Uống Cetirizine 10mg buổi tối để kiểm soát ngứa." },
                { step: 4, description: "Tái khám sau 2 tuần để đánh giá hiệu quả và điều chỉnh phác đồ." },
            ],
            restrictions: ["Tránh xà phòng có chất tẩy mạnh", "Không gãi vùng tổn thương", "Hạn chế tiếp xúc nước nóng kéo dài", "Tránh vải tổng hợp, nên mặc cotton"],
            doctorNotes: "Bệnh nhân cần theo dõi phản ứng da khi dùng Hydrocortisone. Nếu không cải thiện sau 1 tuần cần tái khám sớm.",
        },

        // ── Đơn thuốc chi tiết ──
        prescriptions: [
            {
                name: "Hydrocortisone Cream 1%",
                type: "Thuốc bôi",
                dosage: "Một lớp mỏng",
                frequency: "2 lần/ngày (Sáng & Tối)",
                duration: "7 ngày",
                quantity: "1 tuýp 30g",
                instructions: "Bôi vùng da tổn thương sau khi làm sạch và thấm khô da. Không bôi lên da lành.",
                sideEffects: "Có thể teo da nếu dùng kéo dài.",
            },
            {
                name: "Cetirizine 10mg",
                type: "Thuốc uống",
                dosage: "1 viên",
                frequency: "1 lần/ngày (Buổi tối)",
                duration: "14 ngày",
                quantity: "14 viên",
                instructions: "Uống sau bữa ăn tối, tránh lái xe khi mới dùng.",
                sideEffects: "Buồn ngủ nhẹ.",
            },
            {
                name: "Cetaphil Moisturizing Cream",
                type: "Kem dưỡng ẩm",
                dosage: "Lượng vừa đủ",
                frequency: "3–4 lần/ngày",
                duration: "Dùng liên tục",
                quantity: "1 hũ 250g",
                instructions: "Thoa toàn thân ngay sau khi tắm (trong vòng 3 phút), đặc biệt vùng tay và cổ.",
                sideEffects: "Không ghi nhận.",
            },
        ],

        // ── Lịch sử điều trị (các thủ thuật đã thực hiện trong buổi này) ──
        treatmentHistory: [
            {
                id: "th-01",
                date: "20/05/2026",
                procedure: "Khám lâm sàng da liễu",
                performedBy: "BS. CKII. Trần Văn A",
                role: "Bác sĩ",
                result: "Xác định viêm da cơ địa tái phát mức trung bình",
                duration: "20 phút",
            },
            {
                id: "th-02",
                date: "20/05/2026",
                procedure: "Đo chỉ số da bằng máy quang phổ",
                performedBy: "KTV. Lê Thị C",
                role: "Kỹ thuật viên",
                result: "Độ ẩm 38/100 — thiếu ẩm nghiêm trọng",
                duration: "15 phút",
            },
        ],

        // ── Hình ảnh trước – sau điều trị ──
        beforeAfterImages: [
            {
                id: "img-01",
                label: "Vùng cẳng tay trái",
                beforeUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop",
                afterUrl: "https://images.unsplash.com/photo-1559839914-17aae19cec71?w=400&h=300&fit=crop",
                beforeDate: "20/05/2026",
                afterDate: "03/06/2026",
                note: "Giảm đỏ và bong tróc rõ rệt sau 2 tuần điều trị.",
            },
            {
                id: "img-02",
                label: "Vùng cổ sau",
                beforeUrl: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&h=300&fit=crop",
                afterUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
                beforeDate: "20/05/2026",
                afterDate: "03/06/2026",
                note: "Vùng cổ cải thiện tốt, không còn vảy.",
            },
        ],

        // ── Lịch sử tái khám & tiến triển bệnh ──
        followUps: [
            {
                id: "fu-01",
                date: "03/06/2026",
                doctor: "BS. CKII. Trần Văn A",
                type: "Tái khám định kỳ",
                progress: "Cải thiện 60% — da bớt đỏ, không còn chảy dịch",
                progressLevel: 60,
                notes: "Tiếp tục dưỡng ẩm, giảm liều Hydrocortisone còn 1 lần/ngày.",
                status: "Hoàn thành",
            },
            {
                id: "fu-02",
                date: "17/06/2026",
                doctor: "BS. CKII. Trần Văn A",
                type: "Tái khám cuối liệu trình",
                progress: "Cải thiện 90% — da gần như bình thường",
                progressLevel: 90,
                notes: "Dừng Hydrocortisone. Duy trì dưỡng ẩm hàng ngày. Tái khám nếu tái phát.",
                status: "Hoàn thành",
            },
        ],

        // ── Ghi chú tổng hợp ──
        notes: "Tái khám sau 2 tuần. Tránh tiếp xúc xà phòng mạnh. Bệnh nhân được tư vấn chế độ sinh hoạt và chăm sóc da tại nhà.",
        technicianNotes: "Máy soi da cho thấy tổn thương lớp biểu bì, không có dấu hiệu nấm. Đã chụp ảnh lưu hồ sơ.",
    },

    // ── Hồ sơ 2: Soi Da AI ──
    {
        id: "rec-02",
        patientId: "pat-01",
        appointmentId: "apt-06",

        date: "10/05/2026",
        time: "15:00",
        doctorId: "doc-03",
        doctor: "KTV. Lê Thị C",
        specialty: "Phân tích da liễu AI",
        service: "Soi Da AI Chuyên Sâu",
        fee: "500,000 VNĐ",
        paymentStatus: "Đã thanh toán",
        status: "completed",

        patient: {
            id: "pat-01",
            fullName: "Lê Minh Khôi",
            dob: "1995-03-15",
            gender: "Nam",
            phone: "0901 234 567",
            email: "leminhkhoi@gmail.com",
            address: "45 Nguyễn Huệ, Quận 1, TP. HCM",
            avatar: "https://i.pravatar.cc/150?u=pat01",
        },

        symptoms: "Muốn kiểm tra tổng quát tình trạng da. Da có xu hướng bóng nhờn vùng trán và mũi, khô vùng má.",
        vitalSigns: {
            weight: "68 kg",
            height: "172 cm",
            bloodPressure: "—",
            pulse: "—",
            temperature: "—",
            spo2: "—",
        },

        diagnosis: "Da hỗn hợp — thiếu ẩm, tăng tiết dầu vùng T-zone, tăng melanin nhẹ",
        diagnosisCode: "—",
        diagnosisDetail: "Kết quả soi da quang phổ cho thấy chỉ số ẩm thấp (38/100), dầu cao vùng T-zone (72/100), melanin tăng rải rác. Không phát hiện tổn thương nghiêm trọng.",

        aiAnalysis: {
            analysisDate: "10/05/2026",
            overallScore: 78,
            skinType: "Hỗn hợp thiên dầu",
            metrics: [
                { label: "Độ ẩm", score: 38, maxScore: 100, severity: "Thấp", color: "rose", description: "Vùng má và cổ thiếu ẩm." },
                { label: "Dầu nhờn", score: 72, maxScore: 100, severity: "Cao", color: "amber", description: "Tiết dầu nhiều T-zone." },
                { label: "Sắc tố (Melanin)", score: 60, maxScore: 100, severity: "Trung bình", color: "yellow", description: "Sắc tố tăng nhẹ vùng T-zone." },
                { label: "Độ nhạy cảm", score: 45, maxScore: 100, severity: "Trung bình", color: "sky", description: "Da ít nhạy cảm, bình thường." },
                { label: "Nếp nhăn", score: 90, maxScore: 100, severity: "Thấp", color: "emerald", description: "Không ghi nhận nếp nhăn đáng kể." },
                { label: "Lỗ chân lông", score: 55, maxScore: 100, severity: "Trung bình", color: "sky", description: "Lỗ chân lông giãn vừa vùng mũi." },
            ],
            recommendation: "Dùng Niacinamide 10% để kiểm soát dầu và mờ sắc tố. Bổ sung dưỡng ẩm không dầu. Chống nắng SPF50+ mỗi ngày.",
            analyzedBy: "KTV. Lê Thị C",
        },

        treatmentPlan: {
            title: "Kế hoạch chăm sóc da hàng ngày",
            duration: "3 tháng",
            sessions: 1,
            totalSessions: 3,
            steps: [
                { step: 1, description: "Sử dụng Niacinamide Serum 10% buổi sáng sau bước toner." },
                { step: 2, description: "Kem dưỡng ẩm không dầu (oil-free moisturizer) sáng và tối." },
                { step: 3, description: "Chống nắng SPF50+ PA++++ mỗi sáng, thoa lại sau 2-3 giờ." },
                { step: 4, description: "Tái soi da sau 1 tháng để theo dõi hiệu quả." },
            ],
            restrictions: ["Không dùng sản phẩm có cồn", "Tránh nắng trực tiếp 10h–14h", "Không nặn mụn tự phát"],
            doctorNotes: "Chỉ số da sẽ cải thiện sau 4–6 tuần nếu thực hiện đúng phác đồ.",
        },

        prescriptions: [
            {
                name: "Niacinamide Serum 10%",
                type: "Serum dưỡng da",
                dosage: "3–4 giọt",
                frequency: "1 lần/ngày (Buổi sáng)",
                duration: "3 tháng",
                quantity: "1 lọ 30ml",
                instructions: "Thoa đều sau bước toner, trước kem dưỡng. Tránh mắt.",
                sideEffects: "Có thể gây kích ứng nhẹ khi mới dùng.",
            },
            {
                name: "Kem chống nắng SPF50+ PA++++",
                type: "Kem bảo vệ",
                dosage: "Lượng bằng 2 ngón tay",
                frequency: "Mỗi sáng & thoa lại sau 2-3h",
                duration: "Dùng hàng ngày",
                quantity: "1 tuýp 50ml",
                instructions: "Thoa bước cuối cùng buổi sáng, 15-20 phút trước khi ra nắng.",
                sideEffects: "Không ghi nhận.",
            },
        ],

        treatmentHistory: [
            {
                id: "th-03",
                date: "10/05/2026",
                procedure: "Soi da quang phổ đa tầng (AI Skin Scanner)",
                performedBy: "KTV. Lê Thị C",
                role: "Kỹ thuật viên",
                result: "Ẩm 38/100, dầu 72/100, melanin tăng nhẹ T-zone",
                duration: "30 phút",
            },
            {
                id: "th-04",
                date: "10/05/2026",
                procedure: "Tư vấn phác đồ chăm sóc da cá nhân",
                performedBy: "KTV. Lê Thị C",
                role: "Kỹ thuật viên",
                result: "Đã tư vấn và lập kế hoạch chăm sóc 3 tháng",
                duration: "15 phút",
            },
        ],

        beforeAfterImages: [
            {
                id: "img-03",
                label: "Ảnh soi da toàn mặt",
                beforeUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop",
                afterUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=300&fit=crop",
                beforeDate: "10/05/2026",
                afterDate: "10/06/2026",
                note: "Da đều màu hơn sau 1 tháng dùng Niacinamide.",
            },
        ],

        followUps: [
            {
                id: "fu-03",
                date: "10/06/2026",
                doctor: "KTV. Lê Thị C",
                type: "Tái soi da",
                progress: "Cải thiện 35% — dầu giảm, melanin mờ hơn",
                progressLevel: 35,
                notes: "Tiếp tục phác đồ, bổ sung AHA/BHA 1-2 lần/tuần.",
                status: "Hoàn thành",
            },
        ],

        notes: "Tái soi sau 1 tháng để đánh giá hiệu quả.",
        technicianNotes: "Kết quả soi da được lưu trữ đầy đủ trong hệ thống. Bệnh nhân hài lòng với kết quả tư vấn.",
    },

    // ── Hồ sơ 3: Điều trị Nám ──
    {
        id: "rec-03",
        patientId: "pat-02",
        appointmentId: "apt-07",

        date: "15/05/2026",
        time: "10:30",
        doctorId: "doc-02",
        doctor: "ThS. BS. Nguyễn Thị B",
        specialty: "Laser & Thẩm mỹ da",
        service: "Điều Trị Nám Chuyên Sâu",
        fee: "1,800,000 VNĐ",
        paymentStatus: "Đã thanh toán",
        status: "completed",

        patient: {
            id: "pat-02",
            fullName: "Trần Thị Hồng Nhung",
            dob: "1990-08-22",
            gender: "Nữ",
            phone: "0912 345 678",
            email: "hongnhung.tran@gmail.com",
            address: "123 Đường Ba Tháng Hai, Quận 10, TP. HCM",
            avatar: "https://i.pravatar.cc/150?u=pat02",
        },

        symptoms: "Nám xuất hiện 2 vùng gò má, lan rộng hơn trong 6 tháng gần đây. Tiền sử nám gia đình.",
        vitalSigns: {
            weight: "54 kg",
            height: "160 cm",
            bloodPressure: "112/72 mmHg",
            pulse: "78 lần/phút",
            temperature: "36.6°C",
            spo2: "99%",
        },

        diagnosis: "Nám da hỗn hợp (Melasma Mixed Type) — giai đoạn điều trị buổi 2/6",
        diagnosisCode: "L81.1",
        diagnosisDetail: "Nám hỗn hợp vùng gò má 2 bên. Đáp ứng tốt với phác đồ kết hợp laser toning và kem bôi tại nhà. Cải thiện 40% so với buổi đầu.",

        aiAnalysis: {
            analysisDate: "15/05/2026",
            overallScore: 70,
            skinType: "Da hỗn hợp",
            metrics: [
                { label: "Sắc tố (Melanin)", score: 35, maxScore: 100, severity: "Trung bình", color: "yellow", description: "Nám giảm 40% so với buổi 1, melanin vẫn còn cao." },
                { label: "Độ ẩm", score: 65, maxScore: 100, severity: "Trung bình", color: "sky", description: "Ẩm da bình thường." },
                { label: "Dầu nhờn", score: 50, maxScore: 100, severity: "Bình thường", color: "emerald", description: "Tiết dầu ổn định." },
                { label: "Độ nhạy cảm", score: 60, maxScore: 100, severity: "Trung bình", color: "amber", description: "Da hơi nhạy sau laser." },
                { label: "Nếp nhăn", score: 82, maxScore: 100, severity: "Thấp", color: "emerald", description: "Ít nếp nhăn." },
                { label: "Lỗ chân lông", score: 75, maxScore: 100, severity: "Thấp", color: "emerald", description: "Lỗ chân lông nhỏ, không giãn." },
            ],
            recommendation: "Tiếp tục phác đồ laser toning kết hợp kem bôi. Chống nắng nghiêm ngặt là bắt buộc.",
            analyzedBy: "ThS. BS. Nguyễn Thị B",
        },

        treatmentPlan: {
            title: "Phác đồ điều trị Nám 6 buổi — Laser Toning + Bôi tại nhà",
            duration: "3 tháng",
            sessions: 2,
            totalSessions: 6,
            steps: [
                { step: 1, description: "Laser toning Q-switched Nd:YAG 532nm — 1 buổi/3 tuần." },
                { step: 2, description: "Bôi Tretinoin 0.05% tối — 3 đêm/tuần trong 12 tuần." },
                { step: 3, description: "Arbutin Serum buổi sáng để kiểm soát sắc tố." },
                { step: 4, description: "Chống nắng SPF50+ PA++++ bắt buộc mỗi ngày, thoa lại 2h/lần." },
                { step: 5, description: "Đánh giá lại sau buổi 3 và 6 để điều chỉnh năng lượng laser." },
            ],
            restrictions: ["Tuyệt đối không ra nắng trực tiếp trong 48h sau laser", "Không dùng sản phẩm tẩy da chết sau laser", "Không mang thai trong liệu trình Tretinoin", "Uống đủ 2 lít nước/ngày"],
            doctorNotes: "Bệnh nhân đáp ứng tốt. Duy trì phác đồ. Có thể tăng nồng độ Tretinoin sau buổi 4 nếu da dung nạp tốt.",
        },

        prescriptions: [
            {
                name: "Tretinoin Cream 0.05%",
                type: "Thuốc bôi",
                dosage: "Lớp mỏng vùng nám",
                frequency: "3 đêm/tuần (Thứ 2, 4, 6)",
                duration: "12 tuần",
                quantity: "1 tuýp 20g",
                instructions: "Bôi tối trước ngủ, sau khi rửa mặt và thấm khô. Bắt đầu với tần suất thấp để tăng dung nạp.",
                sideEffects: "Đỏ, bong tróc nhẹ trong 2 tuần đầu. Tuyệt đối tránh thai.",
            },
            {
                name: "Arbutin Serum 2%",
                type: "Serum dưỡng da",
                dosage: "3–4 giọt",
                frequency: "1 lần/ngày (Buổi sáng)",
                duration: "3 tháng",
                quantity: "1 lọ 30ml",
                instructions: "Thoa sáng sau toner, trước kem dưỡng và chống nắng.",
                sideEffects: "Không ghi nhận.",
            },
            {
                name: "Kem chống nắng Anthelios SPF50+ PA++++",
                type: "Chống nắng",
                dosage: "Đủ 2 ngón tay",
                frequency: "Mỗi sáng + thoa lại mỗi 2h",
                duration: "Bắt buộc trong liệu trình",
                quantity: "1 tuýp 50ml",
                instructions: "Bước cuối buổi sáng. Bắt buộc ngay cả trong nhà gần cửa sổ.",
                sideEffects: "Không ghi nhận.",
            },
        ],

        treatmentHistory: [
            {
                id: "th-05",
                date: "15/05/2026",
                procedure: "Laser Toning Q-switched Nd:YAG",
                performedBy: "ThS. BS. Nguyễn Thị B",
                role: "Bác sĩ",
                result: "Buổi 2/6 hoàn thành. Da hồng nhẹ sau laser, bình thường.",
                duration: "35 phút",
            },
            {
                id: "th-06",
                date: "15/05/2026",
                procedure: "Soi da đánh giá tiến triển nám",
                performedBy: "KTV. Lê Thị C",
                role: "Kỹ thuật viên",
                result: "Cải thiện 40% melanin so với buổi đầu",
                duration: "15 phút",
            },
        ],

        beforeAfterImages: [
            {
                id: "img-04",
                label: "Vùng gò má phải",
                beforeUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=300&fit=crop",
                afterUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop",
                beforeDate: "26/04/2026",
                afterDate: "15/05/2026",
                note: "Nám mờ đi rõ rệt sau 2 buổi laser toning.",
            },
        ],

        followUps: [
            {
                id: "fu-04",
                date: "07/06/2026",
                doctor: "ThS. BS. Nguyễn Thị B",
                type: "Buổi 3/6 — Laser Toning",
                progress: "Cải thiện 60% — nám mờ 2/3",
                progressLevel: 60,
                notes: "Tăng năng lượng laser nhẹ. Da dung nạp tốt.",
                status: "Hoàn thành",
            },
            {
                id: "fu-05",
                date: "28/06/2026",
                doctor: "ThS. BS. Nguyễn Thị B",
                type: "Buổi 4/6 — Laser Toning",
                progress: "Dự kiến cải thiện 80%",
                progressLevel: 0,
                notes: "Chưa khám.",
                status: "Sắp tới",
            },
        ],

        notes: "Lần điều trị thứ 2/6. Kết quả khả quan.",
        technicianNotes: "Đã đo chỉ số melanin trước và sau laser. Kết quả tốt, bệnh nhân hài lòng.",
    },

    // ── Hồ sơ 4: Laser Vảy Nến ──
    {
        id: "rec-04",
        patientId: "pat-03",
        appointmentId: "apt-08",

        date: "18/05/2026",
        time: "08:00",
        doctorId: "doc-01",
        doctor: "BS. CKII. Trần Văn A",
        specialty: "Da liễu lâm sàng",
        service: "Trị Liệu Laser Fractional CO2",
        fee: "2,500,000 VNĐ",
        paymentStatus: "Chờ xác nhận",
        status: "completed",

        patient: {
            id: "pat-03",
            fullName: "Phạm Đức Anh",
            dob: "1988-12-05",
            gender: "Nam",
            phone: "0933 456 789",
            email: "ducanh.pham@gmail.com",
            address: "78 Lê Lợi, Quận 3, TP. HCM",
            avatar: "https://i.pravatar.cc/150?u=pat03",
        },

        symptoms: "Mảng đỏ có vảy trắng vùng khuỷu tay, đầu gối và lưng dưới. Ngứa nhiều khi thời tiết thay đổi. Bệnh kéo dài 5 năm.",
        vitalSigns: {
            weight: "75 kg",
            height: "175 cm",
            bloodPressure: "122/80 mmHg",
            pulse: "68 lần/phút",
            temperature: "36.9°C",
            spo2: "97%",
        },

        diagnosis: "Vảy nến thể mảng (Psoriasis Vulgaris) — đáp ứng tốt với Laser Fractional CO2",
        diagnosisCode: "L40.0",
        diagnosisDetail: "Vảy nến thể mảng diện tích khoảng 15% TBSA. Đáp ứng tốt với laser Fractional CO2 kết hợp thuốc bôi Calcipotriol.",

        aiAnalysis: {
            analysisDate: "18/05/2026",
            overallScore: 50,
            skinType: "Da khô, bệnh lý",
            metrics: [
                { label: "Độ ẩm", score: 25, maxScore: 100, severity: "Rất thấp", color: "rose", description: "Da cực kỳ khô do mảng vảy nến." },
                { label: "Dầu nhờn", score: 30, maxScore: 100, severity: "Thấp", color: "amber", description: "Tiết dầu ít do rối loạn hàng rào da." },
                { label: "Sắc tố (Melanin)", score: 40, maxScore: 100, severity: "Trung bình", color: "yellow", description: "Sắc tố mất đều do vảy trắng phủ." },
                { label: "Độ nhạy cảm", score: 85, maxScore: 100, severity: "Cao", color: "rose", description: "Da rất nhạy cảm, dễ kích ứng." },
                { label: "Nếp nhăn", score: 75, maxScore: 100, severity: "Thấp", color: "emerald", description: "Ít nếp nhăn do tuổi còn trẻ." },
                { label: "Lỗ chân lông", score: 70, maxScore: 100, severity: "Thấp", color: "emerald", description: "Lỗ chân lông bình thường." },
            ],
            recommendation: "Tăng cường dưỡng ẩm đặc biệt. Kết hợp laser và thuốc bôi để kiểm soát mảng vảy.",
            analyzedBy: "BS. CKII. Trần Văn A",
        },

        treatmentPlan: {
            title: "Phác đồ điều trị Vảy Nến — Laser + Thuốc bôi",
            duration: "6 tháng",
            sessions: 1,
            totalSessions: 4,
            steps: [
                { step: 1, description: "Laser Fractional CO2 — 1 buổi/6 tuần để làm mỏng mảng vảy." },
                { step: 2, description: "Calcipotriol ointment bôi vùng tổn thương 2 lần/ngày." },
                { step: 3, description: "Tacrolimus 0.1% bôi vùng mặt và nếp gấp (không dùng Calcipotriol ở những vùng này)." },
                { step: 4, description: "Kem dưỡng ẩm đặc (Vaseline/CeraVe) toàn thân ít nhất 3 lần/ngày." },
                { step: 5, description: "Tái khám sau 6 tuần để đánh giá và laser buổi tiếp theo." },
            ],
            restrictions: ["Tránh nắng 7 ngày sau laser", "Không dùng sản phẩm tẩy da chết", "Tránh stress tâm lý (yếu tố khởi phát)", "Hạn chế rượu bia"],
            doctorNotes: "Bệnh nhân theo dõi tại nhà. Liên hệ ngay nếu có dấu hiệu nhiễm trùng vùng laser.",
        },

        prescriptions: [
            {
                name: "Calcipotriol Ointment 0.005%",
                type: "Thuốc bôi",
                dosage: "Lớp mỏng",
                frequency: "2 lần/ngày",
                duration: "8 tuần",
                quantity: "2 tuýp 30g",
                instructions: "Bôi vùng khuỷu tay và đầu gối. Không bôi mặt, không bôi vùng nếp gấp.",
                sideEffects: "Kích ứng da nhẹ, tăng canxi huyết nếu dùng diện rộng quá 100g/tuần.",
            },
            {
                name: "Tacrolimus Ointment 0.1%",
                type: "Thuốc bôi",
                dosage: "Lớp mỏng",
                frequency: "2 lần/ngày",
                duration: "8 tuần",
                quantity: "1 tuýp 30g",
                instructions: "Chỉ bôi vùng mặt và nếp gấp. Tránh ánh sáng mặt trời sau khi bôi.",
                sideEffects: "Cảm giác nóng rát nhẹ ban đầu, tự hết.",
            },
            {
                name: "CeraVe Moisturizing Cream",
                type: "Kem dưỡng ẩm",
                dosage: "Lượng vừa đủ",
                frequency: "3–4 lần/ngày",
                duration: "Dùng liên tục",
                quantity: "1 hũ 340g",
                instructions: "Thoa toàn thân ngay sau tắm và khi da khô. Ưu tiên vùng tổn thương.",
                sideEffects: "Không ghi nhận.",
            },
        ],

        treatmentHistory: [
            {
                id: "th-07",
                date: "18/05/2026",
                procedure: "Laser Fractional CO2 vùng khuỷu tay & đầu gối",
                performedBy: "BS. CKII. Trần Văn A",
                role: "Bác sĩ",
                result: "Buổi 1/4. Mảng vảy mỏng đi, da hồng tươi sau laser.",
                duration: "45 phút",
            },
            {
                id: "th-08",
                date: "18/05/2026",
                procedure: "Đắp mặt nạ collagen làm dịu sau laser",
                performedBy: "KTV. Lê Thị C",
                role: "Kỹ thuật viên",
                result: "Da dịu và bớt kích ứng sau đắp",
                duration: "20 phút",
            },
        ],

        beforeAfterImages: [
            {
                id: "img-05",
                label: "Vùng khuỷu tay phải",
                beforeUrl: "https://images.unsplash.com/photo-1588776814546-1ffbb4d536d8?w=400&h=300&fit=crop",
                afterUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop",
                beforeDate: "18/05/2026",
                afterDate: "30/06/2026",
                note: "Mảng vảy giảm đáng kể sau 1,5 tháng điều trị.",
            },
        ],

        followUps: [
            {
                id: "fu-06",
                date: "29/06/2026",
                doctor: "BS. CKII. Trần Văn A",
                type: "Laser buổi 2/4 + Tái khám",
                progress: "Cải thiện 45% — vảy mỏng hơn nhiều",
                progressLevel: 45,
                notes: "Tiếp tục phác đồ. Bệnh nhân tuân thủ tốt.",
                status: "Sắp tới",
            },
        ],

        notes: "Theo dõi tại nhà, tránh nắng 7 ngày sau laser. Bệnh nhân được hướng dẫn cụ thể về chế độ chăm sóc.",
        technicianNotes: "Đã ghi hình ảnh trước và sau laser vào hồ sơ. Bệnh nhân không có phản ứng bất thường trong quá trình laser.",
    },
];

// ─── Mock Feedbacks ──────────────────────────────────────────────────────────
export const mockFeedbacks = [
    {
        id: "fb-01",
        appointmentId: "apt-05",
        patientId: "pat-01",
        patientName: "Lê Minh Khôi",
        isAnonymous: false,
        doctorId: "doc-01",
        doctorName: "BS. CKII. Trần Văn A",
        service: "Khám Da Liễu Tổng Quát",
        date: "2026-05-20",
        submittedAt: "2026-05-21T09:15:00Z",
        overallRating: 5,
        criteriaRatings: {
            doctor: 5,
            technician: 5,
            treatmentEffect: 4,
            waitingTime: 4,
            facility: 5,
        },
        comment: "Bác sĩ Trần Văn A rất tận tâm và chuyên nghiệp. Giải thích bệnh tình rõ ràng, dễ hiểu. Phòng khám sạch sẽ, hiện đại. Tôi rất hài lòng với dịch vụ.",
        images: [],
        status: "published",
        isPublic: true,
        adminReply: {
            text: "Cảm ơn anh Khôi đã tin tưởng và gửi đánh giá tích cực. Chúng tôi sẽ tiếp tục nỗ lực để phục vụ tốt hơn!",
            repliedAt: "2026-05-22T10:00:00Z",
        },
    },
    {
        id: "fb-02",
        appointmentId: "apt-07",
        patientId: "pat-02",
        patientName: "Trần Thị Hồng Nhung",
        isAnonymous: false,
        doctorId: "doc-02",
        doctorName: "ThS. BS. Nguyễn Thị B",
        service: "Điều Trị Nám Chuyên Sâu",
        date: "2026-05-15",
        submittedAt: "2026-05-16T14:30:00Z",
        overallRating: 5,
        criteriaRatings: {
            doctor: 5,
            technician: 4,
            treatmentEffect: 5,
            waitingTime: 3,
            facility: 4,
        },
        comment: "Kết quả điều trị nám rất ấn tượng! Sau 2 buổi đã thấy cải thiện rõ rệt. Bác sĩ Nguyễn Thị B rất nhiệt tình tư vấn skincare tại nhà. Thời gian chờ hơi lâu nhưng chấp nhận được.",
        images: [],
        status: "published",
        isPublic: true,
        adminReply: null,
    },
    {
        id: "fb-03",
        appointmentId: "apt-09",
        patientId: "pat-05",
        patientName: "Ẩn danh",
        isAnonymous: true,
        doctorId: "doc-01",
        doctorName: "BS. CKII. Trần Văn A",
        service: "Khám Da Liễu Tổng Quát",
        date: "2026-05-25",
        submittedAt: "2026-05-26T08:00:00Z",
        overallRating: 4,
        criteriaRatings: {
            doctor: 5,
            technician: 4,
            treatmentEffect: 4,
            waitingTime: 3,
            facility: 4,
        },
        comment: "Phòng khám sạch sẽ, nhân viên thân thiện. Bác sĩ khám kỹ và tư vấn chu đáo. Tuy nhiên thời gian chờ khá lâu, khoảng 45 phút. Mong cải thiện khâu này.",
        images: [],
        status: "published",
        isPublic: true,
        adminReply: null,
    },
    {
        id: "fb-04",
        appointmentId: "apt-08",
        patientId: "pat-03",
        patientName: "Phạm Đức Anh",
        isAnonymous: false,
        doctorId: "doc-01",
        doctorName: "BS. CKII. Trần Văn A",
        service: "Trị Liệu Laser Fractional CO2",
        date: "2026-05-18",
        submittedAt: "2026-05-19T16:00:00Z",
        overallRating: 5,
        criteriaRatings: {
            doctor: 5,
            technician: 5,
            treatmentEffect: 5,
            waitingTime: 4,
            facility: 5,
        },
        comment: "Dịch vụ laser xuất sắc! Kỹ thuật viên rất chuyên nghiệp, thực hiện đúng quy trình và giải thích từng bước. Da tôi cải thiện rõ sau 1 tuần. Sẽ quay lại điều trị tiếp.",
        images: [],
        status: "published",
        isPublic: true,
        adminReply: null,
    },
    {
        id: "fb-06",
        appointmentId: "apt-06-x",
        patientId: "pat-04",
        patientName: "Nguyễn Hoàng Mai",
        isAnonymous: false,
        doctorId: "doc-02",
        doctorName: "ThS. BS. Nguyễn Thị B",
        service: "Điều Trị Nám Chuyên Sâu",
        date: "2026-04-20",
        submittedAt: "2026-04-21T11:00:00Z",
        overallRating: 3,
        criteriaRatings: {
            doctor: 4,
            technician: 3,
            treatmentEffect: 3,
            waitingTime: 2,
            facility: 4,
        },
        comment: "Bác sĩ giỏi nhưng thời gian chờ quá lâu, gần 1 tiếng. Kết quả điều trị chưa thấy rõ sau buổi đầu, hy vọng các buổi sau sẽ tốt hơn.",
        images: [],
        status: "published",
        isPublic: true,
        adminReply: null,
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


