import { supabase } from '../supabaseClient';

export const ServiceTicketModel = {
  async getByAppointmentId(appointmentId) {
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (service_tickets):', e.message);
      return [];
    }
  },

  async getPendingTickets() {
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .select('*, appointment:appointments(patient_id, patient_profiles(full_name))')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (pending service_tickets):', e.message);
      return [];
    }
  },

  async create(ticketData) {
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .insert([ticketData])
        .select();
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.warn('Supabase create error (service_tickets):', e.message);
      return null;
    }
  },

  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.warn('Supabase update error (service_tickets):', e.message);
      return null;
    }
  }
};
