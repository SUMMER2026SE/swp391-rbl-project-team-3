import { useState, useEffect, useRef } from 'react';
import { FeedbackModel } from '../models/FeedbackModel';

export function useFeedbackController(filterBy = {}) {
  // Stable refs để tránh re-render loop
  const patientIdRef = useRef(filterBy.patientId);
  const doctorIdRef  = useRef(filterBy.doctorId);
  patientIdRef.current = filterBy.patientId;
  doctorIdRef.current  = filterBy.doctorId;

  const [feedbacks, setFeedbacks] = useState(() => {
    const all = FeedbackModel.getAll();
    return applyFilter(all, filterBy);
  });

  useEffect(() => {
    // Re-filter whenever filterBy values change
    const all = FeedbackModel.getAll();
    setFeedbacks(applyFilter(all, { patientId: patientIdRef.current, doctorId: doctorIdRef.current }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBy.patientId, filterBy.doctorId]);

  useEffect(() => {
    const handleUpdate = () => {
      const all = FeedbackModel.getAll();
      setFeedbacks(applyFilter(all, { patientId: patientIdRef.current, doctorId: doctorIdRef.current }));
    };
    window.addEventListener('feedbacks-updated', handleUpdate);
    return () => window.removeEventListener('feedbacks-updated', handleUpdate);
  }, []);

  function applyFilter(list, filter) {
    let result = list;
    if (filter.patientId) result = result.filter(f => f.patientId === filter.patientId);
    if (filter.doctorId)  result = result.filter(f => f.doctorId  === filter.doctorId);
    return result;
  }

  // Get ALL feedbacks regardless of filter (for admin/overview)
  const getAllFeedbacks = () => FeedbackModel.getAll();

  const submitFeedback = (data) => {
    try {
      const fb = FeedbackModel.submit(data);
      return { success: true, feedback: fb };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const getFeedbackByAppointment = (appointmentId) =>
    FeedbackModel.getByAppointmentId(appointmentId);

  const updateStatus = (feedbackId, status) => {
    try {
      FeedbackModel.updateStatus(feedbackId, status);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const replyToFeedback = (feedbackId, replyText) => {
    try {
      FeedbackModel.replyToFeedback(feedbackId, replyText);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const getStats = (list = null) => FeedbackModel.getStats(list);

  return {
    feedbacks,
    getAllFeedbacks,
    submitFeedback,
    getFeedbackByAppointment,
    updateStatus,
    replyToFeedback,
    getStats,
  };
}
