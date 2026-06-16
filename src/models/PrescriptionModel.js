import { supabase } from '../supabaseClient';

export const PrescriptionModel = {
  // Fetch prescription header along with its details and medicine info
  async getByRecordId(recordId) {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_details (
            *,
            medicine:medicines (medicine_name)
          )
        `)
        .eq('record_id', recordId)
        .maybeSingle();
        
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase fetch error (prescriptions):', e.message);
      return null;
    }
  },

  // Create a new prescription header
  async createPrescription(prescriptionData) {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .insert([prescriptionData])
        .select();
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.warn('Supabase create error (prescriptions):', e.message);
      return null;
    }
  },

  // Add items to a prescription
  async addPrescriptionDetails(detailsArray) {
    try {
      const { data, error } = await supabase
        .from('prescription_details')
        .insert(detailsArray)
        .select();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase create error (prescription_details):', e.message);
      return null;
    }
  }
};
