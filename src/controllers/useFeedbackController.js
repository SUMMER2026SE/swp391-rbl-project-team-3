import { useState, useEffect, useRef } from 'react';
import { FeedbackModel } from '../models/FeedbackModel';

export function useFeedbackController(filterBy = {}) {
  const patientIdRef = useRef(filterBy.patientId);
  const doctorIdRef  = useRef(filterBy.doctorId);
  patientIdRef.current = filterBy.patientId;
  doctorIdRef.current  = filterBy.doctorId;

  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const all = await FeedbackModel.getAll();
      setFeedbacks(applyFilter(all || [], { patientId: patientIdRef.current, doctorId: doctorIdRef.current }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBy.patientId, filterBy.doctorId]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchFeedbacks();
    };
    window.addEventListener('feedbacks-updated', handleUpdate);
    return () => window.removeEventListener('feedbacks-updated', handleUpdate);
  }, []);

  function applyFilter(list, filter) {
    let result = list;
    if (filter.patientId) result = result?.filter?.(f => f.patientId === filter.patientId);
    if (filter.doctorId)  result = result?.filter?.(f => f.doctorId  === filter.doctorId);
    return result;
  }

  const getAllFeedbacks = async () => {
    return await FeedbackModel.getAll();
  };

  const submitFeedback = async (data) => {
    try {
      const fb = await FeedbackModel.create(data);
      await fetchFeedbacks();
      return { success: true, feedback: fb };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  // Stubs for missing model methods
  const getFeedbackByAppointment = async (appointmentId) => {
     console.warn("getFeedbackByAppointment not implemented in model");
     return null;
  };

  const updateStatus = async (feedbackId, status) => {
    console.warn("updateStatus not implemented in model");
    return { success: false, error: "Not implemented" };
  };

  const replyToFeedback = async (feedbackId, replyText) => {
    console.warn("replyToFeedback not implemented in model");
    return { success: false, error: "Not implemented" };
  };

  const getStats = (list = null) => {
    const data = list || feedbacks;
    return {
      total: data.length,
      averageRating: data.length ? data.reduce((sum, f) => sum + (f.rating || 0), 0) / data.length : 0
    };
  };

  return {
    feedbacks,
    isLoading,
    error,
    refresh: fetchFeedbacks,
    getAllFeedbacks,
    submitFeedback,
    getFeedbackByAppointment,
    updateStatus,
    replyToFeedback,
    getStats,
  };
}
