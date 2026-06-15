import { useState, useEffect, useCallback } from 'react';
import { AppointmentModel } from '../models/AppointmentModel';
import { DoctorModel } from '../models/DoctorModel';
import { NotificationModel } from '../models/NotificationModel';

export function useAppointmentController(patientId = null) {
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshState = useCallback(async () => {
    try {
      setLoading(true);
      await DoctorModel.getAllDoctors(); // Ensure doctors are cached for mapping
      const apts = patientId
        ? await AppointmentModel.getByPatientId(patientId)
        : await AppointmentModel.getAllAppointments();
      setAppointments(apts || []);

      const pmts = await AppointmentModel.getAllPayments();
      setPayments(pmts || []);
    } catch (e) {
      console.warn('Failed to load appointments/payments:', e.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  // Keep state in sync with localStorage updates via custom events
  useEffect(() => {
    refreshState();
  }, [refreshState]);

  useEffect(() => {
    const handleUpdate = () => {
      refreshState();
    };

    window.addEventListener('appointments-updated', handleUpdate);
    return () => {
      window.removeEventListener('appointments-updated', handleUpdate);
    };
  }, [refreshState]);

  const getPatientAppointments = useCallback((patientIdParam) => {
    return AppointmentModel.getAppointmentsByUser(patientIdParam);
  }, []);

  const getAllAppointments = useCallback(() => {
    return AppointmentModel.getAllAppointments();
  }, []);

  const getAppointmentDetails = useCallback((appointmentId) => {
    return AppointmentModel.getAppointmentById(appointmentId);
  }, []);

  const getAppointmentPayment = useCallback((appointmentId) => {
    return AppointmentModel.getPaymentByAppointment(appointmentId);
  }, []);

  // Standard booking (with validation - from patient portal)
  const bookAppointment = useCallback(async (bookingData) => {
    try {
      // Check if it's the rich bookingData format from patient portal or flat format
      if (bookingData.doctorId && bookingData.date && bookingData.time) {
        const validation = await AppointmentModel.validateBooking(bookingData);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
        const newApt = await AppointmentModel.book(bookingData);
        if (!newApt) {
           return { success: false, error: 'Không thể lưu lịch hẹn vào cơ sở dữ liệu (Có thể do lỗi phân quyền RLS trên Supabase).' };
        }
        refreshState();
        return { success: true, appointment: newApt };
      } else {
        // Fallback to simpler addAppointment
        const newApt = await AppointmentModel.addAppointment(bookingData);
        if (!newApt) {
           return { success: false, error: 'Không thể lưu lịch hẹn (Lỗi RLS).' };
        }
        refreshState();
        return newApt;
      }
    } catch (e) {
      // If caller expects a status object
      return { success: false, error: e.message };
    }
  }, [refreshState]);

  const changeAppointment = useCallback((appointmentId, updatedData) => {
    const updatedApt = AppointmentModel.updateAppointment(appointmentId, updatedData);
    refreshState();
    return updatedApt;
  }, [refreshState]);

  const cancelAppointment = useCallback(async (appointmentId) => {
    try {
      // First try rich cancel method
      const updatedApt = await AppointmentModel.cancel(appointmentId);
      refreshState();
      return { success: true, appointment: updatedApt };
    } catch (e) {
      // Fallback: update status to Đã hủy or check if it throws
      try {
        const cancelledApt = await AppointmentModel.updateAppointmentStatus(appointmentId, 'Cancelled');
        refreshState();
        return cancelledApt;
      } catch (err) {
        return { success: false, error: e.message };
      }
    }
  }, [refreshState]);

  const updateAppointmentStatus = useCallback((appointmentId, status) => {
    try {
      const updatedApt = AppointmentModel.updateStatus(appointmentId, status);
      refreshState();
      return { success: true, appointment: updatedApt };
    } catch (e) {
      try {
        const updatedApt = AppointmentModel.updateAppointmentStatus(appointmentId, status);
        refreshState();
        return { success: true, appointment: updatedApt };
      } catch (err) {
        return { success: false, error: e.message };
      }
    }
  }, [refreshState]);

  const payAppointment = useCallback((payData) => {
    const newPayment = AppointmentModel.addPayment(payData);
    refreshState();
    return newPayment;
  }, [refreshState]);

  const approveAppointment = useCallback((appointmentId, receptionistId) => {
    const apt = AppointmentModel.getAppointmentById(appointmentId);
    if (!apt) {
      throw new Error('Không tìm thấy lịch hẹn cần phê duyệt.');
    }

    // Kiểm tra trùng lịch của bác sĩ
    const list = AppointmentModel.getAllAppointments();
    const isDoubleBooked = list.some(a => 
      a.doctor_id === apt.doctor_id && 
      a.appointment_date === apt.appointment_date && 
      a.start_time === apt.start_time && 
      a.appointment_id !== appointmentId && 
      (a.status === 'Đã xác nhận' || a.status === 'Đang chờ' || a.status === 'Đã khám')
    );
    if (isDoubleBooked) {
      throw new Error('Bác sĩ đã có lịch hẹn được xác nhận/check-in vào khung giờ này. Không thể phê duyệt.');
    }

    const approvedApt = AppointmentModel.updateAppointment(appointmentId, {
      status: 'Đã xác nhận',
      receptionist_id: receptionistId
    });

    try {
      NotificationModel.sendNotification(
        'PATIENT',
        apt.patient_id,
        'Lịch hẹn khám đã được phê duyệt',
        `Lịch hẹn khám dịch vụ ${apt.service_name} với ${apt.doctor_name} vào lúc ${apt.start_time} ngày ${apt.appointment_date} đã được phê duyệt thành công. Vui lòng đến phòng khám đúng giờ.`
      );
    } catch (err) {
      console.warn("Failed to send notification upon approval", err);
    }

    refreshState();
    return approvedApt;
  }, [refreshState]);

  const checkinAppointment = useCallback((appointmentId) => {
    const completedApt = AppointmentModel.updateAppointmentStatus(appointmentId, 'Đang chờ');
    refreshState();
    return completedApt;
  }, [refreshState]);

  // Check if a slot is booked
  const isSlotBooked = useCallback((docId, date, time) => {
    if (!Array.isArray(appointments)) return false;
    const isBooked = appointments.some(
      a =>
        String(a.doctor_id || a.doctorId) === String(docId) &&
        a.date === date &&
        a.time === time &&
        a.status !== 'Đã hủy'
    );
    if (isBooked) return true;

    // Check locks
    const lockedListStr = localStorage.getItem('dermasmart_locked_slots') || '[]';
    let lockedList = [];
    try { lockedList = JSON.parse(lockedListStr); } catch (e) {}
    const activeLocks = lockedList?.filter?.(l => l.lockedUntil > Date.now());
    return activeLocks.some(l => String(l.doctorId) === String(docId) && l.date === date && l.time === time);
  }, [appointments]);

  // Get doctor schedules and filter out booked slots for UI display
  const getAvailableSlots = useCallback((docId, date, providedSchedules = []) => {
    // Read Admin schedules (from provided args or fallback)
    const savedSchedules = localStorage.getItem('admin-doctor-schedules');
    const fallbackSchedules = savedSchedules ? JSON.parse(savedSchedules) : [];
    const adminSchedules = providedSchedules.length > 0 ? providedSchedules : fallbackSchedules;

    // Filter schedules for this doctor and date
    const dailySchedules = adminSchedules.filter(s => 
      String(s.doctorId || s.doctor_id) === String(docId) && 
      (s.date === date || s.work_date === date)
    );

    if (dailySchedules.length === 0) {
      return []; // Doctor is not scheduled to work on this day
    }

    // Helper to check if a time slot is in the past
    const todayDate = new Date();
    const todayStr = `${todayDate.getFullYear()}-${(todayDate.getMonth() + 1).toString().padStart(2, '0')}-${todayDate.getDate().toString().padStart(2, '0')}`;
    const currentMins = todayDate.getHours() * 60 + todayDate.getMinutes();

    const isPastSlot = (slotTimeStr) => {
      if (date < todayStr) return true;
      if (date === todayStr) {
        const [h, m] = slotTimeStr.split(':').map(Number);
        return (h * 60 + m) <= currentMins;
      }
      return false;
    };

    const slots = [];
    
    dailySchedules.forEach(schedule => {
      const startTimeStr = schedule.startTime || schedule.start_time;
      const endTimeStr = schedule.endTime || schedule.end_time;
      
      if (!startTimeStr || !endTimeStr) return;

      const startParts = startTimeStr.split(':').map(Number);
      const endParts = endTimeStr.split(':').map(Number);
      let currentMin = startParts[0] * 60 + startParts[1];
      const endMin = endParts[0] * 60 + endParts[1];

      while (currentMin < endMin) {
        const h = Math.floor(currentMin / 60).toString().padStart(2, '0');
        const m = (currentMin % 60).toString().padStart(2, '0');
        const timeStr = `${h}:${m}`;
        
        // Ensure we don't add duplicates if schedules overlap
        if (!slots.some(s => s.time === timeStr)) {
          slots.push({
            time: timeStr,
            isBooked: isPastSlot(timeStr) || isSlotBooked(docId, date, timeStr)
          });
        }
        currentMin += 30; // 30-minute intervals
      }
    });

    // Sort slots chronologically
    slots.sort((a, b) => a.time.localeCompare(b.time));

    return slots;
  }, [isSlotBooked]);

  const addDirectAppointment = useCallback(async (apt) => {
    try {
      const validation = await AppointmentModel.validateBooking(apt);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
      const newApt = await AppointmentModel.addDirect(apt);
      refreshState();
      return { success: true, appointment: newApt };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }, [refreshState]);

  const rescheduleAppointment = useCallback(async (appointmentId, newDate, newTime) => {
    try {
      const updatedApt = await AppointmentModel.reschedule(appointmentId, newDate, newTime);
      refreshState();
      return { success: true, appointment: updatedApt };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }, [refreshState]);

  return {
    appointments,
    payments,
    loading,
    getPatientAppointments,
    getAllAppointments,
    getAppointmentDetails,
    getAppointmentPayment,
    bookAppointment,
    changeAppointment,
    cancelAppointment,
    payAppointment,
    approveAppointment,
    checkinAppointment,
    refreshState,
    updateAppointmentStatus,
    addDirectAppointment,
    rescheduleAppointment,
    isSlotBooked,
    getAvailableSlots,
    canCancel: AppointmentModel.canCancel,
    lockSlot: AppointmentModel.lockSlot.bind(AppointmentModel)
  };
}
