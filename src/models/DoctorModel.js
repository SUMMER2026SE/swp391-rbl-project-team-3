import { createClient } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

const anonSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_ANON_KEY, 
  { auth: { persistSession: false, autoRefreshToken: false } }
);

let cachedDoctors = [];

function normalizeDoctor(user) {
  const emp = user.employee_profiles ? (Array.isArray(user.employee_profiles) ? user.employee_profiles[0] : user.employee_profiles) : {};
  const doc = emp.doctor_profiles ? (Array.isArray(emp.doctor_profiles) ? emp.doctor_profiles[0] : emp.doctor_profiles) : {};
  
  let specialties = [];
  if (emp?.specialization) {
     specialties = emp.specialization.split(',')?.map?.(s => s.trim());
  } else {
     const allCats = ['cat-01', 'cat-02', 'cat-03', 'cat-04', 'cat-05', 'cat-06', 'cat-07'];
     let hash = 0;
     for (let i = 0; i < user.user_id.length; i++) hash += user.user_id.charCodeAt(i);
     specialties = [allCats[hash % 7], allCats[(hash + 3) % 7], allCats[(hash + 5) % 7]];
     specialties.push('cat-01');
     specialties = Array.from(new Set(specialties));
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
    reviewsCount: doc?.reviews_count || 0
  };
}

export const DoctorModel = {
  async getAllDoctors() {
    try {
      const { data, error } = await anonSupabase
        .from('users')
        .select(`
          user_id,
          full_name,
          avatar_url,
          employee_profiles (experience_years, specialization, work_schedule, doctor_profiles (description, consultation_fee, rating, reviews_count))
        `)
        .eq('role_id', 2)
        .eq('status', 'ACTIVE');
      
      if (error) throw error;
      cachedDoctors = (data || []).map(normalizeDoctor);
      return cachedDoctors;
    } catch (e) {
      console.warn('Supabase fetch error (doctors):', e.message);
      return cachedDoctors;
    }
  },

  getAllDoctorsSync() {
    return cachedDoctors;
  },

  async getDoctorById(id) {
    try {
      const { data, error } = await anonSupabase
        .from('users')
        .select(`
          user_id,
          full_name,
          avatar_url,
          employee_profiles (experience_years, specialization, work_schedule, doctor_profiles (description, consultation_fee, rating, reviews_count))
        `)
        .eq('role_id', 2)
        .eq('user_id', id)
        .single();
      
      if (error) throw error;
      return normalizeDoctor(data);
    } catch (e) {
      console.warn('Supabase fetch error (doctor by id):', e.message);
      return null;
    }
  },

  async updateDoctorRating(id, ratingScore) {
    try {
      // Note: A true rating system would aggregate from reviews, 
      // but keeping this simple structure based on the previous model's signature.
      const doctor = await this.getDoctorById(id);
      if (!doctor) return null;

      const prevCount = doctor.reviews_count || 0;
      const prevRating = doctor.rating || 0;
      const newCount = prevCount + 1;
      const newRating = Math.round(((prevRating * prevCount + ratingScore) / newCount) * 10) / 10;

      const { data, error } = await supabase
        .from('doctor_profiles')
        .update({ rating: newRating, reviews_count: newCount })
        .eq('doctor_id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (e) {
      console.warn('Supabase update error (doctor rating):', e.message);
      return null;
    }
  }
};
