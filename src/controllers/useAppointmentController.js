import { useState, useEffect } from 'react';
import { AppointmentModel } from '../models/AppointmentModel';
import { doctors } from '../mockData';

export function useAppointmentController(patientId = null) {
  const [appointments, setAppointments] = useState(() => {
    return patientId 
      ? AppointmentModel.getByPatientId(patientId)
      : AppointmentModel.getAll();
  });

  // Keep state in sync with localStorage updates via custom events
  useEffect(() => {
    const handleUpdate = () => {
      setAppointments(
        patientId
          ? AppointmentModel.getByPatientId(patientId)
          : AppointmentModel.getAll()
      );
    };

    window.addEventListener('appointments-updated', handleUpdate);
    return () => {
      window.removeEventListener('appointments-updated', handleUpdate);
    };
  }, [patientId]);

  const bookAppointment = (bookingData) => {
    try {
      const newApt = AppointmentModel.book(bookingData);
      return { success: true, appointment: newApt };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const cancelAppointment = (appointmentId) => {
    try {
      const updatedApt = AppointmentModel.cancel(appointmentId);
      return { success: true, appointment: updatedApt };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const updateAppointmentStatus = (appointmentId, status) => {
    try {
      const updatedApt = AppointmentModel.updateStatus(appointmentId, status);
      return { success: true, appointment: updatedApt };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  // Check if a slot is booked
  const isSlotBooked = (docId, date, time) => {
    return AppointmentModel.isTimeSlotBooked(docId, date, time);
  };

  // Get doctor schedules and filter out booked slots for UI display
  const getAvailableSlots = (docId, date) => {
    // If doctor is not working on that day of week, return empty array
    const dayOfWeek = AppointmentModel.getLocalDayOfWeek(date);
    const workingDays = AppointmentModel.getDoctorWorkingDays(docId);
    if (workingDays.length > 0 && !workingDays.includes(dayOfWeek)) {
      return [];
    }

    // In a real clinic, time slots would be dynamic.
    // For this mock, we use the standard mockTimeSlots and filter out booked ones.
    const standardSlots = [
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
      "11:00", "11:30", "13:30", "14:00", "14:30", "15:00",
      "15:30", "16:00", "16:30",
    ];

    return standardSlots.map(time => ({
      time,
      isBooked: isSlotBooked(docId, date, time)
    }));
  };

  const addDirectAppointment = (apt) => {
    try {
      const newApt = AppointmentModel.addDirect(apt);
      return { success: true, appointment: newApt };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const rescheduleAppointment = (appointmentId, newDate, newTime) => {
    try {
      const updatedApt = AppointmentModel.reschedule(appointmentId, newDate, newTime);
      return { success: true, appointment: updatedApt };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  return {
    appointments,
    bookAppointment,
    cancelAppointment,
    updateAppointmentStatus,
    addDirectAppointment,
    rescheduleAppointment,
    isSlotBooked,
    getAvailableSlots,
    canCancel: AppointmentModel.canCancel
  };
}
