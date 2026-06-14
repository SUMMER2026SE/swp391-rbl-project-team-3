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
    let result = Array.isArray(list) ? list : [];
    if (filter.patientId) result = result.filter(f => f.patientId === filter.patientId);
    if (filter.doctorId)  result = result.filter(f => f.doctorId  === filter.doctorId);
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
    const data = Array.isArray(list || feedbacks) ? (list || feedbacks) : [];
    const total = data.length;
    
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const criteriaSums = { doctor: 0, technician: 0, treatmentEffect: 0, waitingTime: 0, facility: 0 };
    const criteriaCounts = { doctor: 0, technician: 0, treatmentEffect: 0, waitingTime: 0, facility: 0 };
    
    let sumRating = 0;
    
    data.forEach(f => {
      if (!f) return;
      const r = Math.round(f.overallRating || f.rating || 0);
      if (r >= 1 && r <= 5) {
        distribution[r] = (distribution[r] || 0) + 1;
      }
      sumRating += (f.overallRating || f.rating || 0);
      
      const cr = f.criteriaRatings || {};
      Object.keys(criteriaSums).forEach(key => {
        const val = cr[key] !== undefined ? cr[key] : f[key];
        if (typeof val === 'number' && val > 0) {
          criteriaSums[key] += val;
          criteriaCounts[key] += 1;
        }
      });
    });
    
    const avg = total > 0 ? (Math.round((sumRating / total) * 10) / 10) : 0;
    
    const criteria = {};
    Object.keys(criteriaSums).forEach(key => {
      criteria[key] = criteriaCounts[key] > 0 ? criteriaSums[key] / criteriaCounts[key] : 0;
    });
    
    return {
      total,
      averageRating: avg,
      avg,
      distribution,
      criteria
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
