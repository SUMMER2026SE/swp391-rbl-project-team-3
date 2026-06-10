import { mockVouchers, mockServices } from '../mockData';

const STORAGE_KEY = 'dermasmart_vouchers';
const VERSION_KEY = 'dermasmart_vouchers_version';
const CURRENT_VERSION = 'v4';

export const VoucherModel = {
  // ── Init / Seed ────────────────────────────────────────────────────────────
  init() {
    const stored = localStorage.getItem(VERSION_KEY);
    if (!localStorage.getItem(STORAGE_KEY) || stored !== CURRENT_VERSION) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockVouchers));
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    }
  },

  // ── Read ───────────────────────────────────────────────────────────────────
  getAll() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return mockVouchers;
    }
  },

  save(vouchers) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vouchers));
    window.dispatchEvent(new CustomEvent('vouchers-updated'));
  },

  getById(id) {
    return this.getAll().find(v => v.id === id) || null;
  },

  getByCode(code) {
    return this.getAll().find(v => v.code.toUpperCase() === code.toUpperCase()) || null;
  },

  // ── Validation ─────────────────────────────────────────────────────────────
  validate(data) {
    const errors = [];

    if (!data.code || data.code.trim().length < 3)
      errors.push('Mã voucher phải có ít nhất 3 ký tự.');

    if (!/^[A-Z0-9_-]+$/i.test(data.code))
      errors.push('Mã voucher chỉ được chứa chữ cái, số, gạch ngang, gạch dưới.');

    if (!data.name || data.name.trim().length < 3)
      errors.push('Tên chương trình khuyến mãi quá ngắn.');

    if (!data.discountType || !['Percentage', 'Fixed'].includes(data.discountType))
      errors.push('Loại giảm giá không hợp lệ.');

    const val = parseFloat(data.discountValue);
    if (isNaN(val) || val <= 0)
      errors.push('Giá trị giảm giá phải lớn hơn 0.');

    if (data.discountType === 'Percentage' && val > 100)
      errors.push('Phần trăm giảm giá không được vượt quá 100%.');

    if (!data.validFrom || !data.validTo)
      errors.push('Vui lòng nhập ngày bắt đầu và kết thúc.');

    if (data.validFrom && data.validTo && data.validFrom > data.validTo)
      errors.push('Ngày bắt đầu phải trước ngày kết thúc.');

    const maxUsage = parseInt(data.maxUsage);
    if (isNaN(maxUsage) || maxUsage < 1)
      errors.push('Giới hạn sử dụng phải ít nhất là 1.');

    return errors;
  },

  // ── Create ─────────────────────────────────────────────────────────────────
  create(data) {
    const errors = this.validate(data);
    if (errors.length) throw new Error(errors.join(' | '));

    // Duplicate code check
    const existing = this.getByCode(data.code);
    if (existing) throw new Error(`Mã voucher "${data.code.toUpperCase()}" đã tồn tại.`);

    const vouchers = this.getAll();
    const newVoucher = {
      id: `VOUCH-${Date.now()}`,
      code: data.code.toUpperCase().trim(),
      name: data.name.trim(),
      description: data.description?.trim() || '',
      discountType: data.discountType,
      discountValue: parseFloat(data.discountValue),
      maxDiscountAmount: parseFloat(data.maxDiscountAmount) || 0,
      minOrderAmount: parseFloat(data.minOrderAmount) || 0,
      validFrom: data.validFrom,
      validTo: data.validTo,
      applicableServices: data.applicableServices || [],
      status: 'Hoạt động',
      usageCount: 0,
      maxUsage: parseInt(data.maxUsage),
      perUserLimit: parseInt(data.perUserLimit) || 1,
      createdAt: new Date().toISOString(),
      createdBy: data.createdBy || 'Admin',
    };

    vouchers.unshift(newVoucher);
    this.save(vouchers);
    return newVoucher;
  },

  // ── Update ─────────────────────────────────────────────────────────────────
  update(id, data) {
    const errors = this.validate(data);
    if (errors.length) throw new Error(errors.join(' | '));

    const vouchers = this.getAll();
    const idx = vouchers.findIndex(v => v.id === id);
    if (idx === -1) throw new Error('Không tìm thấy voucher.');

    // Code uniqueness check (excluding itself)
    const codeConflict = vouchers.find(
      v => v.code.toUpperCase() === data.code.toUpperCase() && v.id !== id
    );
    if (codeConflict) throw new Error(`Mã voucher "${data.code.toUpperCase()}" đã tồn tại.`);

    vouchers[idx] = {
      ...vouchers[idx],
      code: data.code.toUpperCase().trim(),
      name: data.name.trim(),
      description: data.description?.trim() || '',
      discountType: data.discountType,
      discountValue: parseFloat(data.discountValue),
      maxDiscountAmount: parseFloat(data.maxDiscountAmount) || 0,
      minOrderAmount: parseFloat(data.minOrderAmount) || 0,
      validFrom: data.validFrom,
      validTo: data.validTo,
      applicableServices: data.applicableServices || [],
      maxUsage: parseInt(data.maxUsage),
      perUserLimit: parseInt(data.perUserLimit) || 1,
      updatedAt: new Date().toISOString(),
    };

    this.save(vouchers);
    return vouchers[idx];
  },

  // ── Toggle status ──────────────────────────────────────────────────────────
  toggleStatus(id) {
    const vouchers = this.getAll();
    const idx = vouchers.findIndex(v => v.id === id);
    if (idx === -1) throw new Error('Không tìm thấy voucher.');

    const current = vouchers[idx].status;
    const next = current === 'Hoạt động' ? 'Tạm dừng' : 'Hoạt động';
    vouchers[idx] = { ...vouchers[idx], status: next };
    this.save(vouchers);
    return vouchers[idx];
  },

  // ── Delete ─────────────────────────────────────────────────────────────────
  delete(id) {
    const vouchers = this.getAll();
    const idx = vouchers.findIndex(v => v.id === id);
    if (idx === -1) throw new Error('Không tìm thấy voucher.');
    if (vouchers[idx].usageCount > 0)
      throw new Error('Không thể xóa voucher đã được sử dụng. Hãy tạm dừng thay thế.');

    vouchers.splice(idx, 1);
    this.save(vouchers);
  },

  // ── Auto-apply: tìm voucher tốt nhất áp dụng tự động ─────────────────────
  // Trả về danh sách tất cả voucher hợp lệ, sắp xếp giảm giá cao nhất trước
  getAutoApplicable(serviceId, amount, dateStr) {
    const today = dateStr || new Date().toISOString().split('T')[0];
    const all = this.getAll();

    const valid = all.filter(v => {
      if (v.status !== 'Hoạt động') return false;
      if (today < v.validFrom || today > v.validTo) return false;
      if (v.usageCount >= v.maxUsage) return false;
      if (v.minOrderAmount > 0 && amount < v.minOrderAmount) return false;
      if (v.applicableServices.length > 0 && serviceId && !v.applicableServices.includes(serviceId)) return false;
      return true;
    });

    // Tính discount cho mỗi voucher rồi sắp xếp theo discount cao nhất
    return valid.map(v => {
      let discount = 0;
      if (v.discountType === 'Percentage') {
        discount = Math.round((amount * v.discountValue) / 100);
        if (v.maxDiscountAmount > 0) discount = Math.min(discount, v.maxDiscountAmount);
      } else {
        discount = v.discountValue;
      }
      discount = Math.min(discount, amount);
      return { voucher: v, discount, finalAmount: amount - discount };
    }).sort((a, b) => b.discount - a.discount);
  },

  // ── Tăng số lần sử dụng khi booking thành công ────────────────────────────
  incrementUsage(voucherId) {
    const vouchers = this.getAll();
    const idx = vouchers.findIndex(v => v.id === voucherId);
    if (idx === -1) return;
    vouchers[idx] = { ...vouchers[idx], usageCount: (vouchers[idx].usageCount || 0) + 1 };
    this.save(vouchers);
  },

  // ── Apply voucher (bệnh nhân dùng khi đặt lịch) ────────────────────────────
  apply(code, serviceId, amount) {
    const v = this.getByCode(code);
    if (!v) return { valid: false, error: 'Mã voucher không tồn tại.' };
    if (v.status !== 'Hoạt động') return { valid: false, error: 'Voucher không còn hiệu lực.' };

    const today = new Date().toISOString().split('T')[0];
    if (today < v.validFrom) return { valid: false, error: `Voucher chưa đến ngày áp dụng (từ ${v.validFrom}).` };
    if (today > v.validTo)   return { valid: false, error: 'Voucher đã hết hạn sử dụng.' };
    if (v.usageCount >= v.maxUsage) return { valid: false, error: 'Voucher đã hết lượt sử dụng.' };
    if (v.minOrderAmount > 0 && amount < v.minOrderAmount)
      return { valid: false, error: `Đơn hàng tối thiểu ${v.minOrderAmount.toLocaleString('vi-VN')} VNĐ để dùng voucher này.` };
    if (v.applicableServices.length > 0 && serviceId && !v.applicableServices.includes(serviceId))
      return { valid: false, error: 'Voucher không áp dụng cho dịch vụ này.' };

    let discount = 0;
    if (v.discountType === 'Percentage') {
      discount = Math.round((amount * v.discountValue) / 100);
      if (v.maxDiscountAmount > 0) discount = Math.min(discount, v.maxDiscountAmount);
    } else {
      discount = v.discountValue;
    }
    discount = Math.min(discount, amount);

    return { valid: true, discount, finalAmount: amount - discount, voucher: v };
  },

  // ── Stats ──────────────────────────────────────────────────────────────────
  getStats() {
    const all = this.getAll();
    const today = new Date().toISOString().split('T')[0];
    return {
      total: all.length,
      active: all.filter(v => v.status === 'Hoạt động').length,
      paused: all.filter(v => v.status === 'Tạm dừng').length,
      expired: all.filter(v => v.validTo < today).length,
      totalUsage: all.reduce((s, v) => s + (v.usageCount || 0), 0),
    };
  },
};
