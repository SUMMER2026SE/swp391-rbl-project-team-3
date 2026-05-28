import { useState, useCallback } from 'react';
import { AppointmentModel } from '../models/AppointmentModel';

export function useAppointmentController() {
  const [appointments, setAppointments] = useState(() => AppointmentModel.getAllAppointments());
  const [payments, setPayments] = useState(() => AppointmentModel.getAllPayments());

  const refreshState = useCallback(() => {
    setAppointments(AppointmentModel.getAllAppointments());
    setPayments(AppointmentModel.getAllPayments());
  }, []);

  const getPatientAppointments = useCallback((patientId) => {
    return AppointmentModel.getAppointmentsByUser(patientId);
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

  const bookAppointment = useCallback((aptData) => {
    const newApt = AppointmentModel.addAppointment(aptData);
    refreshState();
    return newApt;
  }, [refreshState]);

  const changeAppointment = useCallback((appointmentId, updatedData) => {
    const updatedApt = AppointmentModel.updateAppointment(appointmentId, updatedData);
    refreshState();
    return updatedApt;
  }, [refreshState]);

  const cancelAppointment = useCallback((appointmentId) => {
    const cancelledApt = AppointmentModel.updateAppointmentStatus(appointmentId, 'Cancelled');
    refreshState();
    return cancelledApt;
  }, [refreshState]);

  const payAppointment = useCallback((payData) => {
    // payData should contain: appointment_id, patient_id, total_amount, discount_amount, final_amount, payment_method, voucher_id
    const newPayment = AppointmentModel.addPayment(payData);
    refreshState();
    return newPayment;
  }, [refreshState]);

  const approveAppointment = useCallback((appointmentId, receptionistId) => {
    // Function for receptionist to approve appointments
    const approvedApt = AppointmentModel.updateAppointment(appointmentId, {
      status: 'Pending', // Keeps status pending but assigns a receptionist if necessary, or updates visual queues
      receptionist_id: receptionistId
    });
    refreshState();
    return approvedApt;
  }, [refreshState]);

  const checkinAppointment = useCallback((appointmentId) => {
    // Receptionist checks in patient, mark as Completed
    const completedApt = AppointmentModel.updateAppointmentStatus(appointmentId, 'Completed');
    refreshState();
    return completedApt;
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
    refreshState
  };
}
