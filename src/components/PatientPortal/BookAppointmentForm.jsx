import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Calendar, Clock, ClockAlert, User, Stethoscope, CheckCircle2,
  ChevronDown, Star, AlertTriangle, Ticket, Tag, Sparkles,
  TrendingDown, Info, QrCode, Timer, CreditCard
} from 'lucide-react';
import { useAppointmentController } from '../../controllers/useAppointmentController';
import { useAuth } from '../../context/AuthContext';
import { useDoctors } from '../../hooks/useDoctors';
import { DoctorScheduleModel } from '../../models/DoctorScheduleModel';
import { createPaymentLink, getPaymentStatus } from '../../utils/payos';
import GlassSelect from '../common/GlassSelect';
import GlassDatePicker from '../common/GlassDatePicker';

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

// ─── Price Summary ────────────────────────────────────────────────────────────
function PriceSummary({ originalAmount }) {
  if (!originalAmount) {
    return (
      <div className="bg-white/30 border border-white/40 rounded-2xl p-3.5 space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Giá dịch vụ</span>
          <span className="italic text-slate-700 text-[11px]">(Được xác định theo bác sĩ)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/30 border border-white/40 rounded-2xl p-3.5 space-y-2">
      <div className="flex justify-between text-xs font-semibold text-slate-600">
        <span>Giá dịch vụ</span>
        <span>{formatVND(originalAmount)}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BookAppointmentForm({ isOpen, onClose }) {
  const { user } = useAuth();
  const { appointments, bookAppointment, getAvailableSlots, isSlotBooked, lockSlot, holdSlot, validateBooking } = useAppointmentController(user?.id);
  const isReturning = user && appointments && appointments.length > 0;
  const { doctors, loading: loadingDocs } = useDoctors();

  const [selectedDate, setSelectedDate]         = useState('');
  const [selectedCategory, setSelectedCategory] = useState('cat-01');
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
      setSelectedCategory('cat-01');
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
    if (!selectedDate) return [];
    
    return doctors?.filter?.(doc => {
      // Bác sĩ phải có lịch phân công vào ngày này
      return adminSchedules.some(s => String(s.doctor_id || s.doctorId) === String(doc.user_id || doc.id) && (s.work_date === selectedDate || s.date === selectedDate) && (s.status === 'Đã xác nhận' || s.status === 'Đã phân công'));
    });
  }, [selectedDate, doctors, adminSchedules]);

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
      const docShifts = adminSchedules.filter(s => String(s.doctor_id || s.doctorId) === String(dId) && (s.work_date === dDate || s.date === dDate));
      if (docShifts.length > 0) {
        const fitsAnyShift = docShifts.some(shift => {
          const shiftStart = (shift.start_time || shift.startTime || '').slice(0, 5);
          const shiftEnd = (shift.end_time || shift.endTime || '').slice(0, 5);
          return dTime >= shiftStart && dTime < shiftEnd;
        });
        if (fitsAnyShift) {
          outsideShift = false;
        }
      }

      return booked || locked || outsideShift;
    };

    let slotsToDisplay = [];
    if (selectedDoctor) {
      const slots = getAvailableSlots(selectedDoctor, selectedDate, adminSchedules);
      slotsToDisplay = slots?.map?.(s => ({
        ...s,
        isBooked: isSlotActuallyBooked(selectedDoctor, selectedDate, s.time)
      })) || [];
    } else {
      // Find all unique slots available for any working doctor today
      const allSlotsMap = new Map();
      workingDocs.forEach(doc => {
         const docId = doc.user_id || doc.id;
         const docSlots = getAvailableSlots(docId, selectedDate, adminSchedules);
         docSlots.forEach(s => {
             if (!allSlotsMap.has(s.time)) {
                 allSlotsMap.set(s.time, { time: s.time, isBooked: true });
             }
             // If AT LEAST ONE doctor is free for this slot, it is NOT booked globally
             if (!isSlotActuallyBooked(docId, selectedDate, s.time)) {
                 allSlotsMap.get(s.time).isBooked = false;
             }
         });
      });
      slotsToDisplay = Array.from(allSlotsMap.values());
      slotsToDisplay.sort((a, b) => a.time.localeCompare(b.time));
    }
    
    // Chỉ hiện các khung giờ có thể đặt được và loại bỏ khung giờ nghỉ (11:00 & 11:30)
    return slotsToDisplay.filter(slot => {
      const t = slot.time.trim();
      return t !== '11:00' && t !== '11:30' && t !== '11:00 AM' && t !== '11:30 AM';
    });
  })();

  // Lưu ý: Không ép buộc chọn bác sĩ, hệ thống có thể random assign nếu selectedDoctor rỗng, 
  // nhưng logic backend hiện cần doctorId. Nếu chưa có, lấy tự động 1 bác sĩ đầu tiên trống.
  const finalDoctorId = selectedDoctor || (workingDocs.find(doc => !isSlotBooked(doc.user_id || doc.id, selectedDate, selectedTime))?.user_id) || (workingDocs.find(doc => !isSlotBooked(doc.user_id || doc.id, selectedDate, selectedTime))?.id);
  const finalDoctorData = finalDoctorId ? doctors.find(d => String(d.user_id || d.id) === String(finalDoctorId)) : null;

  // ── Service Fee ──
  const originalAmount = finalDoctorData ? parsePriceToNumber(finalDoctorData.consultationFee) : 0;
  const finalFee = finalDoctorData?.consultationFee || '300,000 VNĐ';

  if (!isOpen) return null;

  // ── Form completion ─────────────────────────────────────────────────────────
  const isContactInfoComplete = user
    ? true
    : (guestName.trim() && guestPhone.trim() && guestEmail.trim());
  
  const isFormComplete = selectedDate && selectedTime && isContactInfoComplete && finalDoctorId;

  // ── Submit Form to Payment Step ──────────────────────────────────────────────
  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (!isFormComplete || isSubmittingRef.current) return;
    
    isSubmittingRef.current = true;
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
      notes: user
        ? `Khách hàng đặt lịch khám qua cổng Portal.`
        : `Khách vãng lai đăng ký qua website.`,
      bookingFee: 50000,
      paymentStatus: 'Đã thanh toán một phần (Giữ chỗ)',
      status: 'Đã xác nhận'
    };

    // Validate BEFORE taking the deposit so a patient is never charged for an
    // invalid booking (past slot, slot just taken, >2 upcoming, etc.).
    const validation = await validateBooking(bookingPayload);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      setSelectedTime('');
      isSubmittingRef.current = false;
      return;
    }

    try {
      const holdApt = await holdSlot(bookingPayload);
      if (holdApt) {
        setPaymentPayload({
          ...bookingPayload,
          holdAptId: holdApt.appointment_id || holdApt.id
        });
      } else {
        setPaymentPayload(bookingPayload);
      }
      
      // Also lock locally for immediate UI feedback
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
      setPaymentPayload(bookingPayload);
    }
    
    isSubmittingRef.current = false;
    setStep('payment');
    setTimeLeft(300); // 5 minutes
  };

  // ── Confirm Payment ─────────────────────────────────────────────────────────
  const handleConfirmPayment = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    
    const result = await bookAppointment(paymentPayload);
    if (result.success) {
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-md font-sans"
      onClick={step === 'payment' ? undefined : onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-[95vw] md:w-[85vw] lg:w-[80vw] max-w-6xl bg-white/60 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        {step !== 'payment' && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 bg-transparent border-none text-slate-600 hover:text-slate-700 hover:bg-slate-100/50 p-2 rounded-full flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ── Step 1: Form ── */}
        <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.form 
            key="form"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onSubmit={handleProceedToPayment}
          >
            {/* Header */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-1 tracking-tight">Đặt lịch khám mới</h2>
              <p className="text-slate-700 text-sm">Điền đầy đủ thông tin để đặt chỗ khám tại DermaSmart</p>
            </div>

            {/* Error */}
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div><span className="font-bold">Lỗi đặt lịch:</span> {errorMessage}</div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* ─── LEFT COLUMN: Doctor, Date & Contact ─── */}
              <div className="space-y-4">
                {/* 0. Date — custom Liquid Glass calendar (replaces native date input) */}
                <div className="relative z-[60]">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                      <Calendar className="w-4 h-4 text-teal-500" />
                      Bước 1: Chọn ngày khám
                    </label>
                    <GlassDatePicker
                      value={selectedDate}
                      min={minDate}
                      onChange={(d) => { setSelectedDate(d); setSelectedTime(''); }}
                    />
                  </div>
                </div>

                {/* 1. Doctor — visible to ALL users (guests + logged-in) */}
                <div className="relative z-[50]">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                      <User className="w-4 h-4 text-indigo-500" />
                      Bước 2: Chọn bác sĩ
                    </label>
                    <GlassSelect
                      value={selectedDoctor}
                      onChange={(v) => { setSelectedDoctor(v); setSelectedTime(''); }}
                      placeholder="Tự động chọn bác sĩ phù hợp"
                      buttonClassName="p-4 text-base text-slate-900 font-semibold"
                      options={[
                        { value: '', label: 'Không chọn — hệ thống tự sắp xếp' },
                        ...(doctors || []).map(doc => ({
                          value: doc.user_id || doc.id,
                          label: `${/^(BS|ThS|TS|PGS|GS|CN|KTV)/i.test((doc.name || '').trim()) ? '' : 'BS. '}${doc.name}${doc.specialties && doc.specialties.length > 0 ? ` (${doc.specialties.join(', ')})` : ''}`,
                        })),
                      ]}
                    />
                  </div>
                </div>

                {/* 5. Contact */}
                <div className="relative z-[40]">
                  <div className="border-t border-slate-150 pt-4">
                    {user ? (
                      <div className="bg-sky-50/50 border border-sky-100/50 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Đang đặt với tài khoản</p>
                          <p className="text-sm font-bold text-slate-800">{user.name}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm font-bold text-slate-900 uppercase tracking-wider">Thông tin liên hệ (Khách vãng lai)</p>
                        <input
                          type="text" placeholder="Họ và tên bệnh nhân" required
                          value={guestName} onChange={e => setGuestName(e.target.value)}
                          className="w-full p-4 rounded-xl bg-white/50 border border-white/40 text-slate-900 font-medium placeholder-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-sm"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="tel" placeholder="Số điện thoại" required
                            value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
                            className="w-full p-4 rounded-xl bg-white/50 border border-white/40 text-slate-900 font-medium placeholder-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-sm"
                          />
                          <input
                            type="email" placeholder="Địa chỉ Email" required
                            value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
                            className="w-full p-4 rounded-xl bg-white/50 border border-white/40 text-slate-900 font-medium placeholder-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-sm"
                          />
                        </div>
                        <p className="text-[10px] text-slate-600 italic">
                          * Lưu ý: Tài khoản bệnh nhân sẽ được tạo tự động dựa trên thông tin trên.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── RIGHT COLUMN: Time Slots, Price & Submit ─── */}
              <div className="flex flex-col gap-4">
                {/* 2. Time Slot Picker — plain conditional. AnimatePresence mode="wait"
                    deadlocked the placeholder→slots swap under React.StrictMode (the exit
                    callback gets dropped on the double-invoke), leaving the time picker stuck. */}
                {selectedDate ? (
                    <motion.div
                      key="slots"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.25 }}
                      className="bg-white/30 border border-white/40 rounded-2xl p-5 space-y-5"
                    >
                      {workingDocs.length === 0 ? (
                        <div className="text-sm text-rose-500 font-semibold flex items-center gap-2 justify-center py-4">
                          <AlertTriangle className="w-4 h-4" /> Không có bác sĩ làm việc vào ngày đã chọn.
                        </div>
                      ) : selectedDoctor && !workingDocs.some(d => String(d.user_id || d.id) === String(selectedDoctor)) ? (
                        <div className="text-sm text-rose-500 font-semibold flex items-center gap-2 justify-center py-4">
                          <AlertTriangle className="w-4 h-4" /> Bác sĩ bạn chọn không làm việc vào ngày này. Vui lòng chọn ngày khác hoặc bỏ chọn bác sĩ.
                        </div>
                      ) : (
                        <>
                          <div className="text-center bg-sky-100 text-sky-800 text-xs font-bold py-1.5 rounded-full mb-2 border border-sky-200">
                            Bước 3: Chọn giờ khám
                          </div>

                          {/* Time Select */}
                          <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                              <Clock className="w-4 h-4 text-amber-500" />
                              Các khung giờ có thể đặt
                            </label>
                            <div className="grid grid-cols-4 gap-3 mt-4">
                              {filteredSlots?.map?.(slot => (
                                <button
                                  key={slot.time}
                                  type="button"
                                  disabled={slot.isBooked}
                                  onClick={() => setSelectedTime(slot.time === selectedTime ? '' : slot.time)}
                                  className={`py-2 text-sm font-semibold rounded-xl text-center cursor-pointer border transition-all ${
                                    slot.isBooked
                                      ? 'bg-slate-100/50 border-white/40 text-slate-400 cursor-not-allowed line-through'
                                      : selectedTime === slot.time
                                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_8px_16px_rgba(16,185,129,0.3)] scale-105'
                                      : 'bg-white/40 border-white/50 text-gray-700 hover:bg-white/70 hover:border-emerald-400 hover:shadow-md'
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
                  ) : (
                    <motion.div
                      key="time-placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-white/20 border border-dashed border-white/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-600 gap-3 min-h-[180px]"
                    >
                      <Clock className="w-8 h-8 opacity-40" />
                      <p className="text-sm font-medium max-w-[220px]">Chọn ngày khám ở cột bên trái để xem các khung giờ trống.</p>
                    </motion.div>
                  )}

                {/* Lateness policy warning */}
                <div className="bg-amber-100/80 border border-amber-500/50 rounded-xl p-4 mt-4 flex items-start gap-3">
                  <ClockAlert className="text-amber-600 shrink-0" size={20} />
                  <p className="text-base text-amber-900 font-bold">
                    Nếu quý khách đến trễ quá 30 phút so với giờ hẹn, lịch khám sẽ tự động bị hủy và ghi nhận vắng mặt.
                  </p>
                </div>

                {/* ── Price Summary ── */}
                <AnimatePresence>
                  {selectedCategory && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <PriceSummary originalAmount={originalAmount} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!isFormComplete || isSubmittingRef.current}
                  className={`w-full mt-auto py-4 text-lg font-bold rounded-2xl text-white border-none transition-all duration-200 cursor-pointer ${
                    isFormComplete && !isSubmittingRef.current
                      ? 'bg-gradient-to-r from-emerald-500 to-sky-500 shadow-[0_8px_20px_rgba(20,184,166,0.3)] hover:shadow-[0_12px_25px_rgba(20,184,166,0.4)] hover:-translate-y-0.5'
                      : 'bg-slate-300 cursor-not-allowed shadow-none'
                  }`}
                >
                  Tiếp tục thanh toán giữ chỗ (50.000 VNĐ)
                </button>
              </div>
            </div>
          </motion.form>
        )}

        {/* ── Step 2: Payment ── */}
        {step === 'payment' && (
          <motion.div 
            key="payment"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Thanh toán phí giữ chỗ</h3>
            <p className="text-sm text-slate-700 mb-6 max-w-sm">
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
              {orderCode && <div className="text-[10px] text-center text-slate-600 mt-2">Mã đơn: {orderCode}</div>}
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
            <p className="text-sm text-slate-700 max-w-sm mb-6 leading-relaxed">
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
            <p className="text-sm text-slate-700 max-w-sm leading-relaxed">
              Yêu cầu đặt lịch đã được xác nhận.{' '}
              {user
                ? 'Xem và quản lý lịch khám tại trang cá nhân.'
                : 'Lễ tân sẽ gọi điện xác nhận sớm nhất.'}
            </p>
            {(
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm space-y-1.5 text-left w-full max-w-xs mx-auto">
                <div className="flex justify-between font-black text-slate-900 border-b border-slate-200 pb-1.5 mb-1.5">
                  <span>Dự kiến thanh toán thêm</span>
                  <span className="text-emerald-600">{formatVND(Math.max(0, originalAmount - 50000))}</span>
                </div>
                <div className="flex justify-between text-slate-700 text-[11px]">
                  <span>Chi phí gốc (bác sĩ)</span>
                  <span>{formatVND(originalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-700 font-semibold text-[11px]">
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
