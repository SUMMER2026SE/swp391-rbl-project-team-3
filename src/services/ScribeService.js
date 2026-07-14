import { supabase } from '../supabaseClient';

/**
 * ScribeService — client for the `ambient-scribe` Supabase Edge Function.
 * Sends the consultation transcript to Gemini (server-side, key never exposed)
 * and returns a structured EMR draft the doctor reviews before applying.
 */

/**
 * @param {string} transcript    Raw speech-to-text of the consultation.
 * @param {object} [options]
 * @param {string} [options.patientName]
 * @returns {Promise<{
 *   summary: string,
 *   symptoms: string,
 *   medical_history: string,
 *   assessment: string,
 *   diagnosis_suggestions: Array<{name: string, icd10_hint: string}>,
 *   treatment_direction: string,
 *   medication_suggestions: Array<{name: string, dosage: string, frequency: string, instructions: string}>,
 *   follow_up: string,
 * }>}
 */
export async function analyzeConsultation(transcript, { patientName } = {}) {
  const { data, error } = await supabase.functions.invoke('ambient-scribe', {
    body: { transcript, patientName },
  });

  if (error) {
    console.error('ScribeService.analyzeConsultation failed:', error);
    throw new Error('Không thể kết nối trợ lý AI, vui lòng thử lại.');
  }
  if (!data?.draft) {
    throw new Error(data?.error || 'AI không trả về kết quả hợp lệ.');
  }

  const d = data.draft;
  // Normalize so the UI never has to null-check.
  return {
    summary: d.summary || '',
    symptoms: d.symptoms || '',
    medical_history: d.medical_history || '',
    assessment: d.assessment || '',
    diagnosis_suggestions: Array.isArray(d.diagnosis_suggestions) ? d.diagnosis_suggestions : [],
    treatment_direction: d.treatment_direction || '',
    medication_suggestions: Array.isArray(d.medication_suggestions) ? d.medication_suggestions : [],
    follow_up: d.follow_up || '',
  };
}

export default { analyzeConsultation };
