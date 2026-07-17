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
  const technicianId = fb.technicianId ?? fb.technician_id;
  const appointmentId = fb.appointmentId ?? fb.appointment_id;
  const rating = fb.overallRating ?? fb.rating;
  const technicianRating = fb.technicianRating ?? fb.technician_rating;

  if (patientId !== undefined) row.patient_id = patientId;
  if (doctorId !== undefined) row.doctor_id = doctorId ?? null;
  if (technicianId !== undefined) row.technician_id = technicianId ?? null;
  if (appointmentId !== undefined) row.appointment_id = toNum(appointmentId);
  if (rating !== undefined) row.rating = toNum(rating);
  if (technicianRating !== undefined) row.technician_rating = toNum(technicianRating);
  if (fb.comment !== undefined) row.comment = fb.comment; // Kept for backward compatibility if needed
  
  // Merge status, adminReply, and isAnonymous into criteria_ratings if present
  let criteriaRatings = fb.criteriaRatings || {};
  let changed = false;
  if (fb.status !== undefined) {
    criteriaRatings = { ...criteriaRatings, status: fb.status };
    changed = true;
  }
  if (fb.adminReply !== undefined) {
    criteriaRatings = { ...criteriaRatings, adminReply: fb.adminReply?.text || fb.adminReply };
    changed = true;
  }
  if (fb.isAnonymous !== undefined) {
    criteriaRatings = { ...criteriaRatings, isAnonymous: fb.isAnonymous };
    changed = true;
  }
  if (fb.criteriaRatings !== undefined || changed) row.criteria_ratings = criteriaRatings;

  if (fb.doctorComment !== undefined) row.doctor_comment = fb.doctorComment;
  if (fb.isDoctorPublic !== undefined) row.is_doctor_public = fb.isDoctorPublic;
  if (fb.technicianComment !== undefined) row.technician_comment = fb.technicianComment;
  if (fb.isTechnicianPublic !== undefined) row.is_technician_public = fb.isTechnicianPublic;
  return row;
}

function mapFeedbackFromDB(row) {
  if (!row) return row;

  // ── Backward-compatible fallback ──
  // If the new columns are empty but the old `comment` column has JSON data,
  // extract the values so all consumers receive them transparently.
  let doctorComment = row.doctor_comment;
  let isDoctorPublic = row.is_doctor_public;
  let technicianComment = row.technician_comment;
  let isTechnicianPublic = row.is_technician_public;

  if (!doctorComment && !technicianComment && row.comment) {
    try {
      const c = row.comment;
      if (typeof c === 'string' && (c.startsWith('{') || c.startsWith('['))) {
        const parsed = JSON.parse(c);
        doctorComment = parsed.doctorComment || null;
        isDoctorPublic = parsed.doctorPublic ?? true;
        technicianComment = parsed.techComment || null;
        isTechnicianPublic = parsed.techPublic ?? true;
      }
    } catch (e) { /* not JSON, ignore */ }
  }

  return {
    ...row, // keep raw snake_case keys + the embedded patient(patient_profiles)
    id: row.feedback_id ?? row.id,
    patientId: row.patient_id,
    patientName: row.patient?.full_name || row.patient?.name || null,
    isAnonymous: row.criteria_ratings?.isAnonymous ?? false,
    doctorId: row.doctor_id || row.appointment?.doctor_id,
    technicianId: row.technician_id,
    appointmentId: row.appointment_id,
    overallRating: row.rating,
    technicianRating: row.technician_rating,
    comment: row.comment,
    doctorComment,
    isDoctorPublic: isDoctorPublic ?? true,
    technicianComment,
    isTechnicianPublic: isTechnicianPublic ?? true,
    createdAt: row.created_at,
    status: row.status || row.criteria_ratings?.status || 'published',
    criteriaRatings: row.criteria_ratings ?? {},
    adminReply: row.criteria_ratings?.adminReply ? { text: row.criteria_ratings.adminReply } : null,
  };
}

async function attachUserNames(feedbacksOrSingle) {
  const isArray = Array.isArray(feedbacksOrSingle);
  const feedbacks = isArray ? feedbacksOrSingle : [feedbacksOrSingle].filter(Boolean);
  if (feedbacks.length === 0) return feedbacksOrSingle;

  const userIds = [...new Set(feedbacks.flatMap(f => [f.patientId, f.doctorId, f.technicianId]).filter(Boolean))];
  let userMap = {};
  if (userIds.length > 0) {
    const { data: usersData } = await supabase.from('users').select('user_id, full_name').in('user_id', userIds);
    if (usersData) {
      usersData.forEach(u => {
        userMap[u.user_id] = u.full_name;
      });
    }
  }

  feedbacks.forEach(fb => {
    fb.patientName = userMap[fb.patientId] || fb.patientName || 'Bệnh nhân';
    fb.doctorName = userMap[fb.doctorId] || fb.doctorName || null;
    fb.technicianName = userMap[fb.technicianId] || fb.technicianName || null;
  });

  return isArray ? feedbacks : feedbacks[0];
}

export const FeedbackModel = {
  async getAll() {
    try {
      const { data, error } = await supabase.from('feedbacks').select('*');
      if (error) throw error;
      const list = (data || []).map(mapFeedbackFromDB);
      return await attachUserNames(list);
    } catch (e) {
      console.warn('Supabase fetch error (feedbacks):', e.message);
      return [];
    }
  },

  async getRecent() {
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      const list = (data || []).map(mapFeedbackFromDB);
      return await attachUserNames(list);
    } catch (e) {
      console.warn('Supabase fetch error (recent feedbacks):', e.message);
      return [];
    }
  },

  async create(feedbackData) {
    const row = mapFeedbackToDB(feedbackData);
    const { data, error } = await supabase.from('feedbacks').insert([row]).select();
    if (error) throw error;
    const fb = mapFeedbackFromDB(data[0]);
    return await attachUserNames(fb);
  },

  async update(id, feedbackData) {
    const row = mapFeedbackToDB(feedbackData);
    delete row.feedback_id;
    delete row.id;
    delete row.patient_id;
    
    const { data, error } = await supabase
      .from('feedbacks')
      .update(row)
      .eq('feedback_id', id)
      .select();
    if (error) throw error;
    const fb = mapFeedbackFromDB(data[0]);
    return await attachUserNames(fb);
  },
};
