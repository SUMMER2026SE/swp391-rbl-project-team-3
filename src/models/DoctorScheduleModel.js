import { supabase } from '../supabaseClient';

// Shift statuses that represent a REAL, bookable working shift. An assigned shift
// ('Đã phân công') and a doctor-confirmed shift ('Đã xác nhận') are both active;
// only revoked/cancelled shifts should ever be excluded from availability lookups.
export const ACTIVE_SHIFT_STATUSES = ['Đã phân công', 'Đã xác nhận'];

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
   * Tạo nhiều ca làm việc cùng lúc
   */
  async createShifts(shiftsData) {
    try {
      const { data, error } = await supabase
        .from('doctor_shifts')
        .insert(shiftsData)
        .select();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase insert error (createShifts):', e.message);
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
   * Xóa / Thu hồi ca làm việc
   */
  async deleteShift(id) {
    try {
      const { error } = await supabase
        .from('doctor_shifts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase delete error (deleteShift):', e.message);
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
        .in('status', ACTIVE_SHIFT_STATUSES);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (getShiftsByDate):', e.message);
      return [];
    }
  }
};
