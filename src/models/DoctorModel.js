import { doctors as initialMockDoctors } from '../mockData';
import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'dermasmart_doctors';

export const DoctorModel = {
  init() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockDoctors));
    }
    // Asynchronously sync with Supabase to keep localStorage updated
    this.syncWithSupabase();
  },

  async syncWithSupabase() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          user_id, full_name, avatar_url,
          employee_profiles ( experience_years, specialization, work_schedule ),
          doctor_profiles ( description, consultation_fee, rating, reviews_count )
        `)
        .eq('role_id', 2)
        .eq('status', 'ACTIVE');

      if (error) throw error;

      if (data && data.length > 0) {
        const normalizedDoctors = data.map(user => {
          const emp = user.employee_profiles ? (Array.isArray(user.employee_profiles) ? user.employee_profiles[0] : user.employee_profiles) : {};
          const doc = user.doctor_profiles ? (Array.isArray(user.doctor_profiles) ? user.doctor_profiles[0] : user.doctor_profiles) : {};
          
          let specialties = [];
          if (emp?.specialization) {
             specialties = emp.specialization.split(',').map(s => s.trim());
          }

          let schedule = [];
          if (emp?.work_schedule) {
              try {
                  schedule = typeof emp.work_schedule === 'string' ? JSON.parse(emp.work_schedule) : emp.work_schedule;
              } catch (e) {
                  // ignore
              }
          }

          return {
            id: user.user_id,
            name: user.full_name || 'Bác sĩ',
            title: 'Bác sĩ Da liễu',
            image: user.avatar_url || 'https://i.pravatar.cc/150?u=' + user.user_id,
            experience: emp?.experience_years ? `${emp.experience_years} năm kinh nghiệm` : 'Chưa cập nhật',
            specialties: specialties,
            bio: doc?.description || 'Chưa có thông tin giới thiệu.',
            consultationFee: doc?.consultation_fee ? `${doc.consultation_fee.toLocaleString()} VNĐ` : '300,000 VNĐ',
            rating: doc?.rating || 5.0,
            reviewsCount: doc?.reviews_count || 0,
            schedule: schedule.length > 0 ? schedule : [
              { day: "Thứ Hai", hours: "08:00 - 17:00" },
              { day: "Thứ Tư", hours: "08:00 - 17:00" },
              { day: "Thứ Sáu", hours: "08:00 - 17:00" }
            ]
          };
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedDoctors));
        window.dispatchEvent(new CustomEvent('doctors-updated'));
      }
    } catch (e) {
      console.warn("Could not sync doctors with Supabase, using existing cache.", e);
    }
  },

  getAllDoctors() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return initialMockDoctors;
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
