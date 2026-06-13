import { mockAppointments } from '../mockData';
import { DoctorModel } from './DoctorModel';
import { SystemLogModel } from './SystemLogModel';
import { NotificationModel } from './NotificationModel';

// Map Vietnamese day names to JS Date getDay() index
const DAY_MAP = {
  'Chủ Nhật': 0,
  'Thứ Hai': 1,
  'Thứ Ba': 2,
  'Thứ Tư': 3,
  'Thứ Năm': 4,
  'Thứ Sáu': 5,
  'Thứ Bảy': 6,
};

const STORAGE_KEY = 'dermasmart_appointments';
const APPOINTMENTS_KEY = 'dermasmart_appointments';
const PAYMENTS_KEY = 'dermasmart_payments';
const LOCKED_SLOTS_KEY = 'dermasmart_locked_slots';

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

const VERSION_KEY = 'dermasmart_appointments_version';
const CURRENT_VERSION = 'v3';

export const AppointmentModel = {
  // Initialize appointments — reset nếu version cũ hoặc data tiếng Anh
  init() {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    const stored = localStorage.getItem(STORAGE_KEY);

    // Force reset if version mismatch OR data has English status
    let needReset = !stored || storedVersion !== CURRENT_VERSION;
    if (!needReset && stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check if first item has English status (legacy data)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const firstStatus = parsed[0]?.status || '';
          if (['Pending','Completed','Cancelled','Confirmed'].includes(firstStatus)) {
            needReset = true;
          }
        }
      } catch { needReset = true; }
    }

    if (needReset) {
      const initialized = (mockAppointments || []).map((apt, index) => {
        if (index === 0) return { ...apt, date: "2026-06-01", status: "Đã xác nhận" };
        if (index === 1) return { ...apt, date: "2026-06-01", status: "Chờ xác nhận" };
        if (index === 2) return { ...apt, date: "2026-06-01", status: "Đang chờ" };
        if (index === 3) return { ...apt, date: "2026-06-01", status: "Chờ xác nhận" };
        return apt;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialized));
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    }
  },

  getAll() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      console.error('Error reading appointments from localStorage', e);
      return mockAppointments;
    }
  },

  save(appointments) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    // Dispatch a custom event to notify other components in real-time
    window.dispatchEvent(new CustomEvent('appointments-updated'));
  },

  getByPatientId(patientId) {
    let list = this.getAll();
    const patientApts = list.filter(a => a.patientId === patientId);
    
    // Inject mock completed appointments for any patient with no completed appointments
    const completed = patientApts.filter(a => a.status === 'Đã khám' || a.status === 'Reviewed');
    if (completed.length === 0 && patientId) {
      const mockApt1 = {
        id: `apt-mock-completed-1-${patientId}`,
        patientId: patientId,
        patientName: 'Nhựt Nguyễn Quang',
        doctorId: 'doc-01',
        doctorName: 'BS. CKII. Trần Văn A',
        date: '2026-06-05',
        time: '09:00',
        status: 'Đã khám',
        service: 'Khám Da Liễu Tổng Quát',
        paymentStatus: 'Đã thanh toán',
        fee: '300,000 VNĐ',
        diagnosis: 'Viêm da tiết bã nhẹ vùng mặt',
        prescription: 'Ketoconazole 2% cream thoa ngày 2 lần x 14 ngày',
        notes: 'Hạn chế ăn đồ cay nóng, rửa mặt bằng nước ấm.'
      };
      
      const mockApt2 = {
        id: `apt-mock-completed-2-${patientId}`,
        patientId: patientId,
        patientName: 'Nhựt Nguyễn Quang',
        doctorId: 'doc-02',
        doctorName: 'ThS. BS. Nguyễn Thị B',
        date: '2026-05-28',
        time: '14:30',
        status: 'Đã khám',
        service: 'Điều Trị Nám Chuyên Sâu',
        paymentStatus: 'Đã thanh toán',
        fee: '1,800,000 VNĐ',
        diagnosis: 'Nám mảng hai bên má, cải thiện 30%',
        prescription: 'Arbutin serum dưỡng tối, Kem chống nắng phổ rộng ban ngày',
        notes: 'Chống nắng kỹ, tái khám sau 4 tuần.'
      };

      const mockApt3 = {
        id: `apt-mock-completed-3-${patientId}`,
        patientId: patientId,
        patientName: 'Nhựt Nguyễn Quang',
        doctorId: 'doc-03',
        doctorName: 'KTV. Lê Thị C',
        date: '2026-05-30',
        time: '10:00',
        status: 'Đã khám',
        service: 'Soi Da AI Chuyên Sâu',
        paymentStatus: 'Đã thanh toán',
        fee: '500,000 VNĐ',
        diagnosis: 'Da dầu vùng chữ T, khô hai má. Cần soi kỹ các lớp sắc tố.',
        prescription: 'Sữa rửa mặt dịu nhẹ ngày 2 lần, dưỡng ẩm dạng gel.',
        notes: 'Chụp hình phân tích da AI.'
      };
      
      list.push(mockApt1, mockApt2, mockApt3);
      this.save(list);
      return [mockApt1, mockApt2, mockApt3];
    }
    
    return patientApts;
  },

  // Check if a time slot is already booked for a specific doctor
  isTimeSlotBooked(doctorId, dateStr, timeStr) {
    const list = this.getAll();
    const isBooked = list.some(
      a =>
        a.doctorId === doctorId &&
        a.date === dateStr &&
        a.time === timeStr &&
        a.status !== 'Đã hủy'
    );
    if (isBooked) return true;
    
    return this.isTimeSlotLocked(doctorId, dateStr, timeStr);
  },

  // Temporarily lock a slot
  getLockedSlots() {
    try {
      const data = localStorage.getItem(LOCKED_SLOTS_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      const now = Date.now();
      const validLocks = parsed.filter(l => l.lockedUntil > now);
      if (validLocks.length !== parsed.length) {
         localStorage.setItem(LOCKED_SLOTS_KEY, JSON.stringify(validLocks));
      }
      return validLocks;
    } catch {
      return [];
    }
  },

  lockSlot(doctorId, dateStr, timeStr, durationMinutes = 5) {
    const list = this.getLockedSlots();
    // Remove any existing locks for this slot to avoid duplicates
    const filteredList = list.filter(l => !(String(l.doctorId) === String(doctorId) && l.date === dateStr && l.time === timeStr));
    filteredList.push({
       doctorId,
       date: dateStr,
       time: timeStr,
       lockedUntil: Date.now() + durationMinutes * 60 * 1000
    });
    localStorage.setItem(LOCKED_SLOTS_KEY, JSON.stringify(filteredList));
    window.dispatchEvent(new CustomEvent('appointments-updated'));
  },

  isTimeSlotLocked(doctorId, dateStr, timeStr) {
    const list = this.getLockedSlots();
    return list.some(l => String(l.doctorId) === String(doctorId) && l.date === dateStr && l.time === timeStr);
  },

  // Get days of the week a doctor is scheduled to work
  getDoctorWorkingDays(doctorId) {
    const doc = DoctorModel.getDoctorById(doctorId);
    if (!doc) return [];
    
    // Look up in admin-doctor-schedules from Admin
    const savedAdmin = localStorage.getItem('admin-doctor-schedules');
    const adminSchedules = savedAdmin ? JSON.parse(savedAdmin) : [];
    const assignedSchedules = adminSchedules.filter(s => s.doctorName === doc.name && s.status !== 'Đã hủy');
    
    if (assignedSchedules.length > 0) {
      return assignedSchedules.map(s => DAY_MAP[s.day] !== undefined ? DAY_MAP[s.day] : -1).filter(d => d !== -1);
    }
    
    if (!doc.schedule) return [];
    
    // Map schedule days like "Thứ Hai" to numeric day index (1)
    return doc.schedule.map(s => DAY_MAP[s.day] !== undefined ? DAY_MAP[s.day] : -1).filter(d => d !== -1);
  },

  // Parse YYYY-MM-DD safely into a local Date object
  getLocalDayOfWeek(dateStr) {
    if (!dateStr) return -1;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return -1;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day).getDay();
  },

  // Business Rules validation for booking an appointment
  validateBooking(bookingData) {
    const { doctorId, patientId, patientPhone, patientEmail, date, time } = bookingData;
    
    // Rule 1: Date must be tomorrow or later
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const parts = date.split('-');
    const selectDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    selectDate.setHours(0, 0, 0, 0);

    if (selectDate < tomorrow) {
      return { valid: false, error: 'Ngày đặt khám tối thiểu phải từ ngày mai trở đi.' };
    }

    // Rule 2: Doctor must be working on that day
    const dayOfWeek = this.getLocalDayOfWeek(date);
    const workingDays = this.getDoctorWorkingDays(doctorId);
    if (workingDays.length > 0 && !workingDays.includes(dayOfWeek)) {
      const doc = DoctorModel.getDoctorById(doctorId);
      const scheduleStr = doc ? doc.schedule.map(s => s.day).join(', ') : '';
      return {
        valid: false,
        error: `Bác sĩ không có lịch trực vào ngày này. Lịch làm việc của bác sĩ: ${scheduleStr}.`,
      };
    }

    // Rule 3: No double booking for doctor
    if (this.isTimeSlotBooked(doctorId, date, time)) {
      return { valid: false, error: 'Khung giờ này đã được đặt trước cho bác sĩ này. Vui lòng chọn khung giờ khác.' };
    }

    // Rule 6: No double booking for patient (Patient cannot book two different appointments at the same day & time slot)
    const allAppointments = this.getAll();
    const isPatientBusy = allAppointments.some(
      a =>
        a.status !== 'Đã hủy' &&
        a.date === date &&
        a.time === time &&
        (
          (patientId && a.patientId === patientId) ||
          (patientPhone && a.patientPhone === patientPhone) ||
          (patientEmail && a.patientEmail === patientEmail)
        )
    );
    if (isPatientBusy) {
      return {
        valid: false,
        error: `Bạn đã có một lịch hẹn khác vào khung giờ ${time} ngày ${date}. Mỗi người chỉ có thể đặt 1 lịch khám tại cùng một thời điểm.`,
      };
    }

    // If patientId is provided, enforce patient-specific limits
    if (patientId) {
      const patientAppointments = this.getByPatientId(patientId);
      
      // Rule 4: Max 2 upcoming appointments
      const upcoming = patientAppointments.filter(
        a => a.status === 'Đang chờ' || a.status === 'Đã xác nhận' || a.status === 'Chờ xác nhận'
      );
      if (upcoming.length >= 2) {
        return {
          valid: false,
          error: 'Bạn đã có 2 lịch hẹn sắp tới. Vui lòng hoàn thành hoặc hủy lịch cũ trước khi đặt lịch mới.',
        };
      }

      // Rule 5: Cannot book the same doctor on the same day twice
      const sameDayDoc = patientAppointments.some(
        a => a.doctorId === doctorId && a.date === date && a.status !== 'Đã hủy'
      );
      if (sameDayDoc) {
        return {
          valid: false,
          error: 'Bạn đã có một lịch hẹn với bác sĩ này trong cùng một ngày.',
        };
      }
    }

    return { valid: true };
  },

  // Book a new appointment
  book(bookingData) {
    const validation = this.validateBooking(bookingData);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const appointments = this.getAll();
    const doc = DoctorModel.getDoctorById(bookingData.doctorId);

    const newApt = {
      id: `apt-${Date.now()}`,
      patientId: bookingData.patientId || `pat-guest-${Date.now()}`,
      patientName: bookingData.patientName,
      doctorId: bookingData.doctorId,
      doctorName: doc ? doc.name : 'Chưa chỉ định',
      date: bookingData.date,
      time: bookingData.time,
      status: 'Chờ xác nhận', // Guest & standard patient bookings start as Pending
      service: bookingData.service,
      paymentStatus: 'Chua thanh toan',
      fee: bookingData.fee || '300,000 VNĐ',
      notes: bookingData.notes || '',
      patientPhone: bookingData.patientPhone || '',
      patientEmail: bookingData.patientEmail || '',
    };

    appointments.unshift(newApt);
    this.save(appointments);
    return newApt;
  },

  // Check if cancellation is allowed (minimum 24 hours prior)
  canCancel(appointment) {
    if (!appointment) return false;
    
    // Parse appointment date and time
    const [year, month, day] = appointment.date.split('-').map(Number);
    const [hours, minutes] = appointment.time.split(':').map(Number);
    
    const aptDateTime = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();
    
    // Calculate difference in milliseconds
    const diffMs = aptDateTime - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return diffHours >= 24;
  },

  // Cancel an appointment
  cancel(appointmentId) {
    const appointments = this.getAll();
    const aptIdx = appointments.findIndex(a => a.id === appointmentId);
    if (aptIdx === -1) {
      throw new Error('Không tìm thấy lịch hẹn cần hủy.');
    }

    const apt = appointments[aptIdx];
    if (!this.canCancel(apt)) {
      throw new Error('Không thể tự hủy lịch hẹn trực tuyến sát giờ khám (dưới 24 giờ). Vui lòng liên hệ Hotline phòng khám để được hỗ trợ.');
    }

    appointments[aptIdx] = { ...apt, status: 'Đã hủy' };
    this.save(appointments);
    return appointments[aptIdx];
  },

  applySurcharge(feeStr, amount) {
    if (!feeStr) return `${amount.toLocaleString('vi-VN')} VNĐ`;
    const numbers = feeStr.replace(/[^0-9]/g, '');
    if (!numbers) return `${amount.toLocaleString('vi-VN')} VNĐ`;
    const currentVal = parseInt(numbers, 10);
    const newVal = currentVal + amount;
    return `${newVal.toLocaleString('vi-VN')} VNĐ`;
  },

  // Reschedule an appointment
  reschedule(appointmentId, newDate, newTime) {
    const appointments = this.getAll();
    const aptIdx = appointments.findIndex(a => a.id === appointmentId);
    if (aptIdx === -1) {
      throw new Error('Không tìm thấy lịch hẹn.');
    }

    const apt = appointments[aptIdx];

    // Rule 1: Max 2 reschedules check
    const currentCount = apt.rescheduleCount || 0;
    if (currentCount >= 2) {
      throw new Error('Bạn đã đổi lịch tối đa 2 lần cho cuộc hẹn này. Theo quy định, không thể đổi lịch tiếp. Vui lòng Hủy lịch hoặc liên hệ Lễ tân.');
    }

    // Rule 2: 24h check (Warning & surcharge instead of blocking)
    const isCloseToTime = !this.canCancel(apt);
    let surchargeMessage = '';
    let updatedFee = apt.fee;
    
    if (isCloseToTime) {
      updatedFee = this.applySurcharge(apt.fee, 50000);
      surchargeMessage = ' (Tính thêm phụ phí 50.000 VNĐ đổi lịch sát giờ)';
    }

    // 1. Date must be tomorrow or later
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const parts = newDate.split('-');
    const selectDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    selectDate.setHours(0, 0, 0, 0);

    if (selectDate < tomorrow) {
      throw new Error('Ngày hẹn mới tối thiểu phải từ ngày mai trở đi.');
    }

    // 2. Doctor working schedule check
    const dayOfWeek = this.getLocalDayOfWeek(newDate);
    const workingDays = this.getDoctorWorkingDays(apt.doctorId);
    if (workingDays.length > 0 && !workingDays.includes(dayOfWeek)) {
      const doc = DoctorModel.getDoctorById(apt.doctorId);
      const scheduleStr = doc ? doc.schedule.map(s => s.day).join(', ') : '';
      throw new Error(`Bác sĩ không có lịch trực vào ngày này. Lịch làm việc của bác sĩ: ${scheduleStr}.`);
    }

    // 3. Prevent doctor double booking
    const isBooked = appointments.some(
      a =>
        a.id !== appointmentId &&
        a.doctorId === apt.doctorId &&
        a.date === newDate &&
        a.time === newTime &&
        a.status !== 'Đã hủy'
    );
    if (isBooked) {
      throw new Error('Khung giờ này đã được đặt trước cho bác sĩ này. Vui lòng chọn khung giờ khác.');
    }

    // 3.5. Room & Equipment availability check
    // If another appointment with the same service on the same slot exists, equipment is occupied
    const isEquipOccupied = appointments.some(
      a =>
        a.id !== appointmentId &&
        a.service === apt.service &&
        a.date === newDate &&
        a.time === newTime &&
        a.status !== 'Đã hủy'
    );
    if (isEquipOccupied) {
      throw new Error('Phòng điều trị hoặc thiết bị/máy móc cho dịch vụ này đã kẹt vào khung giờ đã chọn. Vui lòng chọn khung giờ khác.');
    }

    // 4. Prevent patient double-booking themselves
    const isPatientBusy = appointments.some(
      a =>
        a.id !== appointmentId &&
        a.status !== 'Đã hủy' &&
        a.date === newDate &&
        a.time === newTime &&
        (
          (apt.patientId && a.patientId === apt.patientId) ||
          (apt.patientPhone && a.patientPhone === apt.patientPhone) ||
          (apt.patientEmail && a.patientEmail === apt.patientEmail)
        )
    );
    if (isPatientBusy) {
      throw new Error(`Bạn đã có một lịch hẹn khác vào khung giờ ${newTime} ngày ${newDate}.`);
    }

    // Rule 5: Audit log in appointment history
    const history = apt.history || [];
    const logDetails = `Đổi lịch khám từ [${apt.date} ${apt.time}] sang [${newDate} ${newTime}]. Số lần đổi: ${currentCount + 1}/2.${surchargeMessage}`;
    history.push({
      action: 'RESCHEDULE',
      timestamp: new Date().toISOString(),
      details: logDetails,
      feeUpdated: updatedFee !== apt.fee,
    });

    // Update appointment
    appointments[aptIdx] = {
      ...apt,
      date: newDate,
      time: newTime,
      fee: updatedFee,
      rescheduleCount: currentCount + 1,
      history,
      status: 'Chờ xác nhận', // Rescheduled appointment goes back to Pending Approval
    };
    
    this.save(appointments);

    // Rule 6: Audit log in SystemLogModel
    SystemLogModel.addLog(
      `Bệnh nhân (${apt.patientName})`,
      'RESCHEDULE_APPOINTMENT',
      appointmentId,
      `Đã đổi lịch hẹn ${appointmentId} sang ${newDate} ${newTime}. Số lần đổi: ${currentCount + 1}/2.${surchargeMessage}`,
      'Info'
    );

    // Rule 7: Dispatch notifications
    NotificationModel.sendNotification(
      'PATIENT',
      apt.patientId,
      'Đổi lịch hẹn thành công',
      `Lịch hẹn của bạn với bác sĩ ${apt.doctorName} đã được đổi sang ngày ${newDate} lúc ${newTime}. Số lần đổi: ${currentCount + 1}/2.${surchargeMessage}`
    );
    NotificationModel.sendNotification(
      'DOCTOR',
      apt.doctorId,
      'Bệnh nhân đổi lịch khám',
      `Bệnh nhân ${apt.patientName} đã đổi lịch khám sang ngày ${newDate} lúc ${newTime}.`
    );
    NotificationModel.sendNotification(
      'RECEPTIONIST',
      'all',
      'Yêu cầu đổi lịch mới',
      `Bệnh nhân ${apt.patientName} yêu cầu đổi lịch hẹn ${appointmentId} sang ngày ${newDate} lúc ${newTime}.`
    );

    return appointments[aptIdx];
  },

  // Administrative actions (for receptionist)
  updateStatus(appointmentId, status) {
    const appointments = this.getAll();
    const aptIdx = appointments.findIndex(a => a.id === appointmentId);
    if (aptIdx === -1) {
      throw new Error('Không tìm thấy lịch hẹn.');
    }
    
    appointments[aptIdx] = { ...appointments[aptIdx], status };
    this.save(appointments);
    return appointments[aptIdx];
  },

  // Add an appointment directly (bypassing patient validation)
  addDirect(apt) {
    const list = this.getAll();
    list.unshift(apt);
    this.save(list);
    return apt;
  },

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
