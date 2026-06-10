import { useState, useEffect, useCallback } from 'react';
import { AppointmentModel } from '../models/AppointmentModel';
import { DoctorModel } from '../models/DoctorModel';
import { NotificationModel } from '../models/NotificationModel';

export function useAppointmentController(patientId = null) {
  // Read state initially
  const [appointments, setAppointments] = useState(() => {
    return patientId 
      ? AppointmentModel.getByPatientId(patientId)
      : AppointmentModel.getAllAppointments();
  });
  const [payments, setPayments] = useState(() => AppointmentModel.getAllPayments());

  const refreshState = useCallback(() => {
    setAppointments(
      patientId
        ? AppointmentModel.getByPatientId(patientId)
        : AppointmentModel.getAllAppointments()
    );
    setPayments(AppointmentModel.getAllPayments());
  }, [patientId]);

  // Keep state in sync with localStorage updates via custom events
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
  const bookAppointment = useCallback((bookingData) => {
    try {
      // Check if it's the rich bookingData format from patient portal or flat format
      if (bookingData.doctorId && bookingData.date && bookingData.time) {
        const newApt = AppointmentModel.book(bookingData);
        refreshState();
        return { success: true, appointment: newApt };
      } else {
        // Fallback to simpler addAppointment
        const newApt = AppointmentModel.addAppointment(bookingData);
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

  const cancelAppointment = useCallback((appointmentId) => {
    try {
      // First try rich cancel method
      const updatedApt = AppointmentModel.cancel(appointmentId);
      refreshState();
      return { success: true, appointment: updatedApt };
    } catch (e) {
      // Fallback: update status to Đã hủy or check if it throws
      try {
        const cancelledApt = AppointmentModel.updateAppointmentStatus(appointmentId, 'Đã hủy');
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
    return AppointmentModel.isTimeSlotBooked(docId, date, time);
  }, []);

  // Get doctor schedules and filter out booked slots for UI display
  const getAvailableSlots = useCallback((docId, date) => {
    const dayOfWeek = AppointmentModel.getLocalDayOfWeek(date);
    const workingDays = AppointmentModel.getDoctorWorkingDays(docId);
    if (workingDays.length > 0 && !workingDays.includes(dayOfWeek)) {
      return [];
    }

    // Find doctor's name
    const doc = DoctorModel.getAllDoctors().find(d => d.id === docId);
    const docName = doc ? doc.name : '';

    // Read Admin consultation slots
    const savedSlots = localStorage.getItem('admin-consultation-slots');
    const adminSlots = savedSlots ? JSON.parse(savedSlots) : [];

    // Filter slots for this doctor and date
    const dailySlots = adminSlots.filter(s => s.doctorName === docName && s.date === date);

    if (dailySlots.length > 0) {
      return dailySlots.map(s => ({
        time: s.startTime,
        isBooked: s.status === 'Đã đặt' || s.status === 'Đã hủy' || isSlotBooked(docId, date, s.startTime)
      }));
    }

    // Fallback: Default standard slots if Admin hasn't generated specific slots
    const standardSlots = [
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
      "11:00", "11:30", "13:30", "14:00", "14:30", "15:00",
      "15:30", "16:00", "16:30",
    ];

    return standardSlots.map(time => ({
      time,
      isBooked: isSlotBooked(docId, date, time)
    }));
  }, [isSlotBooked]);

  const addDirectAppointment = useCallback((apt) => {
    try {
      const newApt = AppointmentModel.addDirect(apt);
      refreshState();
      return { success: true, appointment: newApt };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }, [refreshState]);

  const rescheduleAppointment = useCallback((appointmentId, newDate, newTime) => {
    try {
      const updatedApt = AppointmentModel.reschedule(appointmentId, newDate, newTime);
      refreshState();
      return { success: true, appointment: updatedApt };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }, [refreshState]);

  return {
    appointments,
    payments,
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
    canCancel: AppointmentModel.canCancel
  };
}
