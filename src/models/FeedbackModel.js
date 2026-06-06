import { mockFeedbacks } from '../mockData';
import { AppointmentModel } from './AppointmentModel';
import { DoctorModel } from './DoctorModel';
import { SystemLogModel } from './SystemLogModel';

const STORAGE_KEY = 'dermasmart_feedbacks';

const TOXIC_WORDS = ['đm', 'đéo', 'vcl', 'clm', 'khốn nạn', 'mất dạy', 'lừa đảo', 'cút', 'đĩ', 'mẹ kiếp'];

function hasInappropriateLanguage(text) {
  if (!text) return false;
  const normalizedText = text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
  const words = normalizedText.split(/\s+/);
  return words.some(w => TOXIC_WORDS.includes(w));
}

export const FeedbackModel = {
  // ── Init from mockData if localStorage is empty ──────────────────────────
  init() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockFeedbacks));
    }
  },

  // ── Read ──────────────────────────────────────────────────────────────────
  getAll() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return mockFeedbacks;
    }
  },

  save(feedbacks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbacks));
    window.dispatchEvent(new CustomEvent('feedbacks-updated'));
  },

  getByAppointmentId(appointmentId) {
    return this.getAll().find(f => f.appointmentId === appointmentId) || null;
  },

  getByPatientId(patientId) {
    return this.getAll().filter(f => f.patientId === patientId);
  },

  getByDoctorId(doctorId) {
    return this.getAll().filter(f => f.doctorId === doctorId);
  },

  // ── Submit new feedback ───────────────────────────────────────────────────
  submit(data) {
    // 1. Get and check appointment eligibility
    const apt = AppointmentModel.getAll().find(a => a.id === data.appointmentId);
    if (!apt) {
      throw new Error('Không tìm thấy thông tin lịch hẹn.');
    }
    
    // Completed appointment rule
    if (apt.status !== 'Đã khám') {
      throw new Error('Chỉ có thể đánh giá các lịch hẹn đã hoàn thành khám.');
    }

    // One feedback rule
    const existing = this.getByAppointmentId(data.appointmentId);
    if (existing || apt.status === 'Reviewed') {
      throw new Error('Lịch hẹn này đã được gửi đánh giá trước đó.');
    }

    // Rating required rule
    if (!data.overallRating || data.overallRating < 1 || data.overallRating > 5) {
      throw new Error('Vui lòng chọn số sao đánh giá (từ 1 đến 5).');
    }

    // Content validation rule
    if (hasInappropriateLanguage(data.comment)) {
      throw new Error('Nội dung đánh giá chứa từ ngữ không phù hợp. Vui lòng điều chỉnh lại.');
    }

    const feedbacks = this.getAll();
    const newFeedback = {
      id: `fb-${Date.now()}`,
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      patientName: data.isAnonymous ? 'Ẩn danh' : data.patientName,
      isAnonymous: data.isAnonymous || false,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      service: data.service,
      date: data.date,
      submittedAt: new Date().toISOString(),

      // Ratings
      overallRating: data.overallRating,
      criteriaRatings: {
        doctor: data.criteriaRatings?.doctor ?? 0,
        technician: data.criteriaRatings?.technician ?? 0,
        treatmentEffect: data.criteriaRatings?.treatmentEffect ?? 0,
        waitingTime: data.criteriaRatings?.waitingTime ?? 0,
        facility: data.criteriaRatings?.facility ?? 0,
      },

      // Comment & images
      comment: data.comment || '',
      images: data.images || [],      // array of base64 or URL strings

      // Status
      status: 'published',            // 'published' | 'hidden' | 'flagged'
      isPublic: data.isPublic !== false,
      adminReply: null,
    };

    feedbacks.unshift(newFeedback);
    this.save(feedbacks);

    // Post-actions:
    // Update appointment status to 'Reviewed'
    AppointmentModel.updateStatus(data.appointmentId, 'Reviewed');

    // Update doctor average rating
    DoctorModel.updateDoctorRating(data.doctorId, data.overallRating);

    // Record activity log
    const actorName = data.isAnonymous ? 'Bệnh nhân (Ẩn danh)' : `Bệnh nhân (${data.patientName})`;
    SystemLogModel.addLog(
      actorName,
      'SUBMIT_FEEDBACK',
      data.appointmentId,
      `Đã gửi đánh giá ${data.overallRating} sao cho bác sĩ ${data.doctorName}`,
      'Success'
    );

    return newFeedback;
  },

  // ── Admin actions ─────────────────────────────────────────────────────────
  updateStatus(feedbackId, status) {
    const feedbacks = this.getAll();
    const idx = feedbacks.findIndex(f => f.id === feedbackId);
    if (idx === -1) throw new Error('Không tìm thấy đánh giá.');
    feedbacks[idx] = { ...feedbacks[idx], status };
    this.save(feedbacks);
    return feedbacks[idx];
  },

  replyToFeedback(feedbackId, replyText) {
    const feedbacks = this.getAll();
    const idx = feedbacks.findIndex(f => f.id === feedbackId);
    if (idx === -1) throw new Error('Không tìm thấy đánh giá.');
    feedbacks[idx] = {
      ...feedbacks[idx],
      adminReply: { text: replyText, repliedAt: new Date().toISOString() },
    };
    this.save(feedbacks);
    return feedbacks[idx];
  },

  // ── Statistics ────────────────────────────────────────────────────────────
  getStats(feedbackList = null) {
    const list = feedbackList || this.getAll().filter(f => f.status === 'published');
    if (!list.length) return { avg: 0, total: 0, distribution: {1:0,2:0,3:0,4:0,5:0}, criteria: {} };

    const total = list.length;
    const avg = list.reduce((s, f) => s + f.overallRating, 0) / total;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    list.forEach(f => { distribution[f.overallRating] = (distribution[f.overallRating] || 0) + 1; });

    const criteriaKeys = ['doctor', 'technician', 'treatmentEffect', 'waitingTime', 'facility'];
    const criteria = {};
    criteriaKeys.forEach(k => {
      const vals = list.map(f => f.criteriaRatings?.[k] || 0).filter(v => v > 0);
      criteria[k] = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    });

    return { avg: Math.round(avg * 10) / 10, total, distribution, criteria };
  },
};
