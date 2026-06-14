import { supabase } from '../supabaseClient';
import { DoctorModel } from './DoctorModel';

export const AppointmentModel = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patient_profiles(*),
          doctor:doctor_profiles(*),
          service:services(*)
        `);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (appointments):', e.message);
      return [];
    }
  },

  async getByPatientId(patientId) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, doctor:doctor_profiles(*), service:services(*)')
        .eq('patient_id', patientId);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (appointments by patient):', e.message);
      return [];
    }
  },

  async getByDoctorId(doctorId) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patient:patient_profiles(*), service:services(*)')
        .eq('doctor_id', doctorId);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (appointments by doctor):', e.message);
      return [];
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patient:patient_profiles(*), doctor:doctor_profiles(*), service:services(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase fetch error (appointment by id):', e.message);
      return null;
    }
  },

  async getByDate(date) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patient:patient_profiles(*), doctor:doctor_profiles(*), service:services(*)')
        .eq('date', date);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (appointments by date):', e.message);
      return [];
    }
  },

  async create(appointmentData) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
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
        .eq('id', id)
        .select();
      if (error) throw error;
      return data[0];
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
        .select('time')
        .eq('date', date)
        .eq('doctor_id', doctorId);
      if (error) throw error;
      return (data || [])?.map?.(a => a.time);
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
        .eq('appointment_id', appointmentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase fetch error (payment by appointment):', e.message);
      return null;
    }
  },

  async book(bookingData) {
    const dbPayload = {
      doctor_id: bookingData.doctorId || bookingData.doctor_id,
      patient_id: bookingData.patientId || bookingData.patient_id,
      date: bookingData.date,
      time: bookingData.time,
      service: bookingData.service,
      fee: bookingData.fee,
      notes: bookingData.notes,
      status: bookingData.status || 'Pending'
    };
    return this.create(dbPayload);
  },

  async addAppointment(aptData) {
    const dbPayload = {
      doctor_id: aptData.doctor_id || aptData.doctorId,
      patient_id: aptData.patient_id || aptData.patientId,
      date: aptData.appointment_date || aptData.date,
      time: aptData.start_time || aptData.time,
      service: aptData.service_name || aptData.service,
      fee: aptData.fee || '300,000 VNĐ',
      status: aptData.status || 'Pending'
    };
    return this.create(dbPayload);
  },

  async addDirect(apt) {
    const dbPayload = {
      doctor_id: apt.doctor_id || apt.doctorId,
      patient_id: apt.patient_id || apt.patientId,
      date: apt.date || apt.appointment_date,
      time: apt.time || apt.start_time,
      service: apt.service || apt.service_name,
      fee: apt.fee || '300,000 VNĐ',
      status: apt.status || 'Pending'
    };
    return this.create(dbPayload);
  },

  async updateAppointment(appointmentId, updatedFields) {
    const dbPayload = {};
    if (updatedFields.doctorId !== undefined) dbPayload.doctor_id = updatedFields.doctorId;
    if (updatedFields.doctor_id !== undefined) dbPayload.doctor_id = updatedFields.doctor_id;
    if (updatedFields.patientId !== undefined) dbPayload.patient_id = updatedFields.patientId;
    if (updatedFields.patient_id !== undefined) dbPayload.patient_id = updatedFields.patient_id;
    if (updatedFields.date !== undefined) dbPayload.date = updatedFields.date;
    if (updatedFields.appointment_date !== undefined) dbPayload.date = updatedFields.appointment_date;
    if (updatedFields.time !== undefined) dbPayload.time = updatedFields.time;
    if (updatedFields.start_time !== undefined) dbPayload.time = updatedFields.start_time;
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

  async addPayment(payData) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          appointment_id: payData.appointment_id || payData.appointmentId,
          patient_id: payData.patient_id || payData.patientId,
          amount: payData.final_amount || payData.amount,
          method: payData.payment_method || payData.method || 'QR Code',
          status: 'Paid'
        }])
        .select();
      if (error) throw error;
      if (payData.appointment_id || payData.appointmentId) {
        await this.updateStatus(payData.appointment_id || payData.appointmentId, 'Đã thanh toán');
      }
      return data[0];
    } catch (e) {
      console.warn('Supabase create error (payments):', e.message);
      return null;
    }
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

  async reschedule(appointmentId, newDate, newTime) {
    return this.update(appointmentId, { date: newDate, time: newTime, status: 'Chờ xác nhận' });
  },

  canCancel(status) {
    return status === 'Chờ xác nhận' || status === 'Đang chờ' || status === 'Pending';
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
  }
};
