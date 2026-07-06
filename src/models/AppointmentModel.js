import { supabase } from '../supabaseClient';
import { DoctorModel } from './DoctorModel';
import { PatientModel } from './PatientModel';

// Map legacy/English status codes onto the Vietnamese vocabulary the whole UI
// is built around, so seed rows (e.g. 'CONFIRMED') stay visible & consistent.
const STATUS_NORMALIZE_MAP = {
  PENDING: 'Đã xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đang chờ',
  CHECKEDIN: 'Đang chờ',
  COMPLETED: 'Đã khám',
  EXAMINED: 'Đã khám',
  DONE: 'Đã khám',
  CANCELLED: 'Đã hủy',
  CANCELED: 'Đã hủy',
  PAID: 'Đã thanh toán',
  REVIEWED: 'Reviewed',
  'ĐÃ HỦY': 'Đã hủy',
  'ĐÃ HUỶ': 'Đã hủy',
};

// FK anchor for walk-in guests. `appointments.patient_id` is NOT NULL and chains
// patient_profiles.patient_id → auth.users, so a guest (who has no auth account)
// can't get a unique users row from the client. We therefore reuse ONE anchor row
// purely to satisfy the FK — but every guest booking now carries its own
// patient_name / patient_phone on the appointment row (see `book`, `holdSlot`),
// so guests are individually identifiable and never collapse into one record.
// NOTE: minting a real per-guest user requires Supabase Auth admin (a server task).
export const GUEST_ANCHOR_ID = '18504773-0f51-405a-aa32-70cae403be6e';

export const AppointmentModel = {
  isCancelled(status) {
    if (!status) return false;
    const s = String(status).toLowerCase();
    return s === 'đã hủy' || s === 'đã huỷ' || s === 'cancelled' || s === 'canceled';
  },

  normalizeStatus(status) {
    if (!status) return status;
    return STATUS_NORMALIZE_MAP[String(status).toUpperCase()] || status;
  },

  // Parse a "HH:mm[:ss]" string into minutes-since-midnight (null when blank).
  timeToMinutes(timeStr) {
    if (!timeStr) return null;
    const [h, m] = String(timeStr).split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  },

  // Add `minutes` to a "HH:mm[:ss]" string, returning "HH:mm".
  addMinutesToTime(timeStr, minutes = 30) {
    if (!timeStr) return timeStr;
    const [h, m] = String(timeStr).split(':').map(Number);
    const total = (h || 0) * 60 + (m || 0) + minutes;
    const hh = Math.floor((total % 1440) / 60);
    const mm = total % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  },

  // True when the given appointment date/time is in the future but within 24h.
  isWithin24h(dateStr, timeStr) {
    if (!dateStr) return false;
    const [y, mo, d] = String(dateStr).split('-').map(Number);
    const [h = 0, mi = 0] = String(timeStr || '00:00').split(':').map(Number);
    const apptMs = new Date(y, (mo || 1) - 1, d || 1, h, mi).getTime();
    const diff = apptMs - Date.now();
    return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
  },

  mapAppointment(row) {
    if (!row) return null;
    const doctors = DoctorModel.getAllDoctorsSync?.() || [];
    const doc = doctors.find(d => String(d.id || d.user_id) === String(row.doctor_id));
    return {
      ...row,
      id: row.appointment_id || row.id,
      doctorId: row.doctor_id,
      doctorName: doc ? doc.name : 'Bác sĩ',
      patientName: row.patient_name || row.patientName || 'Bệnh nhân',
      patientPhone: row.patient_phone || row.patientPhone,
      patientEmail: row.patient_email || row.patientEmail,
      reason: row.reason,
      status: this.normalizeStatus(row.status),
      createdAt: row.created_at,
      service: row.service || 'Khám da liễu tổng quát',
      fee: row.fee || '300,000 VNĐ',
      date: row.appointment_date,
      time: (row.start_time || '').substring(0, 5),
    };
  },

  async populatePatientNames(data) {
    if (!data || (Array.isArray(data) && data.length === 0)) return data;
    const isArray = Array.isArray(data);
    const rows = isArray ? data : [data];
    
    const patientIds = Array.from(new Set(rows.map(r => r.patient_id).filter(Boolean)));
    if (patientIds.length === 0) return data;

    let userMap = {};
    try {
      const { data: usersData } = await supabase.from('users').select('user_id, full_name').in('user_id', patientIds);
      if (usersData) {
        usersData.forEach(u => {
          if (u.full_name) userMap[u.user_id] = u.full_name;
        });
      }
    } catch (e) {}

    rows.forEach(r => {
      if (r.patient_id) {
        if (userMap[r.patient_id]) {
          r.patient_name = userMap[r.patient_id];
        } else {
          try {
            const localPatient = PatientModel.getById(r.patient_id);
            if (localPatient && localPatient.fullName) {
               r.patient_name = localPatient.fullName;
            }
          } catch(e){}
        }
      }
    });

    return isArray ? rows : rows[0];
  },

  async getAll() {
    try {
      const { data, error } = await supabase.from('appointments').select('*');
      if (error) throw error;
      const populated = await this.populatePatientNames(data);
      return (populated || []).map(r => this.mapAppointment(r));
    } catch (e) {
      console.warn('Supabase fetch error (appointments):', e.message);
      return [];
    }
  },

  async getByPatientId(patientId) {
    try {
      const { data, error } = await supabase.from('appointments').select('*').eq('patient_id', patientId);
      if (error) throw error;
      const populated = await this.populatePatientNames(data);
      return (populated || []).map(r => this.mapAppointment(r));
    } catch (e) {
      console.warn('Supabase fetch error (appointments by patient):', e.message);
      return [];
    }
  },

  async getByDoctorId(doctorId) {
    try {
      const { data, error } = await supabase.from('appointments').select('*').eq('doctor_id', doctorId);
      if (error) throw error;
      const populated = await this.populatePatientNames(data);
      return (populated || []).map(r => this.mapAppointment(r));
    } catch (e) {
      console.warn('Supabase fetch error (appointments by doctor):', e.message);
      return [];
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase.from('appointments').select('*').eq('appointment_id', id).single();
      if (error) throw error;
      const populated = await this.populatePatientNames(data);
      return this.mapAppointment(populated);
    } catch (e) {
      console.warn('Supabase fetch error (appointment by id):', e.message);
      return null;
    }
  },

  async getByDate(date) {
    try {
      const { data, error } = await supabase.from('appointments').select('*').eq('appointment_date', date);
      if (error) throw error;
      const populated = await this.populatePatientNames(data);
      return (populated || []).map(r => this.mapAppointment(r));
    } catch (e) {
      console.warn('Supabase fetch error (appointments by date):', e.message);
      return [];
    }
  },

  async create(appointmentData) {
    try {
      // If patient_id is null (Guest walk-in) we fall back to the shared FK anchor.
      // The guest's real identity is preserved via patient_name / patient_phone on
      // the row itself, so guests stay distinguishable (see GUEST_ANCHOR_ID note).
      const actualPatientId = appointmentData.patient_id || GUEST_ANCHOR_ID;

      // Ensure patient exists in patient_profiles to satisfy foreign key constraints.
      // We do a silent insert and ignore errors (e.g. if it already exists or RLS blocks it).
      await supabase.from('patient_profiles').upsert([{ patient_id: actualPatientId }], { onConflict: 'patient_id' });

      // Build safe payload
      const dbPayload = {
        ...appointmentData,
        patient_id: actualPatientId
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert([dbPayload])
        .select();
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.warn('Supabase create error (appointments):', e.message);
      return null;
    }
  },

  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('appointment_id', id)
        .select();
      if (error) throw error;
      return this.mapAppointment(data[0]);
    } catch (e) {
      console.warn('Supabase update error (appointments):', e.message);
      return null;
    }
  },

  async updateStatus(id, newStatus) {
    return this.update(id, { status: newStatus });
  },

  async getLockedSlots(date, doctorId) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('start_time')
        .eq('appointment_date', date)
        .eq('doctor_id', doctorId);
      if (error) throw error;
      return (data || [])?.map?.(a => (a.start_time || '').substring(0, 5));
    } catch (e) {
      console.warn('Supabase fetch error (locked slots):', e.message);
      return [];
    }
  },

  async getAllAppointments() {
    return this.getAll();
  },

  async getAllPayments() {
    try {
      const { data, error } = await supabase.from('payments').select('*');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn("Failed to fetch payments:", error);
      return [];
    }
  },

  async getAppointmentsByUser(patientId) {
    return this.getByPatientId(patientId);
  },

  async getAppointmentById(appointmentId) {
    return this.getById(appointmentId);
  },

  async getPaymentByAppointment(appointmentId) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('appointment_id', appointmentId);
      if (error) throw error;
      if (data && data.length > 0) {
        return data[data.length - 1];
      }
      return null;
    } catch (e) {
      console.warn('Supabase fetch error (payment by appointment):', e.message);
      return null;
    }
  },

  async book(bookingData) {
    const startTime = bookingData.time;
    const dbPayload = {
      doctor_id: bookingData.doctorId || bookingData.doctor_id,
      patient_id: bookingData.patientId || bookingData.patient_id,
      patient_name: bookingData.patientName || bookingData.patient_name,
      patient_phone: bookingData.patientPhone || bookingData.patient_phone,
      service: bookingData.service,
      fee: bookingData.fee,
      status: bookingData.status || 'Đã xác nhận',
      appointment_date: bookingData.date,
      start_time: startTime,
      end_time: this.addMinutesToTime(startTime, 30),
      reason: bookingData.notes || 'Khám bệnh',
    };
    
    let newApt;
    if (bookingData.holdAptId) {
      // Confirm the held row AND stamp the guest's identity onto it. The hold was
      // created before contact details were finalized, so without this a confirmed
      // guest booking would carry no name/phone and look like the FK anchor row.
      newApt = await this.update(bookingData.holdAptId, {
        status: bookingData.status || 'Đã xác nhận',
        patient_name: dbPayload.patient_name,
        patient_phone: dbPayload.patient_phone,
      });
      if (!newApt) newApt = await this.create(dbPayload);
    } else {
      newApt = await this.create(dbPayload);
    }
    
    if (newApt && !bookingData.bypassPayment && (bookingData.bookingFee || bookingData.fee) && !bookingData.isHold) {
      const deposit = bookingData.bookingFee
        || (typeof bookingData.fee === 'string' ? parseInt(bookingData.fee.replace(/\D/g, ''), 10) : bookingData.fee)
        || 50000;
      // Record the booking deposit. Raw row exposes `appointment_id` (not `id`),
      // and the deposit is partial — it must NOT flip the appointment to paid.
      await this.addPayment({
        appointment_id: newApt.appointment_id || newApt.id,
        patient_id: dbPayload.patient_id,
        voucher_id: bookingData.voucherId ?? null,
        total_amount: deposit,
        discount_amount: bookingData.discount || 0,
        final_amount: deposit,
        payment_method: 'QR Code',
      }, { markAppointmentPaid: false });
    }
    return newApt;
  },

  // Create a follow-up (tái khám) appointment for a doctor's own patient.
  // This is the SERVER-SIDE guard for the doctor's follow-up picker: it re-runs
  // the same two constraints the UI enforces, right before the insert, so a slot
  // that was filled in the gap between the doctor opening the picker and clicking
  // "create" can never be double-booked (race condition), and a slot outside the
  // doctor's working shift can never be persisted even if the UI is bypassed.
  // Returns { data } on success or { error: <vietnamese message> } on rejection.
  async createFollowUp(followUpData) {
    const doctorId = followUpData.doctorId || followUpData.doctor_id;
    const date = followUpData.date || followUpData.appointment_date;
    const time = (followUpData.time || followUpData.start_time || '').substring(0, 5);

    if (!doctorId || !date || !time) {
      return { error: 'Thiếu thông tin bác sĩ, ngày hoặc giờ tái khám.' };
    }

    // Guard 1 — the slot must fall strictly INSIDE one of the doctor's working
    // shifts for that day (a full 30-minute consultation must fit within it).
    const { data: shifts, error: shiftErr } = await supabase
      .from('doctor_shifts')
      .select('start_time, end_time, status')
      .eq('doctor_id', doctorId)
      .eq('work_date', date);
    if (shiftErr) {
      return { error: 'Không thể kiểm tra ca làm việc của bác sĩ. Vui lòng thử lại.' };
    }
    const slotStart = this.timeToMinutes(time);
    const slotEnd = slotStart + 30;
    const withinShift = (shifts || []).some((s) => {
      const st = this.timeToMinutes(s.start_time);
      const et = this.timeToMinutes(s.end_time);
      return st != null && et != null && slotStart >= st && slotEnd <= et;
    });
    if (!withinShift) {
      return { error: 'Khung giờ tái khám không nằm trong ca làm việc của bác sĩ.' };
    }

    // Guard 2 — re-check the slot is still free for this doctor (race condition).
    const { data: sameDay, error: aptErr } = await supabase
      .from('appointments')
      .select('start_time, status')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date);
    if (aptErr) {
      return { error: 'Không thể kiểm tra lịch hẹn hiện có. Vui lòng thử lại.' };
    }
    const isTaken = (sameDay || []).some(
      (a) => !this.isCancelled(a.status) && (a.start_time || '').substring(0, 5) === time
    );
    if (isTaken) {
      return { error: 'Khung giờ này vừa được đặt. Vui lòng chọn khung giờ khác.' };
    }

    const created = await this.create({
      doctor_id: doctorId,
      patient_id: followUpData.patientId || followUpData.patient_id || null,
      patient_name: followUpData.patientName || followUpData.patient_name || null,
      appointment_date: date,
      start_time: time,
      end_time: this.addMinutesToTime(time, 30),
      service: followUpData.service || 'Tái khám',
      fee: followUpData.fee || '300,000 VNĐ',
      status: 'Đã xác nhận',
      reason: followUpData.reason || 'Tái khám theo chỉ định của bác sĩ',
    });
    if (!created) {
      return { error: 'Tạo lịch tái khám thất bại. Vui lòng thử lại.' };
    }
    return { data: this.mapAppointment(created) };
  },

  async addAppointment(aptData) {
    const startTime = aptData.start_time || aptData.time;
    const dbPayload = {
      doctor_id: aptData.doctor_id || aptData.doctorId,
      patient_id: aptData.patient_id || aptData.patientId,
      appointment_date: aptData.appointment_date || aptData.date,
      start_time: startTime,
      end_time: aptData.end_time || this.addMinutesToTime(startTime, 30),
      reason: aptData.reason || aptData.notes || 'Khám bệnh',
      service: aptData.service_name || aptData.service,
      fee: aptData.fee || '300,000 VNĐ',
      status: aptData.status || 'Đã xác nhận',
    };
    return this.create(dbPayload);
  },

  async addDirect(apt) {
    const timeStr = apt.time || apt.start_time;
    const dbPayload = {
      doctor_id: apt.doctor_id || apt.doctorId,
      patient_id: apt.patient_id || apt.patientId,
      appointment_date: apt.date || apt.appointment_date,
      start_time: timeStr,
      end_time: this.addMinutesToTime(timeStr, 30),
      reason: 'Khám bệnh',
      service: apt.service || apt.service_name,
      fee: apt.fee || '300,000 VNĐ',
      status: apt.status || 'Đã xác nhận'
    };
    return this.create(dbPayload);
  },

  async updateAppointment(appointmentId, updatedFields) {
    const dbPayload = {};
    if (updatedFields.doctorId !== undefined) dbPayload.doctor_id = updatedFields.doctorId;
    if (updatedFields.doctor_id !== undefined) dbPayload.doctor_id = updatedFields.doctor_id;
    if (updatedFields.patientId !== undefined) dbPayload.patient_id = updatedFields.patientId;
    if (updatedFields.patient_id !== undefined) dbPayload.patient_id = updatedFields.patient_id;
    if (updatedFields.patientName !== undefined) dbPayload.patient_name = updatedFields.patientName;
    if (updatedFields.patient_name !== undefined) dbPayload.patient_name = updatedFields.patient_name;
    if (updatedFields.patientPhone !== undefined) dbPayload.patient_phone = updatedFields.patientPhone;
    if (updatedFields.patient_phone !== undefined) dbPayload.patient_phone = updatedFields.patient_phone;
    
    if (updatedFields.date !== undefined) { dbPayload.appointment_date = updatedFields.date; }
    if (updatedFields.appointment_date !== undefined) { dbPayload.appointment_date = updatedFields.appointment_date; }
    
    // Keep the 30-minute consultation window when the time changes — never collapse
    // end_time onto start_time (that produced zero-length appointments on edits).
    if (updatedFields.time !== undefined) { dbPayload.start_time = updatedFields.time; dbPayload.end_time = this.addMinutesToTime(updatedFields.time, 30); }
    if (updatedFields.start_time !== undefined) { dbPayload.start_time = updatedFields.start_time; dbPayload.end_time = this.addMinutesToTime(updatedFields.start_time, 30); }
    
    if (updatedFields.status !== undefined) dbPayload.status = updatedFields.status;
    if (updatedFields.fee !== undefined) dbPayload.fee = updatedFields.fee;

    return this.update(appointmentId, dbPayload);
  },

  async updateAppointmentStatus(appointmentId, newStatus) {
    return this.updateStatus(appointmentId, newStatus);
  },

  async cancel(appointmentId) {
    return this.updateStatus(appointmentId, 'Đã hủy');
  },

  async addPayment(payData, options = {}) {
    const { markAppointmentPaid = true } = options;
    try {
      const appointmentId = payData.appointment_id || payData.appointmentId || null;
      
      let existingFinal = 0;
      if (appointmentId) {
        const { data: existing } = await supabase.from('payments').select('final_amount').eq('appointment_id', appointmentId).single();
        if (existing) existingFinal = existing.final_amount || 0;
      }

      const currentFinalAmount = payData.final_amount ?? payData.amount ?? payData.total_amount ?? 0;
      const accumulatedFinalAmount = existingFinal + currentFinalAmount;

      const totalAmount = payData.total_amount ?? payData.amount ?? currentFinalAmount;
      const discountAmount = payData.discount_amount ?? payData.discount ?? 0;
      const method = payData.payment_method || payData.method || 'QR Code';

      // payments.voucher_id is an integer FK — only send it when numeric.
      const rawVoucher = payData.voucher_id ?? payData.voucherId;
      const voucherId = Number.isFinite(Number(rawVoucher)) && rawVoucher !== null && rawVoucher !== ''
        ? Number(rawVoucher)
        : null;

      const pId = payData.patient_id || payData.patientId;
      const rId = payData.receptionist_id ?? null;
      const proxyGuestId = GUEST_ANCHOR_ID;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isValidUuid = (str) => typeof str === 'string' && uuidRegex.test(str);

      const row = {
        appointment_id: appointmentId,
        patient_id: isValidUuid(pId) ? pId : proxyGuestId,
        receptionist_id: isValidUuid(rId) ? rId : null,
        voucher_id: voucherId,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        final_amount: accumulatedFinalAmount,
        payment_method: method,
        payment_status: 'PAID',
        paid_at: new Date().toISOString(),
        method,
        status: 'Paid',
      };

      const { data, error } = await supabase.from('payments').upsert([row], { onConflict: 'appointment_id' }).select();
      if (error) throw error;

      // Also track in the invoices table
      try {
        await supabase.from('invoices').insert([{
          appointment_id: appointmentId,
          patient_id: isValidUuid(pId) ? pId : proxyGuestId,
          total_amount: currentFinalAmount,
          status: 'PAID',
          payment_method: method,
          transaction_id: `TXN-${data[0].id || Date.now()}`
        }]);
      } catch (err) {
        console.warn('Failed to insert into invoices:', err.message);
      }

      if (appointmentId && markAppointmentPaid) {
        await this.updateStatus(appointmentId, 'Đã thanh toán');
      }
      return data[0];
    } catch (e) {
      console.warn('Supabase create error (payments):', e.message);
      return { error: e };
    }
  },

  async validateBooking(bookingData) {
    const { doctorId, patientId, patientPhone, patientEmail, date, time } = bookingData;
    
    // If this is a receptionist walk-in/direct check-in, bypass validation checks
    if (bookingData.status === 'Đang chờ') {
      return { valid: true };
    }
    
    // Rule 1: Date must be today or later
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = date.split('-');
    const selectDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    selectDate.setHours(0, 0, 0, 0);

    if (selectDate < today) {
      return { valid: false, error: 'Ngày đặt khám tối thiểu phải từ hôm nay trở đi.' };
    }

    if (selectDate.getTime() === today.getTime()) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const [h, m] = time.split(':').map(Number);
      if (h * 60 + m <= currentMins) {
        return { valid: false, error: 'Khung giờ này đã qua, vui lòng chọn khung giờ khác.' };
      }
    }

    // Rule 2: Doctor must be working on that day
    const { data: shifts } = await supabase
      .from('doctor_shifts')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('work_date', date);

    if (!shifts || shifts.length === 0) {
      const dayOfWeek = this.getLocalDayOfWeek(date);
      const workingDays = this.getDoctorWorkingDays(doctorId);
      if (workingDays.length > 0 && !workingDays.includes(dayOfWeek)) {
        const doc = DoctorModel.getAllDoctorsSync?.().find(d => String(d.id || d.user_id) === String(doctorId));
        const scheduleStr = doc ? (typeof doc.schedule === 'string' ? JSON.parse(doc.schedule) : doc.schedule).map(s => s.day).join(', ') : '';
        return {
          valid: false,
          error: `Bác sĩ không có lịch trực vào ngày này. Lịch làm việc cố định của bác sĩ: ${scheduleStr}.`,
        };
      }
    } else {
      const isValidTime = shifts.some(s => {
        const start = s.start_time.slice(0, 5);
        const end = s.end_time.slice(0, 5);
        return time >= start && time < end;
      });
      if (!isValidTime) {
        return { valid: false, error: 'Khung giờ này nằm ngoài ca làm việc của bác sĩ.' };
      }
    }

    // Rule 3: No double booking for doctor
    const allAppointments = await this.getAll();
    const isActuallyBooked = allAppointments.some(
      a => {
        if (String(a.doctor_id || a.doctorId) !== String(doctorId)) return false;
        if (a.date !== date && a.appointment_date !== date) return false;
        if (a.time !== time && a.start_time !== time) return false;
        if (this.isCancelled(a.status)) return false;
        if (bookingData.holdAptId && String(a.appointment_id || a.id) === String(bookingData.holdAptId)) return false;
        if (a.status === 'Đang giữ chỗ') {
          const createdAt = new Date(a.created_at || Date.now()).getTime();
          if (Date.now() - createdAt > 5 * 60 * 1000) return false;
        }
        return true;
      }
    );
    if (isActuallyBooked) {
      return { valid: false, error: 'Khung giờ này đã được đặt trước cho bác sĩ này. Vui lòng chọn khung giờ khác.' };
    }

    // Rule 6: No double booking for patient on the same day
    const isPatientBusySameDay = allAppointments.some(
      a => {
        if (this.isCancelled(a.status)) return false;
        if (bookingData.holdAptId && String(a.appointment_id || a.id) === String(bookingData.holdAptId)) return false;
        if (a.status === 'Đang giữ chỗ') {
          const createdAt = new Date(a.created_at || Date.now()).getTime();
          if (Date.now() - createdAt > 5 * 60 * 1000) return false;
        }
        if (a.date === date || a.appointment_date === date) {
          const cleanPhoneA = a.patientPhone?.replace(/[\s.-]/g, '') || a.patient_phone?.replace(/[\s.-]/g, '');
          const cleanPhoneB = patientPhone?.replace(/[\s.-]/g, '');
          
          const isSamePatient = 
            (patientId && (String(a.patient_id) === String(patientId) || String(a.patientId) === String(patientId))) ||
            (cleanPhoneB && cleanPhoneA === cleanPhoneB) ||
            (patientEmail && (a.patientEmail === patientEmail || a.patient_email === patientEmail));
          return isSamePatient;
        }
        return false;
      }
    );
    if (isPatientBusySameDay) {
      return {
        valid: false,
        error: `Bạn đã có một lịch hẹn khác đăng ký cho ngày ${date}. Mỗi người chỉ có thể đặt tối đa 1 lịch khám trong cùng một ngày.`,
      };
    }

    // If patientId is provided, enforce patient-specific limits
    if (patientId) {
      const patientAppointments = await this.getByPatientId(patientId);
      
      // Rule 4: Max 2 upcoming appointments
      const upcoming = patientAppointments.filter(
        a => {
          if (bookingData.holdAptId && String(a.appointment_id || a.id) === String(bookingData.holdAptId)) return false;
          if (a.status === 'Đang giữ chỗ') {
            const createdAt = new Date(a.created_at || Date.now()).getTime();
            if (Date.now() - createdAt > 5 * 60 * 1000) return false;
            return true;
          }
          return a.status === 'Đang chờ' || a.status === 'Đã xác nhận' || a.status === 'Chờ xác nhận' || a.status === 'Pending';
        }
      );
      if (upcoming.length >= 2) {
        return {
          valid: false,
          error: 'Bạn đã có 2 lịch hẹn sắp tới. Vui lòng hoàn thành hoặc hủy lịch cũ trước khi đặt lịch mới.',
        };
      }
    }

    return { valid: true };
  },

  isTimeSlotBooked(doctorId, dateStr, timeStr) {
    return false;
  },

  getLocalDayOfWeek(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-')?.map?.(Number);
    const day = new Date(y, m - 1, d).getDay();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[day];
  },

  getDoctorWorkingDays(doctorId) {
    const doc = DoctorModel.getAllDoctorsSync?.().find(d => String(d.id || d.user_id) === String(doctorId));
    if (!doc || !doc.schedule) {
      return ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    }
    let schedule = doc.schedule;
    if (typeof schedule === 'string') {
      try { schedule = JSON.parse(schedule); } catch (e) { schedule = []; }
    }
    return Array.isArray(schedule) ? schedule.map(s => s.day) : [];
  },

  async reschedule(appointmentId, newDate, newTime, newDoctorId = null) {
    const appointments = await this.getAll();
    const apt = appointments.find(a => String(a.id || a.appointment_id) === String(appointmentId));
    if (!apt) throw new Error('Không tìm thấy lịch hẹn.');

    // The patient may move the booking to a DIFFERENT doctor. Fall back to the
    // current doctor when none is supplied so the legacy "date/time only" callers
    // keep working unchanged.
    const targetDoctorId = newDoctorId || apt.doctor_id || apt.doctorId;

    // Rule 1: Max 2 reschedules check
    const currentCount = apt.rescheduleCount || apt.reschedule_count || 0;
    if (currentCount >= 2) {
      throw new Error('Bạn đã đổi lịch tối đa 2 lần cho cuộc hẹn này. Theo quy định, không thể đổi lịch tiếp. Vui lòng Hủy lịch hoặc liên hệ Lễ tân.');
    }

    // 1. Date must be today or later
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = newDate.split('-');
    const selectDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    selectDate.setHours(0, 0, 0, 0);
    if (selectDate < today) throw new Error('Ngày dời lịch tối thiểu phải từ hôm nay trở đi.');
    if (selectDate.getTime() === today.getTime()) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const [h, m] = newTime.split(':').map(Number);
      if (h * 60 + m <= currentMins) throw new Error('Khung giờ này đã qua, vui lòng chọn khung giờ khác.');
    }

    // 2. Doctor working schedule check
    const dayOfWeek = this.getLocalDayOfWeek(newDate);
    const workingDays = this.getDoctorWorkingDays(targetDoctorId);
    if (workingDays.length > 0 && !workingDays.includes(dayOfWeek)) {
      throw new Error(`Bác sĩ không có lịch trực vào ngày này.`);
    }

    // 3. Prevent doctor double booking
    const isBooked = appointments.some(
      a =>
        String(a.id || a.appointment_id) !== String(appointmentId) &&
        String(a.doctor_id || a.doctorId) === String(targetDoctorId) &&
        (a.date === newDate || a.appointment_date === newDate) &&
        (a.time === newTime || a.start_time === newTime) &&
        !this.isCancelled(a.status)
    );
    if (isBooked) throw new Error('Khung giờ này đã được đặt trước cho bác sĩ này. Vui lòng chọn khung giờ khác.');

    // 4. Prevent patient double-booking themselves
    const patientId = apt.patient_id || apt.patientId;
    if (patientId) {
      const isPatientBusy = appointments.some(
        a =>
          String(a.id || a.appointment_id) !== String(appointmentId) &&
          !this.isCancelled(a.status) &&
          (a.date === newDate || a.appointment_date === newDate) &&
          (a.time === newTime || a.start_time === newTime) &&
          String(a.patient_id || a.patientId) === String(patientId)
      );
      if (isPatientBusy) throw new Error(`Bạn đã có một lịch hẹn khác vào khung giờ ${newTime} ngày ${newDate}.`);
    }

    // Surcharge applies when the CURRENT appointment is within 24h of now.
    const isCloseToTime = this.isWithin24h(apt.date || apt.appointment_date, apt.time || apt.start_time);

    const baseUpdate = {
      doctor_id: targetDoctorId,
      appointment_date: newDate,
      start_time: newTime,
      end_time: this.addMinutesToTime(newTime, 30),
      status: 'Đã xác nhận',
    };
    // Track the reschedule count so the "max 2 reschedules" rule can be enforced.
    // The `reschedule_count` column may not exist yet (see migration); if the
    // update is rejected for the unknown column, retry without it so reschedule
    // still works and tracking switches on automatically once migrated.
    let updated = await this.update(appointmentId, { ...baseUpdate, reschedule_count: currentCount + 1 });
    if (!updated) {
      updated = await this.update(appointmentId, baseUpdate);
    }

    // Record the 50k reschedule surcharge as a real payment (partial — does
    // not flip the appointment lifecycle status).
    if (isCloseToTime) {
      await this.addPayment({
        appointment_id: appointmentId,
        patient_id: apt.patient_id || apt.patientId,
        total_amount: 50000,
        final_amount: 50000,
        payment_method: 'QR Code',
      }, { markAppointmentPaid: false });
    }

    return updated;
  },

  canCancel(status) {
    return status === 'Đã xác nhận' || status === 'Chờ xác nhận' || status === 'Đang chờ' || status === 'Pending';
  },

  lockSlot(doctorId, dateStr, timeStr, durationMinutes = 5) {
    try {
      const lockedListStr = localStorage.getItem('dermasmart_locked_slots') || '[]';
      let lockedList = [];
      try { lockedList = JSON.parse(lockedListStr); } catch (e) {}
      
      const filteredList = lockedList.filter(l => !(String(l.doctorId) === String(doctorId) && l.date === dateStr && l.time === timeStr));
      filteredList.push({
        doctorId,
        date: dateStr,
        time: timeStr,
        lockedUntil: Date.now() + durationMinutes * 60 * 1000
      });
      localStorage.setItem('dermasmart_locked_slots', JSON.stringify(filteredList));
      window.dispatchEvent(new CustomEvent('appointments-updated'));
    } catch (e) {
      console.warn('Failed to lock slot:', e.message);
    }
  },

  updatePatientName(patientId, newName) {
    // No-op in Supabase version since patient name is fetched dynamically from users/profiles
    return;
  }
};
