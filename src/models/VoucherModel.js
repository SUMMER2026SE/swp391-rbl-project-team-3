import { supabase } from '../supabaseClient';

export const VoucherModel = {
  async getAllVouchers() {
    try {
      const { data, error } = await supabase.from('vouchers').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (vouchers):', e.message);
      return [];
    }
  },

  async getVoucherById(id) {
    try {
      const { data, error } = await supabase.from('vouchers').eq('id', id).single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase fetch error (voucher by id):', e.message);
      return null;
    }
  },

  async getAllServices() {
    try {
      const { data, error } = await supabase.from('services').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (services):', e.message);
      return [];
    }
  },

  async createVoucher(voucherData) {
    try {
      const { data, error } = await supabase.from('vouchers').insert([voucherData]).select();
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.warn('Supabase create error (vouchers):', e.message);
      return null;
    }
  },

  async updateVoucher(id, updates) {
    try {
      const { data, error } = await supabase.from('vouchers').update(updates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.warn('Supabase update error (vouchers):', e.message);
      return null;
    }
  },

  async deleteVoucher(id) {
    try {
      const { error } = await supabase.from('vouchers').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase delete error (vouchers):', e.message);
      return false;
    }
  }
};
