import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Calendar, Clock, User, Stethoscope, CheckCircle2,
  ChevronDown, Star, AlertTriangle, Ticket, Tag, Sparkles,
  TrendingDown, Info,
} from 'lucide-react';
import { doctors, mockServices } from '../../mockData';
import { useAppointmentController } from '../../controllers/useAppointmentController';
import { useVoucherController } from '../../controllers/useVoucherController';
import { useAuth } from '../../context/AuthContext';

// ─── Parse price string → number ─────────────────────────────────────────────
function parsePriceToNumber(priceStr) {
  if (!priceStr) return 0;
  if (typeof priceStr === 'number') return priceStr;
  // "1,800,000 VNĐ" → 1800000
  return parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
}

function formatVND(n) {
  return n.toLocaleString('vi-VN') + ' VNĐ';
}

// ─── Voucher Banner ───────────────────────────────────────────────────────────
function VoucherBanner({ applicable }) {
  const [showAll, setShowAll] = useState(false);
  if (!applicable || applicable.length === 0) return null;

  const best = applicable[0];
  const rest = applicable.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50"
    >
      {/* Best voucher */}
      <div className="p-3.5">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-emerald-500 rounded-lg shrink-0 mt-0.5">
            <Ticket className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-emerald-800">
                ✅ Tự động áp dụng: {best.voucher.eventEmoji || '🏷️'} {best.voucher.name}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] text-emerald-700 font-semibold">
                {best.voucher.discountType === 'Percentage'
                  ? `Giảm ${best.voucher.discountValue}%`
                  : `Giảm ${formatVND(best.voucher.discountValue)}`}
                {best.voucher.maxDiscountAmount > 0 && best.voucher.discountType === 'Percentage'
                  ? ` (tối đa ${formatVND(best.voucher.maxDiscountAmount)})`
                  : ''}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-black text-emerald-700">-{formatVND(best.discount)}</p>
          </div>
        </div>
      </div>

      {/* Extra vouchers */}
      {rest.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowAll(p => !p)}
            className="w-full text-[10px] font-bold text-emerald-600 py-1.5 border-t border-emerald-200 bg-emerald-100/50 hover:bg-emerald-100 transition-all cursor-pointer border-none flex items-center justify-center gap-1"
          >
            <Tag className="w-3 h-3" />
            {showAll ? 'Ẩn' : `+${rest.length} ưu đãi khác cũng đang áp dụng`}
          </button>
          <AnimatePresence>
            {showAll && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {rest.map(r => (
                  <div key={r.voucher.id} className="px-3.5 py-2.5 border-t border-emerald-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]">{r.voucher.eventEmoji || '🏷️'}</span>
                      <p className="text-[10px] font-bold text-slate-700 leading-none">{r.voucher.name}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 shrink-0">-{formatVND(r.discount)}</span>
                  </div>
                ))}
                <div className="px-3.5 py-2 border-t border-emerald-200 bg-emerald-100/30">
                  <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Hệ thống tự chọn ưu đãi tốt nhất cho bạn.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}

// ─── Price Summary ────────────────────────────────────────────────────────────
function PriceSummary({ originalAmount, bestVoucher }) {
  if (!originalAmount) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
      <div className="flex justify-between text-xs font-semibold text-slate-600">
        <span>Giá dịch vụ</span>
        <span>{formatVND(originalAmount)}</span>
      </div>
      {bestVoucher && bestVoucher.discount > 0 && (
        <>
          <div className="flex justify-between text-xs font-semibold text-emerald-600">
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              {bestVoucher.voucher.eventEmoji || '🏷️'} {bestVoucher.voucher.name}
            </span>
            <span>-{formatVND(bestVoucher.discount)}</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-slate-900">
            <span>Thanh toán</span>
            <span className="text-emerald-600">{formatVND(bestVoucher.finalAmount)}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BookAppointmentForm({ isOpen, onClose, preselectedDoctorId = null }) {
  const { user } = useAuth();
  const { bookAppointment, getAvailableSlots } = useAppointmentController(user?.id);
  const { getAutoApplicable, incrementUsage } = useVoucherController();

  const [selectedService, setSelectedService]   = useState('');
  const [servicesList, setServicesList]         = useState([]);
  const [selectedDoctor, setSelectedDoctor]     = useState(preselectedDoctorId || '');
  const [selectedDate, setSelectedDate]         = useState('');
  const [selectedTime, setSelectedTime]         = useState('');
  const [guestName, setGuestName]               = useState('');
  const [guestPhone, setGuestPhone]             = useState('');
  const [guestEmail, setGuestEmail]             = useState('');
  const [errorMessage, setErrorMessage]         = useState('');
  const [isSubmitted, setIsSubmitted]           = useState(false);

  // Reset khi modal mở
  useEffect(() => {
    if (isOpen) {
      setSelectedService('');
      setSelectedDoctor(preselectedDoctorId || '');
      setSelectedDate('');
      setSelectedTime('');
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
      setErrorMessage('');
      setIsSubmitted(false);

      const saved = localStorage.getItem('admin-services');
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
            .map(s => ({
              id: s.id,
              name: s.name,
              price: typeof s.price === 'number' ? `${s.price.toLocaleString('vi-VN')} VNĐ` : s.price,
              description: s.description,
              status: s.status,
            }))
            .filter(s => s.status === 'Hoạt động');
          setServicesList(parsed);
        } catch { setServicesList(mockServices); }
      } else {
        setServicesList(mockServices);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor);
  const selectedServiceData = servicesList.find(s => s.id === selectedService);

  // Ngày tối thiểu = ngày mai
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Kiểm tra bác sĩ có trực hôm đó không
  let isDoctorWorkingOnDay = true;
  let doctorScheduleText = '';
  if (selectedDoctorData && selectedDate) {
    const DAY_MAP = { 'Chủ Nhật':0,'Thứ Hai':1,'Thứ Ba':2,'Thứ Tư':3,'Thứ Năm':4,'Thứ Sáu':5,'Thứ Bảy':6 };
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();
    const workingDays = selectedDoctorData.schedule.map(s => DAY_MAP[s.day] ?? -1).filter(d => d !== -1);
    isDoctorWorkingOnDay = workingDays.includes(dayOfWeek);
    doctorScheduleText = selectedDoctorData.schedule.map(s => s.day).join(', ');
  }

  const slots = (selectedDoctor && selectedDate && isDoctorWorkingOnDay)
    ? getAvailableSlots(selectedDoctor, selectedDate)
    : [];

  // ── Auto-apply voucher ──────────────────────────────────────────────────────
  const originalAmount = selectedServiceData ? parsePriceToNumber(selectedServiceData.price) : 0;

  const applicableVouchers = useMemo(() => {
    if (!selectedService || !originalAmount || !selectedDate) return [];
    return getAutoApplicable(selectedService, originalAmount, selectedDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedService, originalAmount, selectedDate]);

  const bestVoucher = applicableVouchers[0] || null; // voucher giảm nhiều nhất

  // Giá cuối sau khi apply
  const finalFee = bestVoucher
    ? formatVND(bestVoucher.finalAmount)
    : selectedServiceData?.price || '300,000 VNĐ';

  // ── Form completion ─────────────────────────────────────────────────────────
  const isContactInfoComplete = user
    ? true
    : (guestName.trim() && guestPhone.trim() && guestEmail.trim());

  const isFormComplete =
    selectedService && selectedDoctor && selectedDate && selectedTime &&
    isDoctorWorkingOnDay && isContactInfoComplete;

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormComplete) return;
    setErrorMessage('');

    const bookingPayload = {
      doctorId: selectedDoctor,
      patientId: user ? user.id : null,
      patientName: user ? user.name : guestName,
      patientPhone: user ? (user.phone || guestPhone) : guestPhone,
      patientEmail: user ? (user.email || guestEmail) : guestEmail,
      date: selectedDate,
      time: selectedTime,
      service: selectedServiceData?.name || 'Khám Da Liễu Tổng Quát',
      fee: finalFee,
      originalFee: selectedServiceData?.price || finalFee,
      voucherId: bestVoucher?.voucher.id || null,
      voucherCode: bestVoucher?.voucher.code || null,
      discount: bestVoucher?.discount || 0,
      notes: user
        ? `Khách hàng đặt lịch khám qua cổng Portal.${bestVoucher ? ' Đã áp dụng ưu đãi.' : ''}`
        : `Khách vãng lai đăng ký qua website.${bestVoucher ? ' Đã áp dụng ưu đãi.' : ''}`,
    };

    const result = bookAppointment(bookingPayload);
    if (result.success) {
      // Tăng usage count cho voucher đã dùng
      if (bestVoucher) {
        incrementUsage(bestVoucher.voucher.id);
      }
      setIsSubmitted(true);
      setTimeout(() => onClose(), 2800);
    } else {
      setErrorMessage(result.error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm font-sans"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-xl backdrop-blur-3xl bg-white/90 border border-white/80 shadow-[0_20px_60px_rgba(14,165,233,0.15)] rounded-[2.5rem] p-8 relative max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 bg-transparent border-none text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 p-2 rounded-full flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── Success ── */}
        <AnimatePresence>
          {isSubmitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}>
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Đặt lịch thành công!</h3>
              {bestVoucher && (
                <div className="mb-3 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full">
                  <Ticket className="w-3.5 h-3.5" />
                  {bestVoucher.voucher.eventEmoji || '🏷️'} Tiết kiệm {formatVND(bestVoucher.discount)}
                </div>
              )}
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                Yêu cầu đặt lịch đã gửi tới Lễ tân để phê duyệt.{' '}
                {user
                  ? 'Xem và quản lý lịch khám tại trang cá nhân.'
                  : 'Lễ tân sẽ gọi điện xác nhận sớm nhất.'}
              </p>
              {bestVoucher && originalAmount > 0 && (
                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm space-y-1.5 text-left w-full max-w-xs mx-auto">
                  <div className="flex justify-between text-slate-500">
                    <span>Giá gốc</span>
                    <span className="line-through">{formatVND(originalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Voucher {bestVoucher.voucher.eventEmoji || '🏷️'}</span>
                    <span>-{formatVND(bestVoucher.discount)}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-1.5">
                    <span>Thanh toán</span>
                    <span className="text-emerald-600">{formatVND(bestVoucher.finalAmount)}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Form ── */}
        {!isSubmitted && (
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-1 tracking-tight">Đặt lịch khám mới</h2>
              <p className="text-slate-500 text-sm">Điền đầy đủ thông tin để đặt chỗ khám tại DermaSmart</p>
            </div>

            {/* Error */}
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div><span className="font-bold">Lỗi đặt lịch:</span> {errorMessage}</div>
              </div>
            )}

            <div className="space-y-4">
              {/* 1. Service */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <Stethoscope className="w-4 h-4 text-emerald-500" />
                  Chọn dịch vụ
                </label>
                <div className="relative">
                  <select
                    value={selectedService}
                    onChange={e => { setSelectedService(e.target.value); setSelectedTime(''); }}
                    required
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 transition-colors appearance-none cursor-pointer text-sm pr-10"
                  >
                    <option value="">-- Chọn dịch vụ --</option>
                    {servicesList.map(svc => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name} — {svc.price}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 2. Doctor */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <User className="w-4 h-4 text-sky-500" />
                  Chọn bác sĩ
                </label>
                <div className="relative">
                  <select
                    value={selectedDoctor}
                    onChange={e => { setSelectedDoctor(e.target.value); setSelectedTime(''); }}
                    required
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 transition-colors appearance-none cursor-pointer text-sm pr-10"
                  >
                    <option value="">-- Chọn bác sĩ --</option>
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} — {doc.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <AnimatePresence>
                  {selectedDoctorData && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 overflow-hidden"
                    >
                      <div className="flex items-center gap-3">
                        <img src={selectedDoctorData.image} alt={selectedDoctorData.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{selectedDoctorData.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                              {selectedDoctorData.rating}
                            </span>
                            <span className="text-[10px] text-slate-400">Lịch trực: {selectedDoctorData.schedule.map(s => s.day).join(', ')}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Date */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <Calendar className="w-4 h-4 text-teal-500" />
                  Chọn ngày khám
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={minDate}
                  required
                  onChange={e => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 transition-colors cursor-pointer text-sm"
                />
                {selectedDoctorData && selectedDate && !isDoctorWorkingOnDay && (
                  <div className="mt-2 text-xs text-rose-500 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Bác sĩ không có lịch trực ngày này. ({doctorScheduleText})
                  </div>
                )}
              </div>

              {/* 4. Time */}
              {selectedDoctor && selectedDate && isDoctorWorkingOnDay && (
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Chọn khung giờ
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(slot => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={slot.isBooked}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`px-2 py-2.5 rounded-xl text-xs font-bold text-center cursor-pointer border transition-all ${
                          slot.isBooked
                            ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed line-through'
                            : selectedTime === slot.time
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        {slot.time}
                        {slot.isBooked && <span className="block text-[8px] font-normal leading-none mt-0.5 text-slate-400">Đã đặt</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Auto-apply Voucher Banner ── */}
              <AnimatePresence>
                {selectedService && selectedDate && applicableVouchers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    <VoucherBanner applicable={applicableVouchers} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── No voucher info ── */}
              <AnimatePresence>
                {selectedService && selectedDate && applicableVouchers.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-[11px] text-slate-400 font-medium px-1"
                  >
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    Hiện không có ưu đãi nào áp dụng cho dịch vụ này.
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Price Summary ── */}
              <AnimatePresence>
                {selectedService && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <PriceSummary
                      originalAmount={originalAmount}
                      bestVoucher={bestVoucher}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 5. Contact */}
              <div className="border-t border-slate-150 pt-4">
                {user ? (
                  <div className="bg-sky-50/50 border border-sky-100/50 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Đang đặt với tài khoản</p>
                      <p className="text-sm font-bold text-slate-800">{user.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin liên hệ (Khách vãng lai)</p>
                    <input
                      type="text" placeholder="Họ và tên bệnh nhân" required
                      value={guestName} onChange={e => setGuestName(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="tel" placeholder="Số điện thoại" required
                        value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 text-sm"
                      />
                      <input
                        type="email" placeholder="Địa chỉ Email" required
                        value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 text-sm"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      * Lưu ý: Tài khoản bệnh nhân sẽ được tạo tự động dựa trên thông tin trên.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isFormComplete}
              className={`w-full mt-6 p-4 rounded-2xl text-white text-base font-semibold border-none transition-all duration-200 cursor-pointer ${
                isFormComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-sky-500 shadow-[0_8px_20px_rgba(20,184,166,0.3)] hover:shadow-[0_12px_25px_rgba(20,184,166,0.4)] hover:-translate-y-0.5'
                  : 'bg-slate-300 cursor-not-allowed shadow-none'
              }`}
            >
              {bestVoucher
                ? `Xác nhận — Tiết kiệm ${formatVND(bestVoucher.discount)} 🎉`
                : 'Xác nhận đặt lịch'}            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
