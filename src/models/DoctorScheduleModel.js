import { supabase } from '../supabaseClient';

export const DoctorScheduleModel = {
  /**
   * Lấy tất cả ca làm việc
   */
  async getAllShifts() {
    try {
      const { data, error } = await supabase
        .from('doctor_shifts')
        .select('*')
        .order('work_date', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (getAllShifts):', e.message);
      return [];
    }
  },

  /**
   * Lấy ca làm việc theo bác sĩ
   */
  async getShiftsByDoctor(doctorId) {
    try {
      const { data, error } = await supabase
        .from('doctor_shifts')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('work_date', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (getShiftsByDoctor):', e.message);
      return [];
    }
  },

  /**
   * Tạo ca làm việc mới
   */
  async createShift(shiftData) {
    try {
      const { data, error } = await supabase
        .from('doctor_shifts')
        .insert(shiftData)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase insert error (createShift):', e.message);
      throw e;
    }
  },

  /**
   * Cập nhật ca làm việc
   */
  async updateShift(id, updates) {
    try {
      const { data, error } = await supabase
        .from('doctor_shifts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase update error (updateShift):', e.message);
      throw e;
    }
  },

  /**
   * Lấy lịch theo ngày cụ thể (dành cho Patient booking)
   */
  async getShiftsByDate(doctorId, date) {
    try {
      const { data, error } = await supabase
        .from('doctor_shifts')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('work_date', date)
        .eq('status', 'Đã phân công');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (getShiftsByDate):', e.message);
      return [];
    }
  }
};
