import { supabase } from '../supabaseClient';

export const FeedbackModel = {
  async getAll() {
    try {
      const { data, error } = await supabase.from('feedbacks').select('*, patient:patient_profiles(*)');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (feedbacks):', e.message);
      return [];
    }
  },

  async getRecent() {
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*, patient:patient_profiles(*)')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (recent feedbacks):', e.message);
      return [];
    }
  },

  async create(feedbackData) {
    try {
      const { data, error } = await supabase.from('feedbacks').insert([feedbackData]).select();
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.warn('Supabase create error (feedbacks):', e.message);
      return null;
    }
  }
};
