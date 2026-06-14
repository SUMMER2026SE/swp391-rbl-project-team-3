import { supabase } from '../supabaseClient';

export const ChatModel = {
  async getAllMessages() {
    try {
      const { data, error } = await supabase.from('doctor_chats').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (doctor_chats):', e.message);
      return [];
    }
  },

  async getMessagesBetween(pId, dId) {
    try {
      const { data, error } = await supabase
        .from('doctor_chats')
        .select('*')
        .or(`and(sender_id.eq.${pId},receiver_id.eq.${dId}),and(sender_id.eq.${dId},receiver_id.eq.${pId})`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (doctor_chats between):', e.message);
      return [];
    }
  },

  async addMessage(msgData) {
    try {
      const { data, error } = await supabase.from('doctor_chats').insert([msgData]).select();
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.warn('Supabase create error (doctor_chats):', e.message);
      return null;
    }
  }
};

export const ReceptionistChatModel = {
  async getAllMessages() {
    try {
      const { data, error } = await supabase.from('receptionist_chats').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (receptionist_chats):', e.message);
      return [];
    }
  },

  async getMessagesForPatient(patientId) {
    try {
      const { data, error } = await supabase
        .from('receptionist_chats')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (receptionist_chats for patient):', e.message);
      return [];
    }
  },

  async addMessage(msgData) {
    try {
      const { data, error } = await supabase.from('receptionist_chats').insert([msgData]).select();
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.warn('Supabase create error (receptionist_chats):', e.message);
      return null;
    }
  }
};
