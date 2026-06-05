import { mockAppointments, doctors } from '../mockData';

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

export const AppointmentModel = {
  // Initialize appointments in localStorage if not exists
  init() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const initialized = (mockAppointments || []).map((apt, index) => {
        if (index === 0) return { ...apt, date: "2026-06-01", status: "Đã xác nhận" };
        if (index === 1) return { ...apt, date: "2026-06-01", status: "Chờ xác nhận" };
        if (index === 2) return { ...apt, date: "2026-06-01", status: "Đang chờ" };
        if (index === 3) return { ...apt, date: "2026-06-01", status: "Chờ xác nhận" };
        return apt;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialized));
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
    const list = this.getAll();
    return list.filter(a => a.patientId === patientId);
  },

  // Check if a time slot is already booked for a specific doctor
  isTimeSlotBooked(doctorId, dateStr, timeStr) {
    const list = this.getAll();
    return list.some(
      a =>
        a.doctorId === doctorId &&
        a.date === dateStr &&
        a.time === timeStr &&
        a.status !== 'Đã hủy'
    );
  },

  // Get days of the week a doctor is scheduled to work
  getDoctorWorkingDays(doctorId) {
    const doc = doctors.find(d => d.id === doctorId);
    if (!doc || !doc.schedule) return [];
    
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
      const doc = doctors.find(d => d.id === doctorId);
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
    const doc = doctors.find(d => d.id === bookingData.doctorId);

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

  // Reschedule an appointment
  reschedule(appointmentId, newDate, newTime) {
    const appointments = this.getAll();
    const aptIdx = appointments.findIndex(a => a.id === appointmentId);
    if (aptIdx === -1) {
      throw new Error('Không tìm thấy lịch hẹn.');
    }

    const apt = appointments[aptIdx];
    if (!this.canCancel(apt)) {
      throw new Error('Không thể tự đổi lịch hẹn trực tuyến sát giờ khám (dưới 24 giờ). Vui lòng liên hệ Hotline phòng khám để được hỗ trợ.');
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
      const doc = doctors.find(d => d.id === apt.doctorId);
      const scheduleStr = doc ? doc.schedule.map(s => s.day).join(', ') : '';
      throw new Error(`Bác sĩ không có lịch trực vào ngày này. Lịch làm việc của bác sĩ: ${scheduleStr}.`);
    }

    // 3. Prevent double booking
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

    // Update appointment
    appointments[aptIdx] = {
      ...apt,
      date: newDate,
      time: newTime,
      status: 'Chờ xác nhận', // Rescheduled appointment goes back to Pending Approval
    };
    
    this.save(appointments);
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
  }
};
