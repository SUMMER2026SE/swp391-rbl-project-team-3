import { supabase } from '../supabaseClient';

export const SystemLogModel = {
  async getAll() {
    try {
      const { data, error } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (system_logs):', e.message);
      return [];
    }
  },

  async log(action, user, details) {
    try {
      const { data, error } = await supabase.from('system_logs').insert([{
        action,
        user_id: user?.id || 'system',
        user_name: user?.name || 'System',
        details
      }]).select();
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.warn('Supabase create error (system_logs):', e.message);
      return null;
    }
  }
};
