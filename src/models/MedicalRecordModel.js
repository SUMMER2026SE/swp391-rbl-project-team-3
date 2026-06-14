import { supabase } from '../supabaseClient';

export const MedicalRecordModel = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*, patient:patient_profiles(*), doctor:doctor_profiles(*)');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (medical_records):', e.message);
      return [];
    }
  },

  async getByPatientId(patientId) {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*, doctor:doctor_profiles(*)')
        .eq('patient_id', patientId);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (medical_records by patient):', e.message);
      return [];
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*, patient:patient_profiles(*), doctor:doctor_profiles(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase fetch error (medical_record by id):', e.message);
      return null;
    }
  },

  async create(recordData) {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .insert([recordData])
        .select();
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.warn('Supabase create error (medical_records):', e.message);
      return null;
    }
  }
};
