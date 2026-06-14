import { useState, useEffect } from 'react';
import { VoucherModel } from '../models/VoucherModel';

export function useVoucherController() {
  const [vouchers, setVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVouchers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await VoucherModel.getAllVouchers();
      setVouchers(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
    
    // Optional: add event listener if you use custom events for updates
    const handleUpdate = () => fetchVouchers();
    window.addEventListener('vouchers-updated', handleUpdate);
    return () => window.removeEventListener('vouchers-updated', handleUpdate);
  }, []);

  const createVoucher = async (data) => {
    try {
      const v = await VoucherModel.createVoucher(data);
      await fetchVouchers();
      return { success: true, voucher: v };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const updateVoucher = async (id, data) => {
    try {
      const v = await VoucherModel.updateVoucher(id, data);
      await fetchVouchers();
      return { success: true, voucher: v };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await VoucherModel.updateVoucher(id, { isActive: !currentStatus });
      await fetchVouchers();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const deleteVoucher = async (id) => {
    try {
      await VoucherModel.deleteVoucher(id);
      await fetchVouchers();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  // Stubs for missing model methods to prevent crashes
  const applyVoucher = async (code, serviceId, amount) => {
    console.warn("applyVoucher is not implemented in model yet");
    return { success: false, message: "Not implemented" };
  };

  const getAutoApplicable = async (serviceId, amount, dateStr) => {
    console.warn("getAutoApplicable is not implemented in model yet");
    return null;
  };

  const incrementUsage = async (voucherId) => {
    console.warn("incrementUsage is not implemented in model yet");
    return { success: false };
  };

  const getStats = () => {
    return { total: vouchers.length, active: vouchers.filter(v => v.isActive).length };
  };

  return {
    vouchers,
    isLoading,
    error,
    refresh: fetchVouchers,
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
