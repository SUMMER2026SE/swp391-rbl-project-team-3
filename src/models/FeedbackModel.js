import { supabase } from '../supabaseClient';

// ── Mapping layer ────────────────────────────────────────────────────────────
// The feedback UI works in camelCase (overallRating, criteriaRatings, patientId,
// doctorId, appointmentId); the `feedbacks` table is snake_case with a single
// `rating` column. These helpers translate both directions so inserts actually
// persist (instead of failing on unknown columns) and reads expose the camelCase
// keys every consumer (getStats / applyFilter / FeedbackCard / dashboards) uses.

const toNum = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function mapFeedbackToDB(fb = {}) {
  const row = {};
  const patientId = fb.patientId ?? fb.patient_id;
  const doctorId = fb.doctorId ?? fb.doctor_id;
  const appointmentId = fb.appointmentId ?? fb.appointment_id;
  const rating = fb.overallRating ?? fb.rating;

  if (patientId !== undefined) row.patient_id = patientId;
  if (doctorId !== undefined) row.doctor_id = doctorId ?? null;
  if (appointmentId !== undefined) row.appointment_id = toNum(appointmentId);
  if (rating !== undefined) row.rating = toNum(rating);
  if (fb.comment !== undefined) row.comment = fb.comment;
  // NOTE: criteriaRatings / isPublic / images / patientName etc. are intentionally
  // dropped — the table has no columns for them. Add a `criteria_ratings jsonb`
  // column if per-criterion scores need to persist.
  return row;
}

function mapFeedbackFromDB(row) {
  if (!row) return row;
  return {
    ...row, // keep raw snake_case keys + the embedded patient(patient_profiles)
    id: row.feedback_id ?? row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    appointmentId: row.appointment_id,
    overallRating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    // Per-criterion ratings aren't stored yet; default to {} so readers that do
    // `fb.criteriaRatings?.[key]` stay safe.
    criteriaRatings: row.criteria_ratings ?? {},
  };
}

export const FeedbackModel = {
  async getAll() {
    try {
      const { data, error } = await supabase.from('feedbacks').select('*, patient:patient_profiles(*)');
      if (error) throw error;
      return (data || []).map(mapFeedbackFromDB);
    } catch (e) {
      console.warn('Supabase fetch error (feedbacks):', e.message);
      return [];
    }
  },

  async getRecent() {
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*, patient:patient_profiles(*)')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []).map(mapFeedbackFromDB);
    } catch (e) {
      console.warn('Supabase fetch error (recent feedbacks):', e.message);
      return [];
    }
  },

  async create(feedbackData) {
    // Throw on failure so the controller's try/catch surfaces the real error
    // (previously this swallowed errors and returned null → false "success").
    const row = mapFeedbackToDB(feedbackData);
    const { data, error } = await supabase.from('feedbacks').insert([row]).select();
    if (error) throw error;
    return mapFeedbackFromDB(data[0]);
  },
};
