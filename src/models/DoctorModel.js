import { doctors } from '../mockData';

const STORAGE_KEY = 'dermasmart_doctors';

export const DoctorModel = {
  init() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doctors));
    }
  },

  getAllDoctors() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return doctors;
    }
  },

  getDoctorById(id) {
    const list = this.getAllDoctors();
    const doctor = list.find(d => d.id === id);
    return doctor || null;
  },

  save(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('doctors-updated'));
  },

  updateDoctorRating(doctorId, ratingScore) {
    this.init();
    const list = this.getAllDoctors();
    const idx = list.findIndex(d => d.id === doctorId);
    if (idx === -1) return;

    const doctor = list[idx];
    const prevCount = doctor.reviewsCount || 0;
    const prevRating = doctor.rating || 0;
    const newCount = prevCount + 1;
    const newRating = Math.round(((prevRating * prevCount + ratingScore) / newCount) * 10) / 10;

    list[idx] = {
      ...doctor,
      rating: newRating,
      reviewsCount: newCount
    };
    this.save(list);
  }
};
