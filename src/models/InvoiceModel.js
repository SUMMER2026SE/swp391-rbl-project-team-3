import { supabase } from '../supabaseClient';

export const InvoiceModel = {
  async getByAppointmentId(appointmentId) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('appointment_id', appointmentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase fetch error (invoices):', e.message);
      return null;
    }
  },

  async getUnpaidInvoices() {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, appointment:appointments(patient_id, patient_profiles(full_name))')
        .eq('status', 'UNPAID')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (unpaid invoices):', e.message);
      return [];
    }
  },

  async create(invoiceData) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select();
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.warn('Supabase create error (invoices):', e.message);
      return null;
    }
  },

  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.warn('Supabase update error (invoices):', e.message);
      return null;
    }
  }
};
