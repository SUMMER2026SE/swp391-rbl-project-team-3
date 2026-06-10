import { mockFeedbacks } from '../mockData';

const STORAGE_KEY = 'dermasmart_feedbacks';

export const FeedbackModel = {
  // ── Xóa cache cũ và seed lại nếu version thay đổi ──────────────────────
  init() {
    const CURRENT_VERSION = 'v4';
    const storedVersion = localStorage.getItem(STORAGE_KEY + '_version');
    if (!localStorage.getItem(STORAGE_KEY) || storedVersion !== CURRENT_VERSION) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockFeedbacks));
      localStorage.setItem(STORAGE_KEY + '_version', CURRENT_VERSION);
    }
  },

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
    // Chỉ được đánh giá lịch hẹn đã khám
    if (!data.appointmentId) {
      throw new Error('Thiếu thông tin lịch hẹn.');
    }

    // Kiểm tra đã đánh giá chưa
    const existing = this.getByAppointmentId(data.appointmentId);
    if (existing) {
      throw new Error('Bạn đã gửi đánh giá cho lượt khám này rồi.');
    }

    if (!data.overallRating || data.overallRating < 1 || data.overallRating > 5) {
      throw new Error('Vui lòng chọn số sao đánh giá (1–5).');
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
      overallRating: data.overallRating,
      criteriaRatings: {
        doctor: data.criteriaRatings?.doctor ?? 0,
        technician: data.criteriaRatings?.technician ?? 0,
        treatmentEffect: data.criteriaRatings?.treatmentEffect ?? 0,
        waitingTime: data.criteriaRatings?.waitingTime ?? 0,
        facility: data.criteriaRatings?.facility ?? 0,
      },
      comment: data.comment || '',
      images: data.images || [],
      status: 'published',
      isPublic: data.isPublic !== false,
      adminReply: null,
    };

    feedbacks.unshift(newFeedback);
    this.save(feedbacks);
    return newFeedback;
  },

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

  getStats(feedbackList = null) {
    const list = feedbackList || this.getAll().filter(f => f.status === 'published');
    if (!list.length) {
      return { avg: 0, total: 0, distribution: { 1:0, 2:0, 3:0, 4:0, 5:0 }, criteria: {} };
    }
    const total = list.length;
    const avg   = list.reduce((s, f) => s + f.overallRating, 0) / total;

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
