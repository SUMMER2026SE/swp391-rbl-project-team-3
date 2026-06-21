import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  CheckCircle2,
  Hourglass,
  Search,
  X,
  Ticket,
  Printer,
  Receipt,
  Wallet,
  CreditCard,
  Banknote,
  Sparkles,
  Mail,
  Loader2,
} from 'lucide-react';
import { AppointmentModel } from '../../models/AppointmentModel';
import GlassCard, { GLASS_BASE, GLASS_INPUT } from '../common/GlassCard';
import { supabase } from '../../supabaseClient';
import {
  normalizeApt,
  parseFee,
  formatVnd,
  priorPaidFor,
  computeVoucherDiscount,
  validateVoucher,
  APT_STATUS,
  TODAY_STR,
} from './receptionistData';

// ─────────────────────────────────────────────────────────────────────────────
// MODULE B — "Quầy Thu Ngân" (Billing & Checkout)
//
// Master/detail cashier desk. Left: invoices to collect (and today's settled
// ones). Right: a checkout panel that applies a VoucherModel voucher (by code or
// from auto-suggested deals), then records the payment via AppointmentModel.addPayment
// — which writes a snake_case `payments` row (numeric voucher_id) and flips the
// appointment to "Đã thanh toán". No schema changes; existing queries only.
// ─────────────────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { id: 'Tiền mặt', icon: Banknote },
  { id: 'Chuyển khoản', icon: Wallet },
  { id: 'Thẻ ngân hàng', icon: CreditCard },
];

const FILTERS = ['Chờ thu', 'Đã thanh toán', 'Tất cả'];

export default function BillingCheckout({
  appointments = [],
  payments = [],
  doctors = [],
  vouchers = [],
  getAutoApplicable,
  incrementUsage,
  receptionistId,
  onRefresh, // async () => void  — re-pull appointments/payments after a charge
  showToast,
  focusPatientId, // optional: pre-select this patient (from the Queue "Thu ngân" jump)
  onConsumeFocus, // clears focusPatientId once honored
}) {
  const [filter, setFilter] = useState('Chờ thu');
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);
  const [method, setMethod] = useState('Tiền mặt');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null); // { voucher, discount }
  const [voucherError, setVoucherError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const [usedServices, setUsedServices] = useState([]);
  const [servicesTotal, setServicesTotal] = useState(0);

  const [servicesTotalsMap, setServicesTotalsMap] = useState({});


  const docFee = (doctorId) => {
    const d = (doctors || []).find((x) => String(x.id) === String(doctorId));
    return parseFee(d?.consultationFee, 0);
  };

  const all = useMemo(
    () =>
      (appointments || [])
        .map((a, i) => normalizeApt(a, i))
        .filter((a) => {
          // Cashier should strictly only see appointments that have finished examination (ready to pay)
          // or ones that have already been paid. Unexamined/future/duplicate appointments should not clutter this view.
          return a.status === APT_STATUS.EXAMINED || a.status === APT_STATUS.PAID;
        }),
    [appointments]
  );

  // Realtime: the cashier list is derived from appointments (EXAMINED/PAID) and
  // payments. Refresh the instant a doctor flips an appointment to "Chờ thanh
  // toán" (Đã khám → EXAMINED) or a payment is recorded, so the desk stays live.
  useEffect(() => {
    if (!onRefresh) return undefined;
    const channel = supabase
      .channel('receptionist-billing')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => { onRefresh(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => { onRefresh(); })
      .subscribe();
    // CRITICAL: remove the channel on unmount to avoid leaking subscriptions.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [onRefresh]);

  // Fetch services for all items so we can display the correct calculated fee in the list.
  useEffect(() => {
    const fetchAllServices = async () => {
      const aptIds = all.map((a) => a.aptId);
      if (aptIds.length === 0) return;
      
      try {
        const { data: tickets } = await supabase
          .from('service_tickets')
          .select('appointment_id, service_name')
          .in('appointment_id', aptIds);
          
        if (!tickets || tickets.length === 0) return;
        
        const { data: svcData } = await supabase
          .from('services')
          .select('service_name, price');
          
        const svcMap = {};
        (svcData || []).forEach((s) => {
          let priceNum = 0;
          const priceStr = s.price || 0;
          if (typeof priceStr === 'number') priceNum = priceStr;
          else if (typeof priceStr === 'string') priceNum = parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
          svcMap[s.service_name] = priceNum;
        });
        
        const totals = {};
        tickets.forEach((t) => {
          const price = svcMap[t.service_name] || 0;
          totals[t.appointment_id] = (totals[t.appointment_id] || 0) + price;
        });
        
        setServicesTotalsMap(totals);
      } catch (err) {
        console.error('Error fetching all services for list:', err);
      }
    };
    fetchAllServices();
  }, [all]);

  const isPaid = (a) => a.status === APT_STATUS.PAID;

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all
      .filter((a) => {
        if (filter === 'Chờ thu') return !isPaid(a);
        if (filter === 'Đã thanh toán') return isPaid(a);
        return true;
      })
      .filter((a) => {
        if (!term) return true;
        return (
          a.patientName.toLowerCase().includes(term) ||
          String(a.aptId).toLowerCase().includes(term) ||
          String(a.patientId || '').toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        // Today first, awaiting-payment (Đã khám) first, then by time.
        const aToday = a.date === TODAY_STR ? 0 : 1;
        const bToday = b.date === TODAY_STR ? 0 : 1;
        if (aToday !== bToday) return aToday - bToday;
        const aReady = a.status === APT_STATUS.EXAMINED ? 0 : 1;
        const bReady = b.status === APT_STATUS.EXAMINED ? 0 : 1;
        if (aReady !== bReady) return aReady - bReady;
        return a.time.localeCompare(b.time);
      });
  }, [all, filter, search]);

  // Honor a jump from the Queue module: select that patient's billable invoice.
  useEffect(() => {
    if (!focusPatientId) return;
    const match = all.find((a) => String(a.patientId) === String(focusPatientId) && !isPaid(a));
    if (match) {
      setFilter('Chờ thu');
      setSelectedKey(match.key);
    }
    onConsumeFocus?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusPatientId]);

  const selected = useMemo(
    () => visible.find((a) => a.key === selectedKey) || all.find((a) => a.key === selectedKey) || null,
    [visible, all, selectedKey]
  );

  useEffect(() => {
    if (!selectedKey || !selected) {
      setUsedServices([]);
      setServicesTotal(0);
      return;
    }
    
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('service_tickets')
          .select('id, service_name')
          .eq('appointment_id', selected.aptId);
          
        if (data && data.length > 0) {
           const { data: svcData } = await supabase
             .from('services')
             .select('service_name, price');
             
           let totalSvc = 0;
           const svcs = data.map(t => {
               const svc = (svcData || []).find(s => s.service_name === t.service_name);
               const priceStr = svc?.price || 0;
               let priceNum = 0;
               if (typeof priceStr === 'number') priceNum = priceStr;
               else if (typeof priceStr === 'string') priceNum = parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
               
               totalSvc += priceNum;
               
               return {
                 id: t.id,
                 name: t.service_name,
                 price: priceNum
               };
           });
           setUsedServices(svcs);
           setServicesTotal(totalSvc);
        } else {
           setUsedServices([]);
           setServicesTotal(0);
        }
      } catch (err) {
         console.error('Error fetching used services:', err);
      }
    };
    fetchServices();
  }, [selectedKey, selected]);

  // Reset the checkout state whenever the selected invoice changes.
  useEffect(() => {
    setVoucherCode('');
    setAppliedVoucher(null);
    setVoucherError('');
    setMethod('Tiền mặt');
  }, [selectedKey]);

  // ── Money math for the selected invoice ───────────────────────────────────
  const baseTotal = selected ? parseFee(selected.fee, 0) || docFee(selected.doctorId) || 300000 : 0;
  const total = baseTotal + servicesTotal;
  const prior = selected ? priorPaidFor(selected.aptId, payments) : 0;
  const discount = appliedVoucher?.discount || 0;
  const netPayable = Math.max(0, total - prior - discount);

  const suggestions = useMemo(() => {
    if (!selected || isPaid(selected) || typeof getAutoApplicable !== 'function') return [];
    try {
      return (getAutoApplicable(selected.serviceId, total, TODAY_STR) || []).slice(0, 3);
    } catch {
      return [];
    }
  }, [selected, total, getAutoApplicable]);

  const applyVoucherObject = (voucher) => {
    const check = validateVoucher(voucher, {
      amount: total,
      serviceId: selected?.serviceId,
      dateStr: TODAY_STR,
    });
    if (!check.ok) {
      setAppliedVoucher(null);
      setVoucherError(check.reason);
      return;
    }
    const { discount: d } = computeVoucherDiscount(voucher, total);
    setAppliedVoucher({ voucher, discount: d });
    setVoucherCode(voucher.code || '');
    setVoucherError('');
  };

  const applyByCode = () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      setVoucherError('Vui lòng nhập mã giảm giá.');
      return;
    }
    const v = (vouchers || []).find((x) => String(x.code || '').toUpperCase() === code);
    if (!v) {
      setAppliedVoucher(null);
      setVoucherError('Mã giảm giá không tồn tại.');
      return;
    }
    applyVoucherObject(v);
  };

  const clearVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError('');
  };

  const handleConfirm = async () => {
    if (!selected || processing) return;
    setProcessing(true);
    try {
      const voucherId = appliedVoucher?.voucher?.id ?? null;
      const payload = {
        appointment_id: selected.aptId,
        patient_id: selected.patientId,
        receptionist_id: receptionistId ?? null,
        voucher_id: voucherId, // AppointmentModel coerces to numeric or null
        total_amount: total,
        discount_amount: discount,
        final_amount: netPayable,
        payment_method: method,
      };
      // markAppointmentPaid defaults true → flips status to "Đã thanh toán".
      const result = await AppointmentModel.addPayment(payload);
      if (result && result.error) {
        let errMsg = result.error.message || String(result.error);
        if (errMsg.includes('idx_unique_patient_voucher')) {
          errMsg = 'Bệnh nhân này đã sử dụng mã giảm giá này rồi.';
        }
        showToast?.(`Lỗi thanh toán: ${errMsg}`, 'error');
        return;
      }
      if (!result) {
        showToast?.('Không thể ghi nhận thanh toán (không có dữ liệu trả về).', 'error');
        return;
      }
      if (voucherId != null && typeof incrementUsage === 'function') {
        try { await incrementUsage(voucherId); } catch { /* non-fatal */ }
      }
      
      const baseTotal = parseFee(selected.fee, 0) || docFee(selected.doctorId) || 300000;
      
      setReceipt({
        ...selected,
        baseTotal,
        usedServices,
        total,
        prior,
        discount,
        netPayable,
        method,
        voucherCode: appliedVoucher?.voucher?.code || null,
        paidAt: new Date(),
      });
      showToast?.(`Đã thu ${formatVnd(netPayable)} của ${selected.patientName} qua ${method}.`, 'success');
      setSelectedKey(null);
      await onRefresh?.();
    } catch (e) {
      showToast?.(e.message || 'Có lỗi xảy ra khi thanh toán.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const todayApts = all.filter((a) => a.date === TODAY_STR);
    const paidToday = todayApts.filter(isPaid);
    const paidIds = new Set(paidToday.map((a) => String(a.aptId)));
    const revenue = (payments || [])
      .filter((p) => paidIds.has(String(p.appointment_id ?? p.appointmentId)))
      .reduce((s, p) => s + parseFee(p.final_amount ?? p.amount ?? p.total_amount, 0), 0);
    return {
      revenue,
      paidCount: paidToday.length,
      pendingCount: todayApts.filter((a) => !isPaid(a)).length,
    };
  }, [all, payments]);

  return (
    <div className="space-y-6 text-left">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          label="Doanh thu hôm nay"
          value={formatVnd(stats.revenue)}
          hint="Tổng tiền thực thu"
          icon={DollarSign}
          tone="emerald"
        />
        <StatCard
          label="Hóa đơn đã thu"
          value={stats.paidCount}
          hint="Hoàn tất thanh toán"
          icon={CheckCircle2}
          tone="teal"
        />
        <StatCard
          label="Chờ thanh toán"
          value={stats.pendingCount}
          hint="Hóa đơn cần thu hôm nay"
          icon={Hourglass}
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Invoice list ─────────────────────────────────────────────────── */}
        <div className="col-span-1 lg:col-span-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="flex bg-slate-100/80 p-1 rounded-2xl gap-1 w-fit border border-slate-200/40">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`py-2 px-4 rounded-xl border-none font-bold text-xs cursor-pointer transition-all ${
                    filter === f ? 'bg-white text-slate-800 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="backdrop-blur-md bg-white/20 border border-white/40 rounded-2xl px-3.5 py-2 flex items-center max-w-xs w-full focus-within:bg-white/40 focus-within:border-white focus-within:ring-2 focus-within:ring-emerald-400/50 transition-all">
              <Search className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bệnh nhân / mã..."
                className="bg-transparent border-none outline-none text-xs font-semibold w-full text-gray-800 placeholder-gray-500 focus:ring-0 p-0"
              />
              {search && (
                <button onClick={() => setSearch('')} className="bg-transparent border-none cursor-pointer text-slate-500 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className={`${GLASS_BASE} overflow-hidden`}>
            {visible.length === 0 ? (
              <div className="py-14 text-center text-slate-500">
                <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">Không có hóa đơn phù hợp.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200/40">
                {visible.map((a) => {
                  const paid = isPaid(a);
                  const ready = a.status === APT_STATUS.EXAMINED;
                  const active = a.key === selectedKey;
                  return (
                    <li key={a.key}>
                      <button
                        onClick={() => setSelectedKey(a.key)}
                        className={`w-full text-left px-5 py-4 flex items-center justify-between gap-3 transition-colors cursor-pointer border-none bg-transparent ${
                          active ? 'bg-emerald-50/70' : 'hover:bg-white/60'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-800 truncate">{a.patientName}</span>
                            {ready && !paid && (
                              <span className="text-[8px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-200/60 rounded px-1 py-0.5">
                                Đã khám xong
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            {a.serviceName} · {a.doctorName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{a.aptId}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-black text-sm text-slate-900">
                            {(() => {
                              const aBaseTotal = parseFee(a.fee, 0) || docFee(a.doctorId) || 300000;
                              const aServicesTotal = servicesTotalsMap[a.aptId] || 0;
                              const pays = (payments || []).filter((p) => String(p.appointment_id ?? p.appointmentId) === String(a.aptId));
                              
                              if (paid) {
                                // For paid ones, show the final payment amount
                                if (pays.length > 0) {
                                  const finalPay = pays[pays.length - 1];
                                  return formatVnd(parseFee(finalPay.final_amount ?? finalPay.amount ?? finalPay.total_amount, 0));
                                }
                                return formatVnd(aBaseTotal + aServicesTotal);
                              } else {
                                // Unpaid: base + services - deposit
                                const aPrior = pays.reduce((sum, p) => sum + parseFee(p.final_amount ?? p.amount ?? p.total_amount, 0), 0);
                                return formatVnd(Math.max(0, aBaseTotal + aServicesTotal - aPrior));
                              }
                            })()}
                          </div>
                          <span
                            className={`inline-block mt-1 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                              paid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : ready
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                          >
                            {paid ? 'Đã thanh toán' : 'Chưa thu'}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── Checkout panel ───────────────────────────────────────────────── */}
        <div className="col-span-1 lg:col-span-6 lg:sticky lg:top-24">
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className={`${GLASS_BASE} p-6 text-center`}
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-3 text-emerald-500">
                  <Receipt className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-700">Chọn một hóa đơn</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 max-w-[220px] mx-auto">
                  Nhấn vào một bệnh nhân ở danh sách để lập hóa đơn và thu tiền.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selected.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                className={`${GLASS_BASE} p-6 space-y-5`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200/50 rounded-full px-3 py-1">
                    Hóa đơn thu ngân
                  </span>
                  <button
                    onClick={() => setSelectedKey(null)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer border-none"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-left">
                  <h3 className="font-black text-lg text-slate-800">{selected.patientName}</h3>
                  <div className="flex flex-col gap-1 mt-1">
                    <p className="text-xs text-slate-500 font-medium">
                      {selected.serviceName} · {selected.doctorName}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      Ngày lập: {new Date().toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>

                {isPaid(selected) ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 rounded-2xl p-3 text-emerald-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-xs font-bold">Hóa đơn này đã được thanh toán đầy đủ.</span>
                    </div>
                    <button
                      onClick={async () => {
                        showToast?.('Đang tải lại dữ liệu hóa đơn...');
                        const { data: invs } = await supabase.from('invoices').select('*').eq('appointment_id', selected.aptId).order('created_at', { ascending: true });
                        let priorAmount = 0;
                        let checkoutAmount = 0;
                        const paidRecord = payments.find(p => p.appointment_id === selected.aptId);
                        if (invs && invs.length > 0) {
                          if (invs.length === 1) {
                            checkoutAmount = invs[0].total_amount;
                          } else {
                            priorAmount = invs.slice(0, invs.length - 1).reduce((sum, i) => sum + i.total_amount, 0);
                            checkoutAmount = invs[invs.length - 1].total_amount;
                          }
                        } else if (paidRecord) {
                          // Fallback if invoices table was manually cleared
                          priorAmount = paidRecord.final_amount > 50000 ? 50000 : 0;
                          checkoutAmount = Math.max(0, paidRecord.final_amount - priorAmount);
                        }
                        setReceipt({
                          ...selected,
                          baseTotal: parseFee(selected.fee, 0) || 300000,
                          usedServices,
                          total: paidRecord?.total_amount || total,
                          prior: priorAmount,
                          discount: paidRecord?.discount_amount || 0,
                          netPayable: checkoutAmount,
                          method: paidRecord?.payment_method || '—',
                          voucherCode: null,
                          paidAt: paidRecord?.paid_at ? new Date(paidRecord.paid_at) : new Date(),
                        });
                      }}
                      className="w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" /> In lại biên lai
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Voucher */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <Ticket className="w-3.5 h-3.5" /> Mã giảm giá
                      </label>
                      {appliedVoucher ? (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200/60 rounded-xl px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-xs font-black text-emerald-700 truncate">
                              {appliedVoucher.voucher.code}
                            </p>
                            <p className="text-[10px] text-emerald-600 font-semibold">
                              −{formatVnd(appliedVoucher.discount)}
                            </p>
                          </div>
                          <button
                            onClick={clearVoucher}
                            className="text-emerald-600 hover:text-rose-500 bg-transparent border-none cursor-pointer p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyByCode()}
                            placeholder="VD: SUMMER_SALE"
                            className={`flex-1 ${GLASS_INPUT} px-3 py-2.5 text-xs font-semibold uppercase`}
                          />
                          <button
                            onClick={applyByCode}
                            className="px-4 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 active:scale-95 transition-all cursor-pointer border-none"
                          >
                            Áp dụng
                          </button>
                        </div>
                      )}
                      {voucherError && <p className="text-[10px] text-rose-500 font-semibold mt-1.5">{voucherError}</p>}

                      {/* Auto-applicable suggestions */}
                      {!appliedVoucher && suggestions.length > 0 && (
                        <div className="mt-2.5 space-y-1.5">
                          <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" /> Ưu đãi khả dụng
                          </p>
                          {suggestions.map((s, i) => (
                            <button
                              key={`${s.voucher?.id ?? s.voucher?.code ?? 'v'}::${i}`}
                              onClick={() => applyVoucherObject(s.voucher)}
                              className="w-full flex items-center justify-between bg-white border border-slate-200 hover:border-emerald-300 rounded-xl px-3 py-2 text-left cursor-pointer transition-all group"
                            >
                              <span className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-600 truncate">
                                {s.voucher?.code}
                              </span>
                              <span className="text-[11px] font-black text-emerald-600 shrink-0">
                                −{formatVnd(s.discount)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Breakdown */}
                    <div className="border-t border-dashed border-slate-200 pt-3 space-y-2 text-xs font-semibold text-slate-600">
                      <Row label={`Khám: ${selected.serviceName}`} value={formatVnd(baseTotal)} />
                      {usedServices.map(s => (
                        <Row key={s.id} label={`Dịch vụ: ${s.name}`} value={formatVnd(s.price)} />
                      ))}
                      {prior > 0 && <Row label="Đã thanh toán trước (đặt cọc)" value={`−${formatVnd(prior)}`} tone="teal" />}
                      {discount > 0 && <Row label="Giảm giá (voucher)" value={`−${formatVnd(discount)}`} tone="emerald" />}
                      <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                        <span className="font-black text-slate-800 text-sm">Thực thu</span>
                        <span className="font-black text-emerald-600 text-xl">{formatVnd(netPayable)}</span>
                      </div>
                    </div>

                    {/* Method */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                        Phương thức thanh toán
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {PAYMENT_METHODS.map((m) => {
                          const Icon = m.icon;
                          const on = method === m.id;
                          return (
                            <button
                              key={m.id}
                              onClick={() => setMethod(m.id)}
                              className={`py-2.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                                on
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              {m.id}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={handleConfirm}
                      disabled={processing}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-black hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer border-none disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {processing ? 'Đang xử lý...' : <>Xác nhận thu {formatVnd(netPayable)}</>}
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Receipt modal */}
      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} receptionistId={receptionistId} showToast={showToast} />
    </div>
  );
}

function Row({ label, value, tone }) {
  const color = tone === 'teal' ? 'text-teal-600' : tone === 'emerald' ? 'text-emerald-600' : 'text-slate-600';
  return (
    <div className={`flex items-center justify-between ${color}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function StatCard({ label, value, hint, icon: Icon, tone }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-500 border-emerald-100',
    teal: 'bg-teal-50 text-teal-500 border-teal-100',
    amber: 'bg-amber-50 text-amber-500 border-amber-100',
  };
  return (
    <GlassCard interactive className="h-full flex items-center justify-between">
      <div className="text-left">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">{label}</span>
        <strong className="text-2xl font-black text-slate-800 block">{value}</strong>
        <span className="text-[9px] text-slate-500 font-semibold mt-0.5 block">{hint}</span>
      </div>
      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${tones[tone]}`}>
        <Icon className="w-6 h-6" />
      </div>
    </GlassCard>
  );
}

function ReceiptModal({ receipt, onClose, receptionistId, showToast }) {
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Mock the "email the e-invoice to the patient" flow: show a loading state,
  // simulate the network round-trip, then surface a success toast. Swap the
  // setTimeout for the real send call (e.g. an edge function) when wired up.
  const handleSendEmail = async () => {
    if (isSendingEmail) return;
    setIsSendingEmail(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showToast?.('Đã gửi hóa đơn thành công đến email của bệnh nhân!', 'success');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <AnimatePresence>
      {receipt && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="w-full max-w-md bg-white border border-slate-300 shadow-2xl rounded-3xl p-6 pointer-events-auto"
            >
            <div id="rcp-print" className="bg-white p-4 text-xs font-mono text-slate-800 text-left space-y-4 border border-slate-100 rounded-2xl">
              <div className="text-center space-y-1">
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">PHÒNG KHÁM DA LIỄU DERMASMART</h4>
                <p className="text-[10px] text-slate-500 font-semibold">123 Đường Ba Tháng Hai, Quận 10, TP.HCM</p>
                <div className="border-b-2 border-double border-slate-300 my-2" />
                <h5 className="font-extrabold text-xs uppercase tracking-widest py-1">HÓA ĐƠN THANH TOÁN</h5>
                <p className="text-[9px] text-slate-500 font-semibold">
                  Mã HĐ: HD-{String(receipt.aptId).replace(/\D/g, '').slice(-6) || '100001'}
                </p>
              </div>
              <div className="space-y-1 text-[10px] text-slate-600 font-semibold">
                <p className="flex justify-between"><span>Thời gian:</span><span>{receipt.paidAt.toLocaleString('vi-VN')}</span></p>
                <p className="flex justify-between"><span>Thu ngân:</span><span className="truncate max-w-[120px]">{receptionistId || 'staff'}</span></p>
                <p className="flex justify-between"><span>Hình thức:</span><span>{receipt.method}</span></p>
              </div>
              <div className="border-b border-dashed border-slate-200 my-2" />
              <div className="space-y-1 text-[10px] text-slate-700 font-semibold">
                <p><span className="text-slate-500 font-bold">Khách hàng:</span> <strong>{receipt.patientName}</strong></p>
                <p><span className="text-slate-500 font-bold">Bác sĩ:</span> {receipt.doctorName}</p>
              </div>
              <div className="border-t border-dashed border-slate-300 my-2 pt-2 space-y-1 text-[10px] text-slate-700 font-semibold">
                <div className="flex justify-between">
                  <span>Khám: {receipt.serviceName}</span>
                  <span className="font-mono">{formatVnd(receipt.baseTotal)}</span>
                </div>
                {receipt.usedServices && receipt.usedServices.map((s, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>DV: {s.name}</span>
                    <span className="font-mono">{formatVnd(s.price)}</span>
                  </div>
                ))}
              </div>
              <div className="border-b-2 border-double border-slate-300 my-2" />
              <div className="space-y-1 text-[10px] font-semibold text-slate-600">
                <p className="flex justify-between"><span>Cộng tiền dịch vụ:</span><span className="font-mono">{formatVnd(receipt.total)}</span></p>
                {receipt.prior > 0 && (
                  <p className="flex justify-between text-teal-600"><span>Đã khấu trừ cọc:</span><span className="font-mono">−{formatVnd(receipt.prior)}</span></p>
                )}
                {receipt.discount > 0 && (
                  <p className="flex justify-between text-emerald-600">
                    <span>Giảm giá (voucher) {receipt.voucherCode ? `[${receipt.voucherCode}]` : ''}:</span>
                    <span className="font-mono">−{formatVnd(receipt.discount)}</span>
                  </p>
                )}
                <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center text-xs font-black text-slate-900">
                  <span>TỔNG ĐÃ THU:</span>
                  <span className="text-sm">{formatVnd(receipt.netPayable)}</span>
                </div>
              </div>
              <div className="pt-1 text-center">
                <span className="text-[8px] text-slate-500 tracking-wider">Cảm ơn quý khách đã tin tưởng DermaSmart!</span>
              </div>
              <p className="text-xs text-gray-500 italic text-center mt-4">
                * Bản điện tử của hóa đơn sẽ được gửi qua email bệnh nhân.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={onClose}
                className="sm:flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer bg-white"
              >
                Đóng lại
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="sm:flex-1 py-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 active:scale-95 transition-all cursor-pointer text-xs font-bold flex justify-center items-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" /> Đang gửi...
                  </>
                ) : (
                  <>
                    <Mail size={18} className="mr-2" /> Gửi Email
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  showToast?.('Đang gửi lệnh in hóa đơn...', 'success');
                  window.print?.();
                }}
                className="sm:flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold hover:shadow-lg active:scale-95 transition-all cursor-pointer border-none flex justify-center items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> In hóa đơn
              </button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
