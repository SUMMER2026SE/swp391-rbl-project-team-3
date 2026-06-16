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
} from 'lucide-react';
import { AppointmentModel } from '../../models/AppointmentModel';
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

  const docFee = (doctorId) => {
    const d = (doctors || []).find((x) => String(x.id) === String(doctorId));
    return parseFee(d?.consultationFee, 0);
  };

  const all = useMemo(
    () =>
      (appointments || [])
        .map((a, i) => normalizeApt(a, i))
        .filter((a) => a.status !== APT_STATUS.CANCELLED),
    [appointments]
  );

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

  // Reset the checkout state whenever the selected invoice changes.
  useEffect(() => {
    setVoucherCode('');
    setAppliedVoucher(null);
    setVoucherError('');
    setMethod('Tiền mặt');
  }, [selectedKey]);

  // ── Money math for the selected invoice ───────────────────────────────────
  const total = selected ? parseFee(selected.fee, 0) || docFee(selected.doctorId) || 300000 : 0;
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
      if (!result) {
        showToast?.('Không thể ghi nhận thanh toán (lỗi kết nối hoặc RLS).', 'error');
        return;
      }
      if (voucherId != null && typeof incrementUsage === 'function') {
        try { await incrementUsage(voucherId); } catch { /* non-fatal */ }
      }
      setReceipt({
        ...selected,
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Quầy Thu Ngân</h2>
        <p className="text-xs text-slate-500 font-medium">
          Lập hóa đơn, áp dụng mã ưu đãi và xác nhận thanh toán dịch vụ khám.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        {/* ── Invoice list ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
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
            <div className="backdrop-blur-md bg-white/50 border border-slate-200/50 rounded-2xl px-3.5 py-2 flex items-center max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bệnh nhân / mã..."
                className="bg-transparent border-none outline-none text-xs font-semibold w-full text-slate-700 focus:ring-0 p-0"
              />
              {search && (
                <button onClick={() => setSearch('')} className="bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/40 border border-white/60 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] overflow-hidden">
            {visible.length === 0 ? (
              <div className="py-14 text-center text-slate-400">
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
                          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                            {a.serviceName} · {a.doctorName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{a.aptId}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-black text-sm text-slate-900">{a.fee}</div>
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
        <div className="lg:col-span-2 lg:sticky lg:top-24">
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="backdrop-blur-md bg-white/40 border border-white/60 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] p-8 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-3 text-emerald-500">
                  <Receipt className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-700">Chọn một hóa đơn</h3>
                <p className="text-xs text-slate-400 font-medium mt-1 max-w-[220px] mx-auto">
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
                className="backdrop-blur-md bg-white/60 border border-white/70 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-6 space-y-5"
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
                  <p className="text-xs text-slate-500 font-medium">
                    {selected.serviceName} · {selected.doctorName}
                  </p>
                </div>

                {isPaid(selected) ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 rounded-2xl p-3 text-emerald-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-xs font-bold">Hóa đơn này đã được thanh toán đầy đủ.</span>
                    </div>
                    <button
                      onClick={() =>
                        setReceipt({
                          ...selected,
                          total,
                          prior,
                          discount: 0,
                          netPayable: Math.max(0, total - prior),
                          method: '—',
                          voucherCode: null,
                          paidAt: new Date(),
                        })
                      }
                      className="w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" /> In lại biên lai
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Voucher */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
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
                            className="flex-1 bg-white border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none uppercase"
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
                          <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
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
                      <Row label="Chi phí dịch vụ" value={formatVnd(total)} />
                      {prior > 0 && <Row label="Đã thanh toán trước (đặt cọc)" value={`−${formatVnd(prior)}`} tone="teal" />}
                      {discount > 0 && <Row label="Giảm giá (voucher)" value={`−${formatVnd(discount)}`} tone="emerald" />}
                      <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                        <span className="font-black text-slate-800 text-sm">Thực thu</span>
                        <span className="font-black text-emerald-600 text-xl">{formatVnd(netPayable)}</span>
                      </div>
                    </div>

                    {/* Method */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
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
    <div className="backdrop-blur-md bg-white/50 border border-white/70 p-5 rounded-[2rem] shadow-sm flex items-center justify-between">
      <div className="text-left">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">{label}</span>
        <strong className="text-2xl font-black text-slate-800 block">{value}</strong>
        <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">{hint}</span>
      </div>
      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${tones[tone]}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

function ReceiptModal({ receipt, onClose, receptionistId, showToast }) {
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
                <p className="text-[9px] text-slate-400 font-semibold">
                  Mã HĐ: HD-{String(receipt.aptId).replace(/\D/g, '').slice(-6) || '100001'}
                </p>
              </div>
              <div className="space-y-1 text-[10px] text-slate-600 font-semibold">
                <p className="flex justify-between"><span>Thời gian:</span><span>{receipt.paidAt.toLocaleString('vi-VN')}</span></p>
                <p className="flex justify-between"><span>Thu ngân:</span><span>Lễ tân ({receptionistId || 'staff'})</span></p>
                <p className="flex justify-between"><span>Hình thức:</span><span>{receipt.method}</span></p>
              </div>
              <div className="border-b border-dashed border-slate-200" />
              <div className="space-y-1 text-[10px] text-slate-700 font-semibold">
                <p><span className="text-slate-400 font-bold">Khách hàng:</span> <strong>{receipt.patientName}</strong></p>
                <p><span className="text-slate-400 font-bold">Bác sĩ:</span> {receipt.doctorName}</p>
                <p><span className="text-slate-400 font-bold">Dịch vụ:</span> {receipt.serviceName}</p>
              </div>
              <div className="border-b-2 border-double border-slate-300" />
              <div className="space-y-1 text-[10px] font-semibold text-slate-600">
                <p className="flex justify-between"><span>Cộng tiền dịch vụ:</span><span>{formatVnd(receipt.total)}</span></p>
                {receipt.prior > 0 && (
                  <p className="flex justify-between text-teal-600"><span>Đã khấu trừ cọc:</span><span>−{formatVnd(receipt.prior)}</span></p>
                )}
                {receipt.discount > 0 && (
                  <p className="flex justify-between text-emerald-600">
                    <span>Ưu đãi {receipt.voucherCode ? `(${receipt.voucherCode})` : ''}:</span>
                    <span>−{formatVnd(receipt.discount)}</span>
                  </p>
                )}
                <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center text-xs font-black text-slate-900">
                  <span>TỔNG ĐÃ THU:</span>
                  <span className="text-sm">{formatVnd(receipt.netPayable)}</span>
                </div>
              </div>
              <div className="pt-1 text-center">
                <span className="text-[8px] text-slate-400 tracking-wider">Cảm ơn quý khách đã tin tưởng DermaSmart!</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer bg-white"
              >
                Đóng lại
              </button>
              <button
                onClick={() => {
                  showToast?.('Đang gửi lệnh in hóa đơn...', 'success');
                  window.print?.();
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold hover:shadow-lg active:scale-95 transition-all cursor-pointer border-none flex justify-center items-center gap-1.5"
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
