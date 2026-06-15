import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Calendar, Clock, User, Stethoscope, CheckCircle2,
  ChevronDown, Star, AlertTriangle, Ticket, Tag, Sparkles,
  TrendingDown, Info, QrCode, Timer, CreditCard
} from 'lucide-react';
import { useAppointmentController } from '../../controllers/useAppointmentController';
import { useVoucherController } from '../../controllers/useVoucherController';
import { useAuth } from '../../context/AuthContext';
import { useDoctors } from '../../hooks/useDoctors';
import { DoctorScheduleModel } from '../../models/DoctorScheduleModel';
import { createPaymentLink, getPaymentStatus } from '../../utils/payos';

// ─── Service categories (static reference data) ───────────────────────────────
// There is no `services` table in Supabase yet, and categories are stable
// reference data, so we keep them local. The `id` values mirror the
// `specialization` codes stored on doctor profiles ("cat-01, cat-02, …") so the
// doctor-matching filter (`doc.specialties.includes(selectedCategory)`) works.
const serviceCategories = [
  { id: 'cat-01', name: 'Khám da liễu tổng quát' },
  { id: 'cat-02', name: 'Điều trị mụn & sẹo rỗ' },
  { id: 'cat-03', name: 'Trị nám, tàn nhang & đốm nâu' },
  { id: 'cat-04', name: 'Trẻ hóa & chống lão hóa da' },
  { id: 'cat-05', name: 'Điều trị viêm da, vảy nến, eczema' },
  { id: 'cat-06', name: 'Thẩm mỹ & chăm sóc da chuyên sâu' },
  { id: 'cat-07', name: 'Soi da & tư vấn AI' },
];

// ─── Parse price string → number ─────────────────────────────────────────────
function parsePriceToNumber(priceStr) {
  if (!priceStr) return 0;
  if (typeof priceStr === 'number') return priceStr;
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
                {rest?.map?.(r => (
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
  if (!originalAmount) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Giá dịch vụ</span>
          <span className="italic text-slate-500 text-[11px]">(Được xác định theo bác sĩ)</span>
        </div>
      </div>
    );
  }

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
export default function BookAppointmentForm({ isOpen, onClose }) {
  const { user } = useAuth();
  const { bookAppointment, getAvailableSlots, isSlotBooked, lockSlot, validateBooking } = useAppointmentController(user?.id);
  const { getAutoApplicable, incrementUsage } = useVoucherController();
  const { doctors, loading: loadingDocs } = useDoctors();

  const [selectedDate, setSelectedDate]         = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDoctor, setSelectedDoctor]     = useState('');
  const [selectedTime, setSelectedTime]         = useState('');
  const [guestName, setGuestName]               = useState('');
  const [guestPhone, setGuestPhone]             = useState('');
  const [guestEmail, setGuestEmail]             = useState('');
  const [errorMessage, setErrorMessage]         = useState('');
  
  // Multistep state
  const [step, setStep]                         = useState('form'); // 'form', 'payment', 'timeout', 'success'
  const isSubmittingRef                         = useRef(false);
  const [timeLeft, setTimeLeft]                 = useState(300); // 5 minutes in seconds
  const [paymentPayload, setPaymentPayload]     = useState(null);
  
  const [payosData, setPayosData]               = useState(null);
  const [orderCode, setOrderCode]               = useState(null);
  const [isPayOSPaid, setIsPayOSPaid]           = useState(false);
  
  const [adminSchedules, setAdminSchedules]     = useState([]);

  // Fetch admin schedules
  useEffect(() => {
    if (isOpen) {
      DoctorScheduleModel.getAllShifts().then(data => setAdminSchedules(data));
    }
  }, [isOpen]);

  // Reset khi modal mở
  useEffect(() => {
    if (isOpen) {
      setSelectedDate('');
      setSelectedCategory('');
      setSelectedDoctor('');
      setSelectedTime('');
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
      setErrorMessage('');
      setStep('form');
      setTimeLeft(300);
      setPaymentPayload(null);
      setPayosData(null);
      setOrderCode(null);
      setIsPayOSPaid(false);
    }
  }, [isOpen]);

  // Handle PayOS Success properly avoiding stale closures
  useEffect(() => {
    if (isPayOSPaid && step === 'payment') {
      setIsPayOSPaid(false);
      handleConfirmPayment();
    }
  }, [isPayOSPaid, step]);

  // PayOS logic
  useEffect(() => {
    if (step !== 'payment') return;

    let isSubscribed = true;
    let newOrderCode = Date.now();
    setOrderCode(newOrderCode);

    const initPayOS = async () => {
      try {
        const desc = `Dat lich ${newOrderCode}`.substring(0, 25);
        const data = await createPaymentLink(newOrderCode, 50000, desc);
        if (isSubscribed) setPayosData(data);
      } catch (err) {
        console.error("PayOS init error:", err);
        if (isSubscribed) {
          setErrorMessage("Không thể tạo mã QR thanh toán lúc này (Lỗi kết nối API PayOS). Vui lòng thử lại sau.");
          setStep('form');
        }
      }
    };
    initPayOS();

    const interval = setInterval(async () => {
      try {
        const statusData = await getPaymentStatus(newOrderCode);
        if (statusData.status === 'PAID') {
          clearInterval(interval);
          if (isSubscribed) setIsPayOSPaid(true);
        }
      } catch (e) {
        // ignore
      }
    }, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [step]);

  // Countdown timer logic
  useEffect(() => {
    if (step === 'payment' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (step === 'payment' && timeLeft === 0) {
      setStep('timeout');
    }
  }, [step, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const categoriesToUse = serviceCategories;
  const selectedCategoryData = categoriesToUse.find(c => c.id === selectedCategory);

  // Ngày tối thiểu = hôm nay
  const todayDate = new Date();
  const minDate = `${todayDate.getFullYear()}-${(todayDate.getMonth() + 1).toString().padStart(2, '0')}-${todayDate.getDate().toString().padStart(2, '0')}`;

  const workingDocs = useMemo(() => {
    if (!selectedDate || !selectedCategory) return [];
    
    return doctors?.filter?.(doc => {
      // Chỉ lấy bác sĩ có chuyên môn phù hợp
      if (!doc.specialties.includes(selectedCategory)) return false;
      // Bác sĩ phải có lịch phân công vào ngày này
      return adminSchedules.some(s => String(s.doctor_id || s.doctorId) === String(doc.user_id || doc.id) && (s.work_date === selectedDate || s.date === selectedDate));
    });
  }, [selectedDate, selectedCategory, doctors, adminSchedules]);

  const filteredDocs = (() => {
    if (!selectedTime) return workingDocs;
    return workingDocs?.filter?.(doc => !isSlotBooked(doc.id, selectedDate, selectedTime));
  })();

  const filteredSlots = (() => {
    // Robust local read to guarantee slots are locked in UI
    const lockedListStr = localStorage.getItem('dermasmart_locked_slots') || '[]';
    let lockedList = [];
    try { lockedList = JSON.parse(lockedListStr); } catch (e) {}
    const activeLocks = lockedList?.filter?.(l => l.lockedUntil > Date.now());

    const isSlotActuallyBooked = (dId, dDate, dTime) => {
      // Check if slot is in the past
      const isPast = (() => {
        if (dDate < minDate) return true;
        if (dDate === minDate) {
          const now = new Date();
          const currentMins = now.getHours() * 60 + now.getMinutes();
          const [h, m] = dTime.split(':').map(Number);
          return (h * 60 + m) <= currentMins;
        }
        return false;
      })();
      if (isPast) return true;

      // Check normal bookings
      const booked = isSlotBooked(dId, dDate, dTime);
      // Check locks
      const locked = activeLocks.some(l => String(l.doctorId) === String(dId) && l.date === dDate && l.time === dTime);
      
      // Check if it fits the doctor's shift
      let outsideShift = true;
      const docShift = adminSchedules.find(s => String(s.doctor_id) === String(dId) && s.work_date === dDate);
      if (docShift) {
         const shiftStart = docShift.start_time.slice(0, 5);
         const shiftEnd = docShift.end_time.slice(0, 5);
         if (dTime >= shiftStart && dTime < shiftEnd) {
             outsideShift = false;
         }
      }

      return booked || locked || outsideShift;
    };

    if (selectedDoctor) {
      const slots = getAvailableSlots(selectedDoctor, selectedDate, adminSchedules);
      return slots?.map?.(s => ({
        ...s,
        isBooked: isSlotActuallyBooked(selectedDoctor, selectedDate, s.time)
      }));
    } else {
      const standardSlots = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
      return standardSlots.map(time => {
        const isAllBooked = !workingDocs.some(doc => !isSlotActuallyBooked(doc.user_id || doc.id, selectedDate, time));
        return {
          time,
          isBooked: isAllBooked || workingDocs.length === 0
        };
      });
    }
  })();

  // Lưu ý: Không ép buộc chọn bác sĩ, hệ thống có thể random assign nếu selectedDoctor rỗng, 
  // nhưng logic backend hiện cần doctorId. Nếu chưa có, lấy tự động 1 bác sĩ đầu tiên trống.
  const finalDoctorId = selectedDoctor || (workingDocs.find(doc => !isSlotBooked(doc.user_id || doc.id, selectedDate, selectedTime))?.user_id) || (workingDocs.find(doc => !isSlotBooked(doc.user_id || doc.id, selectedDate, selectedTime))?.id);
  const finalDoctorData = finalDoctorId ? doctors.find(d => String(d.user_id || d.id) === String(finalDoctorId)) : null;

  // ── Auto-apply voucher ──────────────────────────────────────────────────────
  const originalAmount = finalDoctorData ? parsePriceToNumber(finalDoctorData.consultationFee) : 0;

  const applicableVouchers = useMemo(() => {
    if (!selectedCategory || !originalAmount || !selectedDate) return [];
    return getAutoApplicable(selectedCategory, originalAmount, selectedDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, originalAmount, selectedDate]);

  const bestVoucher = applicableVouchers[0] || null;

  const finalFee = bestVoucher
    ? formatVND(bestVoucher.finalAmount)
    : finalDoctorData?.consultationFee || '300,000 VNĐ';

  if (!isOpen) return null;

  // ── Form completion ─────────────────────────────────────────────────────────
  const isContactInfoComplete = user
    ? true
    : (guestName.trim() && guestPhone.trim() && guestEmail.trim());
  
  const isFormComplete = selectedCategory && selectedDate && selectedTime && isContactInfoComplete && finalDoctorId;

  // ── Submit Form to Payment Step ──────────────────────────────────────────────
  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (!isFormComplete) return;
    setErrorMessage('');

    const bookingPayload = {
      doctorId: finalDoctorId,
      patientId: user ? user.id : null,
      patientName: user ? user.name : guestName,
      patientPhone: user ? (user.phone || guestPhone) : guestPhone,
      patientEmail: user ? (user.email || guestEmail) : guestEmail,
      date: selectedDate,
      time: selectedTime,
      service: selectedCategoryData?.name || 'Khám Da Liễu',
      fee: finalFee,
      originalFee: finalDoctorData?.consultationFee || finalFee,
      voucherId: bestVoucher?.voucher.id || null,
      voucherCode: bestVoucher?.voucher.code || null,
      discount: bestVoucher?.discount || 0,
      notes: user
        ? `Khách hàng đặt lịch khám qua cổng Portal.${bestVoucher ? ' Đã áp dụng ưu đãi.' : ''}`
        : `Khách vãng lai đăng ký qua website.${bestVoucher ? ' Đã áp dụng ưu đãi.' : ''}`,
      bookingFee: 50000,
      paymentStatus: 'Đã thanh toán một phần (Giữ chỗ)',
      status: 'Đang chờ'
    };

    // Validate BEFORE taking the deposit so a patient is never charged for an
    // invalid booking (past slot, slot just taken, >2 upcoming, etc.).
    const validation = await validateBooking(bookingPayload);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      setSelectedTime('');
      return;
    }

    setPaymentPayload(bookingPayload);
    setStep('payment');
    setTimeLeft(300); // 5 minutes
    
    // Lock slot immediately for 5 minutes during the payment process
    try {
      const lockedListStr = localStorage.getItem('dermasmart_locked_slots') || '[]';
      let lockedList = [];
      try { lockedList = JSON.parse(lockedListStr); } catch (e) {}
      
      const filteredList = lockedList?.filter?.(
        l => !(String(l.doctorId) === String(finalDoctorId) && l.date === selectedDate && l.time === selectedTime)
      );
      filteredList.push({
        doctorId: finalDoctorId,
        date: selectedDate,
        time: selectedTime,
        lockedUntil: Date.now() + 5 * 60 * 1000 // 5 minutes
      });
      localStorage.setItem('dermasmart_locked_slots', JSON.stringify(filteredList));
      
      lockSlot(finalDoctorId, selectedDate, selectedTime, 5);
    } catch (err) {
      console.error('Error locking slot immediately:', err);
    }
  };

  // ── Confirm Payment ─────────────────────────────────────────────────────────
  const handleConfirmPayment = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    
    const result = await bookAppointment(paymentPayload);
    if (result.success) {
      if (bestVoucher) {
        incrementUsage(bestVoucher.voucher.id);
      }
      setStep('success');
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Thanh toán phí giữ chỗ thành công!', type: 'success' }
      }));
      setTimeout(() => {
        isSubmittingRef.current = false;
        onClose();
      }, 3500);
    } else {
      isSubmittingRef.current = false;
      setErrorMessage(result.error);
      setStep('form');
    }
  };

  // ── Cancel Payment ────────────────────────────────────────────────────────────
  const handleCancelPayment = () => {
    setErrorMessage('Giao dịch đã bị hủy. Khung giờ này vẫn đang bị khóa trong thời gian thanh toán (tối đa 5 phút).');
    setSelectedTime('');
    setStep('form');
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm font-sans"
      onClick={step === 'payment' ? undefined : onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-xl backdrop-blur-3xl bg-white/95 border border-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-[2.5rem] p-8 relative max-h-[92vh] overflow-y-auto light-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        {step !== 'payment' && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 bg-transparent border-none text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 p-2 rounded-full flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ── Step 1: Form ── */}
        <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.form 
            key="form"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onSubmit={handleProceedToPayment}
          >
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
              {/* 1. Date */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <Calendar className="w-4 h-4 text-teal-500" />
                  Bước 1: Chọn ngày khám
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={minDate}
                  required
                  onChange={e => { setSelectedDate(e.target.value); setSelectedTime(''); setSelectedDoctor(''); }}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 transition-colors cursor-pointer text-sm"
                />
              </div>

              {/* 2. Category */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <Stethoscope className="w-4 h-4 text-emerald-500" />
                  Bước 2: Chọn nhu cầu khám
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={e => { setSelectedCategory(e.target.value); setSelectedTime(''); setSelectedDoctor(''); }}
                    required
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 transition-colors appearance-none cursor-pointer text-sm pr-10"
                  >
                    <option value="">-- Chọn nhóm bệnh / nhu cầu --</option>
                    {categoriesToUse.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 3. Parallel Doctor & Time */}
              <AnimatePresence>
                {selectedDate && selectedCategory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-5 overflow-hidden"
                  >
                    {workingDocs.length === 0 ? (
                      <div className="text-sm text-rose-500 font-semibold flex items-center gap-2 justify-center py-4">
                        <AlertTriangle className="w-4 h-4" /> Không có bác sĩ chuyên khoa này làm việc vào ngày đã chọn.
                      </div>
                    ) : (
                      <>
                        <div className="text-center bg-sky-100 text-sky-800 text-xs font-bold py-1.5 rounded-full mb-2 border border-sky-200">
                          Bước 3: Chọn bác sĩ hoặc chọn khung giờ bạn muốn
                        </div>
                        {/* Doctor Select */}
                        <div>
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            <User className="w-4 h-4 text-sky-500" />
                            Danh sách bác sĩ {selectedTime && "(Còn trống khung giờ trên)"}
                          </label>
                          <div className="flex flex-col gap-2">
                            {loadingDocs ? (
                              <div className="text-sm text-slate-500 italic p-3 text-center border rounded-xl border-slate-200">
                                <span className="animate-pulse">Đang tải danh sách bác sĩ...</span>
                              </div>
                            ) : (
                              <>
                                {filteredDocs?.map?.(doc => (
                                  <div
                                    key={doc.id}
                                    onClick={() => setSelectedDoctor(doc.id === selectedDoctor ? '' : doc.id)}
                                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                                      selectedDoctor === doc.id
                                        ? 'bg-sky-50 border-sky-400 shadow-sm shadow-sky-500/10'
                                        : 'bg-white border-slate-200 hover:border-sky-300'
                                    }`}
                                  >
                                    <img src={doc.image} alt={doc.name} className="w-10 h-10 rounded-lg object-cover" />
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-bold truncate ${selectedDoctor === doc.id ? 'text-sky-700' : 'text-slate-700'}`}>
                                        {doc.name}
                                      </p>
                                      <p className="text-[10px] text-slate-500">{doc.title}</p>
                                    </div>
                                    {selectedDoctor === doc.id && <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0" />}
                                  </div>
                                ))}
                                {filteredDocs.length === 0 && selectedTime && (
                                  <div className="text-xs text-slate-500 italic p-2 text-center bg-white border border-slate-100 rounded-lg">
                                    Không có bác sĩ nào trống khung giờ này.
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Time Select */}
                        <div>
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            Các khung giờ {selectedDoctor ? "(Của bác sĩ này)" : "(Có thể đặt)"}
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {filteredSlots?.map?.(slot => (
                               <button
                                key={slot.time}
                                type="button"
                                disabled={slot.isBooked}
                                onClick={() => setSelectedTime(slot.time === selectedTime ? '' : slot.time)}
                                className={`px-2 py-2.5 rounded-xl text-xs font-bold text-center cursor-pointer border transition-all ${
                                  slot.isBooked
                                    ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed line-through'
                                    : selectedTime === slot.time
                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                                }`}
                              >
                                {slot.time}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Auto-apply Voucher Banner ── */}
              <AnimatePresence>
                {selectedCategory && selectedDate && applicableVouchers.length > 0 && (
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
                {selectedCategory && selectedDate && applicableVouchers.length === 0 && (
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
                {selectedCategory && (
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
              Tiếp tục thanh toán giữ chỗ (50.000 VNĐ)
            </button>
          </motion.form>
        )}

        {/* ── Step 2: Payment ── */}
        {step === 'payment' && (
          <motion.div 
            key="payment"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Thanh toán phí giữ chỗ</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm">
              Để đảm bảo slot khám, vui lòng thanh toán phí giữ chỗ <span className="font-bold text-slate-800">50,000 VNĐ</span>. Số tiền này sẽ được trừ vào chi phí khám bệnh thực tế.
            </p>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-3xl mb-6 shadow-sm relative overflow-hidden group w-full max-w-xs">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-sky-400"></div>
              {payosData ? (
                <img 
                  src={`https://img.vietqr.io/image/${payosData.bin}-${payosData.accountNumber}-compact2.png?amount=${payosData.amount}&addInfo=${encodeURIComponent(payosData.description)}&accountName=${encodeURIComponent(payosData.accountName)}`}
                  alt="QR Code Thanh Toán" 
                  className="w-full h-auto rounded-xl mix-blend-multiply"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              )}
              {orderCode && <div className="text-[10px] text-center text-slate-400 mt-2">Mã đơn: {orderCode}</div>}
            </div>

            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl mb-6 w-full justify-center">
              <Timer className={`w-5 h-5 ${timeLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`} />
              <div className="text-sm font-semibold text-amber-800">
                Thời gian giữ slot: <span className={`font-black text-lg ${timeLeft < 60 ? 'text-rose-600' : 'text-amber-600'}`}>{formatTime(timeLeft)}</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleCancelPayment}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors border-none cursor-pointer"
            >
              Hủy giao dịch
            </button>
          </motion.div>
        )}

        {/* ── Step 3: Timeout ── */}
        {step === 'timeout' && (
          <motion.div 
            key="timeout"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-4">
              <Timer className="w-10 h-10 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Hết thời gian giữ chỗ!</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
              Bạn đã quá 5 phút để thanh toán. Slot hẹn này sẽ bị khóa tạm thời trong 3 phút để nhường cho bệnh nhân khác.
              <br/><br/>
              Vui lòng thử lại sau hoặc chọn một slot trống khác!
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 border-none cursor-pointer bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Đóng lại
            </button>
          </motion.div>
        )}

        {/* ── Step 4: Success ── */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}>
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Đặt lịch thành công!</h3>
            <div className="mb-3 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full">
              <Ticket className="w-3.5 h-3.5" />
              Đã thanh toán cọc 50,000 VNĐ
            </div>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              Yêu cầu đặt lịch đã được xác nhận.{' '}
              {user
                ? 'Xem và quản lý lịch khám tại trang cá nhân.'
                : 'Lễ tân sẽ gọi điện xác nhận sớm nhất.'}
            </p>
            {bestVoucher && originalAmount > 0 ? (
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm space-y-1.5 text-left w-full max-w-xs mx-auto">
                <div className="flex justify-between font-black text-slate-900 border-b border-slate-200 pb-1.5 mb-1.5">
                  <span>Dự kiến thanh toán thêm</span>
                  <span className="text-emerald-600">{formatVND(Math.max(0, bestVoucher.finalAmount - 50000))}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Chi phí gốc (bác sĩ)</span>
                  <span>{formatVND(originalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold text-[11px]">
                  <span>Voucher giảm giá</span>
                  <span>-{formatVND(bestVoucher.discount)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold text-[11px]">
                  <span>Đã thanh toán (Cọc)</span>
                  <span>-50.000 VNĐ</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm space-y-1.5 text-left w-full max-w-xs mx-auto">
                <div className="flex justify-between font-black text-slate-900 border-b border-slate-200 pb-1.5 mb-1.5">
                  <span>Dự kiến thanh toán thêm</span>
                  <span className="text-emerald-600">{formatVND(Math.max(0, originalAmount - 50000))}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Chi phí gốc (bác sĩ)</span>
                  <span>{formatVND(originalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold text-[11px]">
                  <span>Đã thanh toán (Cọc)</span>
                  <span>-50.000 VNĐ</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
