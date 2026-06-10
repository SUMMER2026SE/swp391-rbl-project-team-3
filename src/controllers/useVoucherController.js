import { useState, useEffect } from 'react';
import { VoucherModel } from '../models/VoucherModel';

export function useVoucherController() {
  const [vouchers, setVouchers] = useState(() => VoucherModel.getAll());

  useEffect(() => {
    const handle = () => setVouchers(VoucherModel.getAll());
    window.addEventListener('vouchers-updated', handle);
    return () => window.removeEventListener('vouchers-updated', handle);
  }, []);

  const createVoucher = (data) => {
    try {
      const v = VoucherModel.create(data);
      return { success: true, voucher: v };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const updateVoucher = (id, data) => {
    try {
      const v = VoucherModel.update(id, data);
      return { success: true, voucher: v };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const toggleStatus = (id) => {
    try {
      VoucherModel.toggleStatus(id);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const deleteVoucher = (id) => {
    try {
      VoucherModel.delete(id);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const applyVoucher = (code, serviceId, amount) =>
    VoucherModel.apply(code, serviceId, amount);

  const getAutoApplicable = (serviceId, amount, dateStr) =>
    VoucherModel.getAutoApplicable(serviceId, amount, dateStr);

  const incrementUsage = (voucherId) =>
    VoucherModel.incrementUsage(voucherId);

  const getStats = () => VoucherModel.getStats();

  return {
    vouchers,
    createVoucher,
    updateVoucher,
    toggleStatus,
    deleteVoucher,
    applyVoucher,
    getAutoApplicable,
    incrementUsage,
    getStats,
  };
}
