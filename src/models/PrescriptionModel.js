import { supabase } from '../supabaseClient';

export const PrescriptionModel = {
  // Type-ahead over the `medicines` catalogue. Case-insensitive match on the
  // drug name; returns up to 8 rows (name + description) for the prescription
  // pad's autocomplete dropdown.
  async searchMedicines(query) {
    const clean = (query || '').trim();
    if (!clean) return [];
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('medicine_id, medicine_name, description, active_ingredient, unit')
        .ilike('medicine_name', `%${clean}%`)
        .order('medicine_name', { ascending: true })
        .limit(8);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase search error (medicines):', e.message);
      return [];
    }
  },

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
  },

  // prescription_details.medicine_id is a NOT NULL FK → medicines. The doctor
  // types a free-text drug name, so we find-or-create the medicine row and
  // return its id. Case-insensitive match on medicine_name.
  async resolveMedicineId(name) {
    const clean = (name || '').trim();
    if (!clean) return null;
    try {
      const { data: existing } = await supabase
        .from('medicines')
        .select('medicine_id')
        .ilike('medicine_name', clean)
        .limit(1)
        .maybeSingle();
      if (existing?.medicine_id) return existing.medicine_id;

      const { data: created, error } = await supabase
        .from('medicines')
        .insert([{ medicine_name: clean }])
        .select('medicine_id')
        .single();
      if (error) throw error;
      return created?.medicine_id ?? null;
    } catch (e) {
      console.error('Supabase resolveMedicineId error:', e.message);
      return null;
    }
  },

  // High-level EMR write: persist a full prescription (header + detail rows) for
  // a saved medical record. Resolves each medicine name to a medicine_id first
  // (NOT NULL FK). Returns the created header, or null on failure.
  async savePrescriptionForRecord({ record_id, doctor_id, patient_id, note, medications = [] }) {
    const items = (Array.isArray(medications) ? medications : []).filter(
      (m) => m && (m.name || '').trim()
    );
    if (!record_id) return null;

    const header = await this.createPrescription({
      record_id,
      doctor_id: doctor_id || null,
      patient_id: patient_id || null,
      note: note || null,
    });
    if (!header?.prescription_id) return null;
    if (items.length === 0) return header;

    const details = [];
    for (const med of items) {
      const medicine_id = await this.resolveMedicineId(med.name);
      if (!medicine_id) continue; // skip rows we cannot link (FK is NOT NULL)
      details.push({
        prescription_id: header.prescription_id,
        medicine_id,
        dosage: med.dosage || null,
        frequency: med.frequency || null,
        duration: med.duration || null,
        instruction: med.instructions || med.instruction || null,
        quantity: Number.isFinite(Number(med.quantity)) ? Number(med.quantity) : null,
      });
    }
    if (details.length > 0) {
      await this.addPrescriptionDetails(details);
    }
    return header;
  }
};
