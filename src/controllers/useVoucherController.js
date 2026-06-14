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

  const getAutoApplicable = (serviceId, amount, dateStr) => {
    if (!vouchers || !Array.isArray(vouchers)) return [];
    
    const today = dateStr || new Date().toISOString().split('T')[0];
    
    const active = vouchers.filter(v => {
      const isActive = v.isActive === true || v.status === 'Hoạt động';
      if (!isActive) return false;
      
      if (v.validFrom && v.validFrom > today) return false;
      if (v.validTo && v.validTo < today) return false;
      
      if (v.usageCount !== undefined && v.maxUsage !== undefined && v.usageCount >= v.maxUsage) return false;
      
      if (v.applicableServices) {
        try {
          const arr = typeof v.applicableServices === 'string' ? JSON.parse(v.applicableServices) : v.applicableServices;
          if (Array.isArray(arr) && arr.length > 0 && !arr.includes(serviceId)) {
            return false;
          }
        } catch (e) {
          if (typeof v.applicableServices === 'string' && v.applicableServices.trim() !== '') {
            const list = v.applicableServices.split(',').map(s => s.trim());
            if (!list.includes(serviceId)) return false;
          }
        }
      }
      
      const minAmount = Number(v.minOrderAmount || v.minOrderValue || 0);
      if (amount < minAmount) return false;
      
      return true;
    });
    
    const results = active.map(v => {
      let discount = 0;
      const discountType = v.discountType;
      const discountValue = Number(v.discountValue || 0);
      
      if (discountType === 'Percentage') {
        discount = (amount * discountValue) / 100;
        const maxDiscount = Number(v.maxDiscountAmount || v.maxDiscountValue || 0);
        if (maxDiscount > 0 && discount > maxDiscount) {
          discount = maxDiscount;
        }
      } else {
        discount = discountValue;
      }
      
      if (discount > amount) {
        discount = amount;
      }
      
      const finalAmount = amount - discount;
      
      return {
        voucher: v,
        discount,
        finalAmount
      };
    });
    
    return results.sort((a, b) => b.discount - a.discount);
  };

  const incrementUsage = async (voucherId) => {
    try {
      const v = await VoucherModel.incrementUsage(voucherId);
      await fetchVouchers();
      return { success: true, voucher: v };
    } catch (e) {
      return { success: false, error: e.message };
    }
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
