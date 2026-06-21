import { supabase } from '../supabaseClient';

// consultation_slots.status is canonical English; the Admin UI uses Vietnamese.
const STATUS_TO_DB = { 'Trống': 'AVAILABLE', 'Đã đặt': 'BOOKED', 'Đã hủy': 'CANCELLED' };
const statusFromDb = (s) =>
  s === 'BOOKED' || s === 'Đã đặt' ? 'Đã đặt'
    : s === 'CANCELLED' || s === 'Đã hủy' ? 'Đã hủy'
      : 'Trống';

const toDate = (v) => (typeof v === 'string' ? v.slice(0, 10) : new Date(v).toISOString().slice(0, 10));
const toHHMM = (v) => String(v || '').slice(0, 5);

function mapRow(r) {
  return {
    id: r.slot_id,
    doctorId: r.doctor_id,
    scheduleId: r.schedule_id,
    date: toDate(r.slot_date),
    startTime: toHHMM(r.start_time),
    endTime: toHHMM(r.end_time),
    maxPatient: r.max_patient ?? 1,
    status: statusFromDb(r.status),
  };
}

// consultation_slots.schedule_id is NOT NULL and FK→doctor_schedules. A slot must
// hang off one of the doctor's schedule rows. Reuse an existing schedule for that
// doctor+date; if none exists yet, create one so slot creation never dead-ends.
async function resolveScheduleId(doctorId, date, startTime, endTime) {
  const { data: existing, error: selErr } = await supabase
    .from('doctor_schedules')
    .select('schedule_id')
    .eq('doctor_id', doctorId)
    .eq('work_date', date)
    .limit(1);
  if (selErr) throw selErr;
  if (existing && existing.length > 0) return existing[0].schedule_id;

  const { data: created, error: insErr } = await supabase
    .from('doctor_schedules')
    .insert([{
      doctor_id: doctorId,
      work_date: date,
      start_time: startTime,
      end_time: endTime,
      status: 'AVAILABLE',
    }])
    .select();
  if (insErr) throw insErr;
  return created[0].schedule_id;
}

export const ConsultationSlotModel = {
  async getAll() {
    const { data, error } = await supabase
      .from('consultation_slots')
      .select('*')
      .order('slot_id', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRow);
  },

  async create({ doctorId, date, startTime, endTime, status }) {
    if (!doctorId) throw new Error('Vui lòng chọn một bác sĩ hợp lệ.');
    const scheduleId = await resolveScheduleId(doctorId, date, startTime, endTime);
    const { data, error } = await supabase
      .from('consultation_slots')
      .insert([{
        doctor_id: doctorId,
        schedule_id: scheduleId,
        slot_date: date,
        start_time: startTime,
        end_time: endTime,
        max_patient: 1,
        status: STATUS_TO_DB[status] || 'AVAILABLE',
      }])
      .select();
    if (error) throw error;
    return mapRow(data[0]);
  },

  // Commits the whole row. If the doctor or date changed, re-resolve schedule_id
  // so the slot always points at a schedule that belongs to its doctor.
  async update(id, { doctorId, date, startTime, endTime, status }) {
    if (!doctorId) throw new Error('Vui lòng chọn một bác sĩ hợp lệ.');
    const scheduleId = await resolveScheduleId(doctorId, date, startTime, endTime);
    const { data, error } = await supabase
      .from('consultation_slots')
      .update({
        doctor_id: doctorId,
        schedule_id: scheduleId,
        slot_date: date,
        start_time: startTime,
        end_time: endTime,
        status: STATUS_TO_DB[status] || 'AVAILABLE',
      })
      .eq('slot_id', id)
      .select();
    if (error) throw error;
    return mapRow(data[0]);
  },

  async remove(id) {
    const { error } = await supabase.from('consultation_slots').delete().eq('slot_id', id);
    if (error) throw error;
    return true;
  },
};
