import { useState, useEffect, useCallback } from 'react';
import { AppointmentModel } from '../models/AppointmentModel';
import { DoctorModel } from '../models/DoctorModel';
import { NotificationModel } from '../models/NotificationModel';

export function useAppointmentController(patientId = null) {
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshState = useCallback(async () => {
    try {
      setLoading(true);
      await DoctorModel.getAllDoctors(); // Ensure doctors are cached for mapping
      
      const allApts = await AppointmentModel.getAllAppointments();
      setAllAppointments(allApts || []);
      
      if (patientId) {
        setAppointments((allApts || []).filter(a => String(a.patient_id || a.patientId) === String(patientId)));
      } else {
        setAppointments(allApts || []);
      }

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
        
        // ---- Trigger Notifications ----
        try {
          const prefsStr = localStorage.getItem('dermasmart_notification_prefs');
          const prefs = prefsStr ? JSON.parse(prefsStr) : { email: true, sms: false, inApp: true };
          if (prefs.inApp && bookingData.patientId) {
            NotificationModel.sendNotification(
              'PATIENT', bookingData.patientId, 
              'Đặt lịch hẹn thành công', 
              `Bạn đã đặt lịch hẹn khám lúc ${bookingData.time} ngày ${bookingData.date}.`
            );
          }
          if (prefs.email) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('show-toast', {
                detail: { message: `Đã gửi email xác nhận đặt lịch tới hòm thư của bạn.`, type: 'info' }
              }));
            }, 500);
          }
          if (prefs.sms) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('show-toast', {
                detail: { message: `Đã gửi SMS xác nhận tới số điện thoại của bạn.`, type: 'info' }
              }));
            }, 1000);
          }
        } catch(e) {}

        refreshState();
        return { success: true, appointment: newApt };
      } else {
        // Fallback to simpler addAppointment
        const newApt = await AppointmentModel.addAppointment(bookingData);
        if (!newApt) {
           return { success: false, error: 'Không thể lưu lịch hẹn (Lỗi RLS).' };
        }

        // ---- Trigger Notifications ----
        try {
          const prefsStr = localStorage.getItem('dermasmart_notification_prefs');
          const prefs = prefsStr ? JSON.parse(prefsStr) : { email: true, sms: false, inApp: true };
          if (prefs.inApp && bookingData.patientId) {
            NotificationModel.sendNotification(
              'PATIENT', bookingData.patientId, 
              'Đặt lịch hẹn thành công', 
              `Bạn đã đặt lịch hẹn khám lúc ${bookingData.start_time || bookingData.time} ngày ${bookingData.appointment_date || bookingData.date}.`
            );
          }
          if (prefs.email) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('show-toast', {
                detail: { message: `Đã gửi email xác nhận đặt lịch tới hòm thư của bạn.`, type: 'info' }
              }));
            }, 500);
          }
          if (prefs.sms) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('show-toast', {
                detail: { message: `Đã gửi SMS xác nhận tới số điện thoại của bạn.`, type: 'info' }
              }));
            }, 1000);
          }
        } catch(e) {}

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
    if (!Array.isArray(allAppointments)) return false;
    const isBooked = allAppointments.some(
      a => {
        if (String(a.doctor_id || a.doctorId) !== String(docId)) return false;
        if (a.date !== date && a.appointment_date !== date) return false;
        if (a.time !== time && a.start_time !== time) return false;
        if (a.status === 'Đã hủy') return false;
        if (a.status === 'Đang giữ chỗ') {
          const createdAt = new Date(a.created_at || Date.now()).getTime();
          if (Date.now() - createdAt > 5 * 60 * 1000) return false;
        }
        return true;
      }
    );
    if (isBooked) return true;

    // Check locks
    const lockedListStr = localStorage.getItem('dermasmart_locked_slots') || '[]';
    let lockedList = [];
    try { lockedList = JSON.parse(lockedListStr); } catch (e) {}
    const activeLocks = lockedList?.filter?.(l => l.lockedUntil > Date.now());
    return activeLocks.some(l => String(l.doctorId) === String(docId) && l.date === date && l.time === time);
  }, [allAppointments]);

  // Get doctor schedules and filter out booked slots for UI display
  const getAvailableSlots = useCallback((docId, date, providedSchedules = []) => {
    // Read Admin schedules (from provided args or fallback)
    const savedSchedules = localStorage.getItem('admin-doctor-schedules');
    const fallbackSchedules = savedSchedules ? JSON.parse(savedSchedules) : [];
    const adminSchedules = providedSchedules.length > 0 ? providedSchedules : fallbackSchedules;

    // Filter schedules for this doctor and date
    const dailySchedules = adminSchedules.filter(s => 
      String(s.doctorId || s.doctor_id) === String(docId) && 
      (s.date === date || s.work_date === date) &&
      s.status === 'Đã xác nhận'
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

  // Validate a booking payload BEFORE taking payment (date/time, doctor schedule,
  // double-booking, patient limits). Returns { valid, error }.
  const validateBooking = useCallback((bookingData) => {
    return AppointmentModel.validateBooking(bookingData);
  }, []);

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
    validateBooking,
    isSlotBooked,
    getAvailableSlots,
    canCancel: AppointmentModel.canCancel,
    isWithin24h: AppointmentModel.isWithin24h.bind(AppointmentModel),
    lockSlot: AppointmentModel.lockSlot.bind(AppointmentModel),
    holdSlot: useCallback(async (bookingData) => {
      const dbPayload = {
        doctor_id: bookingData.doctorId,
        patient_id: bookingData.patientId,
        // Carry guest identity on the hold row so it's never confused with the
        // shared FK anchor and survives through to the confirmed appointment.
        patient_name: bookingData.patientName,
        patient_phone: bookingData.patientPhone,
        service: bookingData.service,
        fee: bookingData.fee,
        status: 'Đang giữ chỗ',
        appointment_date: bookingData.date,
        start_time: bookingData.time,
        end_time: AppointmentModel.addMinutesToTime(bookingData.time, 30),
        reason: bookingData.patientPhone || bookingData.patientEmail || 'Guest',
      };
      const holdApt = await AppointmentModel.create(dbPayload);
      refreshState();
      return holdApt;
    }, [refreshState])
  };
}
