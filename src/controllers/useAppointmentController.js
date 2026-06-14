import { useState, useEffect, useCallback } from 'react';
import { AppointmentModel } from '../models/AppointmentModel';
import { DoctorModel } from '../models/DoctorModel';

export function useAppointmentController(patientId = null) {
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshState = useCallback(async () => {
    try {
      setLoading(true);
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
        refreshState();
        return { success: true, appointment: newApt };
      } else {
        // Fallback to simpler addAppointment
        const newApt = await AppointmentModel.addAppointment(bookingData);
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
      // Fallback: update status to Cancelled or check if it throws
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
    const approvedApt = AppointmentModel.updateAppointment(appointmentId, {
      status: 'Pending',
      receptionist_id: receptionistId
    });
    refreshState();
    return approvedApt;
  }, [refreshState]);

  const checkinAppointment = useCallback((appointmentId) => {
    const completedApt = AppointmentModel.updateAppointmentStatus(appointmentId, 'Completed');
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
  const getAvailableSlots = useCallback((docId, date) => {
    const dayOfWeek = AppointmentModel.getLocalDayOfWeek(date);
    const workingDays = AppointmentModel.getDoctorWorkingDays(docId);
    if (workingDays.length > 0 && !workingDays.includes(dayOfWeek)) {
      return [];
    }

    // Find doctor's name
    const doc = DoctorModel.getAllDoctorsSync().find(d => String(d.id || d.user_id) === String(docId));
    const docName = doc ? doc.name : '';

    // Read Admin consultation slots
    const savedSlots = localStorage.getItem('admin-consultation-slots');
    const adminSlots = savedSlots ? JSON.parse(savedSlots) : [];

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

    // Filter slots for this doctor and date
    const dailySlots = adminSlots?.filter?.(s => s.doctorName === docName && s.date === date);

    if (dailySlots.length > 0) {
      return dailySlots?.map?.(s => ({
        time: s.startTime,
        isBooked: isPastSlot(s.startTime) || s.status === 'Đã đặt' || s.status === 'Đã hủy' || isSlotBooked(docId, date, s.startTime)
      }));
    }

    // Fallback: Default standard slots if Admin hasn't generated specific slots
    const standardSlots = [
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
      "11:00", "11:30", "13:30", "14:00", "14:30", "15:00",
      "15:30", "16:00", "16:30",
    ];

    return standardSlots?.map?.(time => ({
      time,
      isBooked: isPastSlot(time) || isSlotBooked(docId, date, time)
    }));
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
