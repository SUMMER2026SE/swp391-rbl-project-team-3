import { supabase } from '../supabaseClient';

let cachedDoctors = [];

export const DoctorModel = {
  async getAllDoctors() {
    try {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('*, user:users(*)');
      
      if (error) throw error;
      cachedDoctors = data || [];
      return data || [];
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
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('*, user:users(*)')
        .eq('user_id', id)
        .single();
      
      if (error) throw error;
      return data;
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
        .eq('user_id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (e) {
      console.warn('Supabase update error (doctor rating):', e.message);
      return null;
    }
  }
};
