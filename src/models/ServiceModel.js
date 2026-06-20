import { supabase } from '../supabaseClient';

// The `services` table stores a canonical English status ('ACTIVE'/'INACTIVE'),
// but the Admin UI is built around the Vietnamese labels. Map both ways so the
// visual design is unchanged while the DB stays clean.
const STATUS_TO_DB = { 'Hoạt động': 'ACTIVE', 'Tạm ẩn': 'INACTIVE' };
const statusFromDb = (s) => (s === 'INACTIVE' || s === 'Tạm ẩn' ? 'Tạm ẩn' : 'Hoạt động');

// `services.duration_minutes` is NOT NULL but the Admin form doesn't expose it;
// default to a sensible 30-minute service so inserts never fail.
const DEFAULT_DURATION = 30;

function mapRow(r) {
  return {
    id: r.service_id,
    name: r.service_name ?? '',
    price: Number(r.price ?? 0),
    duration: r.duration_minutes ?? DEFAULT_DURATION,
    description: r.description ?? '',
    status: statusFromDb(r.status),
  };
}

export const ServiceModel = {
  async getAll() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('service_id', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRow);
  },

  async create({ name, price, description, status, duration }) {
    const { data, error } = await supabase
      .from('services')
      .insert([{
        service_name: name,
        price: Number(price) || 0,
        duration_minutes: Number(duration) || DEFAULT_DURATION,
        description: description || '',
        status: STATUS_TO_DB[status] || 'ACTIVE',
      }])
      .select();
    if (error) throw error;
    return mapRow(data[0]);
  },

  async update(id, fields) {
    const payload = {};
    if (fields.name !== undefined) payload.service_name = fields.name;
    if (fields.price !== undefined) payload.price = Number(fields.price) || 0;
    if (fields.description !== undefined) payload.description = fields.description;
    if (fields.duration !== undefined) payload.duration_minutes = Number(fields.duration) || DEFAULT_DURATION;
    if (fields.status !== undefined) payload.status = STATUS_TO_DB[fields.status] || 'ACTIVE';
    const { data, error } = await supabase
      .from('services')
      .update(payload)
      .eq('service_id', id)
      .select();
    if (error) throw error;
    return mapRow(data[0]);
  },

  async remove(id) {
    const { error } = await supabase.from('services').delete().eq('service_id', id);
    if (error) throw error;
    return true;
  },
};
