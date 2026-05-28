// Database schema manager for Appointments and Payments using LocalStorage
// Provides full persistence for patients, receptionists, and admins.

const APPOINTMENTS_KEY = 'dermasmart_appointments';
const PAYMENTS_KEY = 'dermasmart_payments';

const MOCK_APPOINTMENTS_INITIAL = [
  {
    appointment_id: "apt-1001",
    patient_id: "mock-patient-123",
    patient_name: "Nguyễn Văn A", // Helper for ease of rendering
    doctor_id: "doc-01",
    doctor_name: "BS. CKII. Trần Văn A",
    doctor_title: "Giám đốc chuyên môn",
    doctor_image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKEOLtn7bX1j7Zj8H8Jgrd5tm5Nms_14tDyN2ORvpoLoRUnyEdhnv5mFJ0xgWRih3680BUnvZPK1swb5wL3z45P_LO1QO7fL-e3kJezz2Z0gOhbOHTi66es7YihIzfzNd6UbeEmsxiNx-kI1bUeZgt7PN1BTHnqGCh3zeKWcl7QwLqMb_okdqroz89R3OhSgUFq7n_HRVW_3H50QTSj_ZrM9ISxDX8tI_anUHW_qXodwGPeTuRsRwil6UQ17TwKY9fanH_uILavXPK",
    receptionist_id: "rec-01",
    service_id: "srv-01",
    service_name: "Khám da liễu tổng quát",
    slot_id: "slot-01",
    appointment_date: "2026-05-29",
    start_time: "08:00",
    end_time: "09:00",
    reason: "Bị nổi mẩn đỏ dị ứng vùng má từ tối qua",
    status: "Pending",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 mins ago
  },
  {
    appointment_id: "apt-1002",
    patient_id: "mock-patient-456",
    patient_name: "Trần Thị B",
    doctor_id: "doc-02",
    doctor_name: "ThS. BS. Nguyễn Thị B",
    doctor_title: "Chuyên gia Da liễu thẩm mỹ",
    doctor_image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBt2esct_8y4gBctODjPCkYarwiTlXBeYGf9ROq8bb3QcEauPGz5QnY5VPmeMSsebZRJMkZlCdharhNmL7fN48wclPIfTpJI-ifokFi5FfKURcqKhnBwCrP-9_UGy_eCJw4crZTq33P4OxdyNXakyBR2L6UQNVL-dXLAgy_LFiw8QsnQbMiPrD7Wr9_328tVXUSFQ4lfX4JkaCiPk-SsYq3mSc6iGNkF47RU1JgpT4OSYNmBOvZzxFcbgPXPHr_If9GFD0HWeMdsbU1",
    receptionist_id: "rec-01",
    service_id: "srv-02",
    service_name: "Trị liệu Laser/Thẩm mỹ",
    slot_id: "slot-03",
    appointment_date: "2026-05-29",
    start_time: "10:00",
    end_time: "11:00",
    reason: "Điều trị liệu trình tàn nhang buổi thứ 3",
    status: "Paid",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
  },
  {
    appointment_id: "apt-1003",
    patient_id: "mock-patient-789",
    patient_name: "Lê Văn C",
    doctor_id: "doc-03",
    doctor_name: "KTV. Lê Thị C",
    doctor_title: "Chuyên gia phân tích da liễu AI",
    doctor_image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOvstfM_6hjJJ5YCSOBxCzfwbclWI1ikrRl-icFlIHxF4NygZvQxx96GFjFZxtZfN6DVX7pnrS7TqXMZUjIJfYmnBmJt_xPeHBmYZygGsmOKIPBjBM8i3v26RezTALfNa8HpJUnkSbhJc9EtGiYfDAiBXyKOX9luu3_8JaZeWEeVzHXrxAjFArFG7Hl4-cun-bgSaNdsp_yOQ1rG5R3gxsbzFqHx6KnNeKgMSV2VvD1MaqniR6tvUjr6SxPrg-FoHQyjTl83glA0FY",
    receptionist_id: "rec-01",
    service_id: "srv-03",
    service_name: "Phân tích da AI",
    slot_id: "slot-05",
    appointment_date: "2026-05-28",
    start_time: "14:00",
    end_time: "15:00",
    reason: "Soi da quang phổ phân tích chỉ số da 3D",
    status: "Completed",
    created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString() // 10 hours ago
  }
];

const MOCK_PAYMENTS_INITIAL = [
  {
    payment_id: "pay-1001",
    appointment_id: "apt-1002",
    patient_id: "mock-patient-456",
    receptionist_id: "rec-01",
    voucher_id: "WELCOME50",
    total_amount: 400000,
    discount_amount: 50000,
    final_amount: 350000,
    payment_method: "Credit Card",
    payment_status: "Paid",
    paid_at: new Date(Date.now() - 1000 * 60 * 115).toISOString()
  }
];

export const AppointmentModel = {
  // Helper to load and initialize local storage databases
  _loadAppointments() {
    try {
      const data = localStorage.getItem(APPOINTMENTS_KEY);
      if (!data) {
        localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(MOCK_APPOINTMENTS_INITIAL));
        return MOCK_APPOINTMENTS_INITIAL;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to load appointments from localStorage", e);
      return MOCK_APPOINTMENTS_INITIAL;
    }
  },

  _loadPayments() {
    try {
      const data = localStorage.getItem(PAYMENTS_KEY);
      if (!data) {
        localStorage.setItem(PAYMENTS_KEY, JSON.stringify(MOCK_PAYMENTS_INITIAL));
        return MOCK_PAYMENTS_INITIAL;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to load payments from localStorage", e);
      return MOCK_PAYMENTS_INITIAL;
    }
  },

  // APPOINTMENTS CRUD
  getAllAppointments() {
    return this._loadAppointments();
  },

  getAppointmentsByUser(patientId) {
    const list = this._loadAppointments();
    return list.filter(item => item.patient_id === patientId);
  },

  getAppointmentById(appointmentId) {
    const list = this._loadAppointments();
    return list.find(item => item.appointment_id === appointmentId) || null;
  },

  hasAppointmentOnDate(patientId, appointmentDate, excludeAppointmentId = null) {
    const list = this._loadAppointments();
    return list.some((item) => {
      if (excludeAppointmentId && item.appointment_id === excludeAppointmentId) return false;
      return item.patient_id === patientId && item.appointment_date === appointmentDate;
    });
  },

  addAppointment(aptData) {
    const patientId = aptData.patient_id || "mock-patient-123";
    const appointmentDate = aptData.appointment_date;
    if (this.hasAppointmentOnDate(patientId, appointmentDate)) {
      throw new Error('Bạn chỉ có thể đặt 1 lịch khám mỗi ngày.');
    }

    const list = this._loadAppointments();
    const newApt = {
      appointment_id: `apt-${Math.floor(1000 + Math.random() * 9000)}`,
      patient_id: patientId,
      patient_name: aptData.patient_name || "Bệnh nhân",
      doctor_id: aptData.doctor_id,
      doctor_name: aptData.doctor_name,
      doctor_title: aptData.doctor_title,
      doctor_image: aptData.doctor_image,
      receptionist_id: aptData.receptionist_id || null,
      service_id: aptData.service_id || "srv-01",
      service_name: aptData.service_name || "Khám da liễu tổng quát",
      slot_id: aptData.slot_id,
      appointment_date: appointmentDate,
      start_time: aptData.start_time,
      end_time: aptData.end_time,
      reason: aptData.reason || "",
      status: aptData.status || "Pending",
      created_at: new Date().toISOString()
    };
    list.unshift(newApt);
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(list));
    return newApt;
  },

  updateAppointment(appointmentId, updatedFields) {
    const list = this._loadAppointments();
    const idx = list.findIndex(item => item.appointment_id === appointmentId);
    if (idx === -1) {
      throw new Error(`Appointment with ID ${appointmentId} not found.`);
    }

    const existing = list[idx];
    const newPatientId = updatedFields.patient_id || existing.patient_id;
    const newAppointmentDate = updatedFields.appointment_date || existing.appointment_date;

    if (this.hasAppointmentOnDate(newPatientId, newAppointmentDate, appointmentId)) {
      throw new Error('Bạn chỉ có thể có 1 lịch khám mỗi ngày.');
    }

    list[idx] = { ...existing, ...updatedFields };
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(list));
    return list[idx];
  },

  updateAppointmentStatus(appointmentId, newStatus) {
    return this.updateAppointment(appointmentId, { status: newStatus });
  },

  // PAYMENTS CRUD
  getAllPayments() {
    return this._loadPayments();
  },

  getPaymentByAppointment(appointmentId) {
    const list = this._loadPayments();
    return list.find(item => item.appointment_id === appointmentId) || null;
  },

  addPayment(payData) {
    const list = this._loadPayments();
    const newPayment = {
      payment_id: `pay-${Math.floor(1000 + Math.random() * 9000)}`,
      appointment_id: payData.appointment_id,
      patient_id: payData.patient_id,
      receptionist_id: payData.receptionist_id || null,
      voucher_id: payData.voucher_id || null,
      total_amount: Number(payData.total_amount) || 0,
      discount_amount: Number(payData.discount_amount) || 0,
      final_amount: Number(payData.final_amount) || 0,
      payment_method: payData.payment_method || "QR Code",
      payment_status: "Paid",
      paid_at: new Date().toISOString()
    };
    list.unshift(newPayment);
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(list));

    // Also update the linked appointment to "Paid"
    try {
      this.updateAppointmentStatus(payData.appointment_id, "Paid");
    } catch (e) {
      console.warn("Linked appointment could not be updated to Paid", e);
    }

    return newPayment;
  }
};
