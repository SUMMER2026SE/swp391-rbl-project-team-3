import { supabase } from '../supabaseClient';

// ── Mapping layer ────────────────────────────────────────────────────────────
// The admin UI works in camelCase; the `vouchers` table is snake_case. These two
// helpers translate between the shapes so creates/updates actually persist and
// reads expose the camelCase keys the UI expects. `validFrom`/`validTo` map onto
// the pre-existing `start_date`/`end_date` columns.

const toNum = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const toDateOrNull = (v) => (v === '' || v === null || v === undefined ? null : v);

function mapVoucherToDB(form = {}) {
  const row = {};
  if ('code' in form) row.code = form.code ?? null;
  if ('name' in form) row.name = form.name ?? null;
  if ('description' in form) row.description = form.description ?? null;
  if ('discountType' in form) row.discount_type = form.discountType ?? null;
  if ('discountValue' in form) row.discount_value = toNum(form.discountValue);
  if ('maxDiscountAmount' in form) row.max_discount_amount = toNum(form.maxDiscountAmount);
  if ('minOrderAmount' in form) row.min_order_amount = toNum(form.minOrderAmount);
  if ('validFrom' in form) row.start_date = toDateOrNull(form.validFrom);
  if ('validTo' in form) row.end_date = toDateOrNull(form.validTo);
  if ('applicableServices' in form)
    row.applicable_services = Array.isArray(form.applicableServices) ? form.applicableServices : [];
  if ('maxUsage' in form) row.max_usage = toNum(form.maxUsage);
  if ('perUserLimit' in form) row.per_user_limit = toNum(form.perUserLimit);
  if ('eventTag' in form) row.event_tag = form.eventTag ?? null;
  // status: accept an explicit status OR the toggle's `isActive` boolean.
  if ('status' in form) row.status = form.status;
  if ('isActive' in form) row.status = form.isActive ? 'ACTIVE' : 'INACTIVE';
  return row;
}

function mapVoucherFromDB(row) {
  if (!row) return row;
  return {
    ...row, // keep raw snake_case keys so any snake_case reader still works
    id: row.id ?? row.voucher_id,
    code: row.code,
    name: row.name,
    description: row.description,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    maxDiscountAmount: row.max_discount_amount,
    minOrderAmount: row.min_order_amount,
    validFrom: row.start_date,
    validTo: row.end_date,
    applicableServices: row.applicable_services ?? [],
    maxUsage: row.max_usage,
    perUserLimit: row.per_user_limit,
    eventTag: row.event_tag,
    usageCount: row.usageCount ?? 0,
    isActive: row.status === 'ACTIVE' || row.status === 'Hoạt động',
  };
}

export const VoucherModel = {
  async getAll() {
    return this.getAllVouchers();
  },

  async getAllVouchers() {
    try {
      const { data, error } = await supabase.from('vouchers').select('*');
      if (error) throw error;
      return (data || []).map(mapVoucherFromDB);
    } catch (e) {
      console.warn('Supabase fetch error (vouchers):', e.message);
      return [];
    }
  },

  async getVoucherById(id) {
    try {
      const { data, error } = await supabase.from('vouchers').select('*').eq('id', id).single();
      if (error) throw error;
      return mapVoucherFromDB(data);
    } catch (e) {
      console.warn('Supabase fetch error (voucher by id):', e.message);
      return null;
    }
  },

  async getAllServices() {
    try {
      const { data, error } = await supabase.from('services').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase fetch error (services):', e.message);
      return [];
    }
  },

  async createVoucher(voucherData) {
    // Throw on failure so the controller's try/catch surfaces the real error
    // (previously this swallowed errors and returned null → false "success").
    const row = mapVoucherToDB(voucherData);
    const { data, error } = await supabase.from('vouchers').insert([row]).select();
    if (error) throw error;
    let created = data[0];
    // `vouchers.id` has no default; mirror voucher_id into it so the UI's
    // id-based update/delete/getById keep working for newly created rows.
    if (created && (created.id === null || created.id === undefined)) {
      const { data: fixed } = await supabase
        .from('vouchers')
        .update({ id: created.voucher_id })
        .eq('voucher_id', created.voucher_id)
        .select();
      if (fixed && fixed[0]) created = fixed[0];
    }
    return mapVoucherFromDB(created);
  },

  async updateVoucher(id, updates) {
    const row = mapVoucherToDB(updates);
    const { data, error } = await supabase.from('vouchers').update(row).eq('id', id).select();
    if (error) throw error;
    return mapVoucherFromDB(data[0]);
  },

  async deleteVoucher(id) {
    const { error } = await supabase.from('vouchers').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async incrementUsage(id) {
    try {
      const { data: voucher, error: fetchError } = await supabase
        .from('vouchers')
        .select('usageCount')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;
      const newCount = (voucher?.usageCount || 0) + 1;
      const { data, error } = await supabase
        .from('vouchers')
        .update({ usageCount: newCount })
        .eq('id', id)
        .select();
      if (error) throw error;
      return mapVoucherFromDB(data[0]);
    } catch (e) {
      console.warn('Supabase update error (incrementUsage):', e.message);
      return null;
    }
  },
};
