import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Stethoscope,
  CreditCard,
  X,
  RefreshCw,
  MessageSquare,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Star,
  FileText,
  Pill,
  ClipboardList,
  Edit3,
  QrCode,
  Timer,
  Receipt,
  Tag
} from 'lucide-react';
import { useAppointmentController } from '../../controllers/useAppointmentController';
import { useFeedbackController } from '../../controllers/useFeedbackController';
import { useDoctors } from '../../hooks/useDoctors';
import GlassDatePicker from '../common/GlassDatePicker';
import GlassSelect from '../common/GlassSelect';
import { parseFee } from '../Receptionist/receptionistData';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { AppointmentModel } from '../../models/AppointmentModel';
import { MedicalRecordModel } from '../../models/MedicalRecordModel';
import { PrescriptionModel } from '../../models/PrescriptionModel';
import { createPaymentLink, getPaymentStatus } from '../../utils/payos';
import FeedbackFormModal from './FeedbackFormModal';
import MedicalRecordDetailModal from './MedicalRecordDetailModal';
import InvoiceDetailModal from './InvoiceDetailModal';

// ─── Status Badge Component ─────────────────────────────────────────────────

const STATUS_STYLES = {
  'Đặt lịch thành công': 'bg-slate-800 text-white border border-slate-900',
  'Đang chờ khám': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Đang khám': 'bg-orange-50 text-orange-700 border border-orange-200',
  'Đã hủy': 'bg-rose-50 text-rose-700 border border-rose-200',
  'Đã không đến': 'bg-violet-50 text-violet-700 border border-violet-200',
  'Đã thanh toán': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  // Legacy / internal fallbacks
  'Đã khám': 'bg-blue-50 text-blue-700 border border-blue-200',
  'Đã xác nhận': 'bg-slate-800 text-white border border-slate-900',
  'Chờ xác nhận': 'bg-slate-800 text-white border border-slate-900',
  'Đang chờ': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Reviewed': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
};

const PAYMENT_STYLES = {
  'Đã thanh toán': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Chưa thanh toán': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Chờ xác nhận': 'bg-sky-50 text-sky-700 border border-sky-200',
};

function StatusBadge({ text, type = 'status' }) {
  const styles = type === 'status' ? STATUS_STYLES : PAYMENT_STYLES;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${styles[text] || 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
      {text}
    </span>
  );
}

// ─── Appointment Card Component ──────────────────────────────────────────────

function AppointmentCard({ apt, index, isUpcoming, isOverdue, onCancel, onReschedule, onViewFeedback, onWriteFeedback, onViewInvoice, existingFeedback }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition-all group"
    >
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {apt.date}
        </span>
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {apt.time}
        </span>
        <StatusBadge text={isOverdue ? 'Đã quá hẹn' : (apt.status === 'Đang chờ' ? 'Đang khám' : (isUpcoming ? 'Chưa khám' : apt.status))} type="status" />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Stethoscope className="w-4 h-4 text-emerald-500 shrink-0" />
        <span className="text-sm font-bold text-slate-800">{apt.doctorName}</span>
        <span className="text-xs text-slate-400">•</span>
        <span className="text-xs text-slate-500 font-medium">{apt.service}</span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-sky-500" />
          Phí khám: {apt.fee}
        </span>
        {apt.paymentStatus && <StatusBadge text={apt.paymentStatus} type="payment" />}
        {/* Show star rating if feedback exists */}
        {existingFeedback && (
          <span className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`w-3 h-3 ${s <= existingFeedback.overallRating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
            ))}
          </span>
        )}
        {/* Voucher badge — chỉ hiện tên ưu đãi, không hiện mã */}
        {apt.voucherId && apt.discount > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Tag className="w-3 h-3" /> Ưu đãi -{Number(apt.discount).toLocaleString('vi-VN')}đ
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {isUpcoming && apt.status !== 'Đã hủy' && (
          <>
            <button
              onClick={() => onCancel(apt)}
              className="text-rose-500 hover:bg-rose-50 border border-rose-200 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer bg-white flex items-center gap-1.5"
            >
              <X className="w-3 h-3" />
              Hủy lịch
            </button>
            {apt.rescheduleCount >= 2 ? (
              <span 
                className="text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed select-none opacity-60" 
                title="Đã đổi lịch tối đa 2 lần. Vui lòng liên hệ Lễ tân."
              >
                <RefreshCw className="w-3 h-3 text-slate-400" />
                Đổi lịch (Hết lượt)
              </span>
            ) : (
              <button
                onClick={() => onReschedule(apt)}
                className="text-sky-600 hover:bg-sky-50 border border-sky-200 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer bg-white flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                Đổi lịch
              </button>
            )}
          </>
        )}
        {!isUpcoming && (apt.status === 'Đã khám' || apt.status === 'Reviewed' || apt.status === 'Đã thanh toán') && (
          <>
            {existingFeedback ? (
              <button
                onClick={() => onViewFeedback(apt)}
                className="text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer bg-white flex items-center gap-1.5"
              >
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                Xem đánh giá
              </button>
            ) : (
              <button
                onClick={() => onWriteFeedback(apt)}
                className="text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer bg-white flex items-center gap-1.5"
              >
                <Edit3 className="w-3 h-3" />
                Viết đánh giá
              </button>
            )}
            <button
              onClick={() => onViewInvoice(apt)}
              className="text-sky-600 hover:bg-sky-50 border border-sky-200 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer bg-white flex items-center gap-1.5"
            >
              <Receipt className="w-3 h-3" />
              Hóa đơn
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Reschedule Confirmation Modal ───────────────────────────────────────────

function RescheduleModal({ apt, onClose, onConfirm, rescheduleError }) {
  const { getAvailableSlots, isWithin24h, lockSlot } = useAppointmentController();
  const { doctors } = useDoctors();
  // Surcharge applies only when the CURRENT appointment is within 24h of now.
  const within24h = isWithin24h(apt.date || apt.appointment_date, apt.time || apt.start_time);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  // Reschedule may now ALSO move the booking to a different doctor. Defaults to
  // the appointment's current doctor so "date only" changes still work.
  const [newDoctor, setNewDoctor] = useState(String(apt.doctorId || apt.doctor_id || ''));
  
  // Multistep state
  const [step, setStep] = useState('form');
  const isSubmittingRef = useRef(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [orderCode, setOrderCode] = useState(null);
  const [payosData, setPayosData] = useState(null);
  const [isPayOSPaid, setIsPayOSPaid] = useState(false);
  const [localError, setLocalError] = useState('');

  const todayDate = new Date();
  const minDate = `${todayDate.getFullYear()}-${(todayDate.getMonth() + 1).toString().padStart(2, '0')}-${todayDate.getDate().toString().padStart(2, '0')}`;

  const [adminSchedules, setAdminSchedules] = useState([]);
  
  useEffect(() => {
    import('../../models/DoctorScheduleModel').then(module => {
      module.DoctorScheduleModel.getAllShifts().then(data => setAdminSchedules(data));
    });
  }, []);

  // Doctor dropdown options (Liquid Glass <GlassSelect>). Pulled live so the
  // patient can switch to any active doctor, not just the original one.
  const doctorOptions = (doctors || []).map((d) => ({
    value: String(d.id || d.user_id),
    label: d.name,
  }));

  // The selector now drives everything off the CHOSEN doctor (`newDoctor`),
  // falling back to the original until the patient picks one.
  const docId = newDoctor || apt.doctorId || apt.doctor_id;
  const selectedDoctorData = (doctors || []).find((d) => String(d.id || d.user_id) === String(docId));

  let isDoctorWorkingOnDay = true;
  if (docId && newDate) {
    isDoctorWorkingOnDay = adminSchedules.some(s => String(s.doctor_id || s.doctorId) === String(docId) && (s.work_date === newDate || s.date === newDate) && s.status === 'Đã xác nhận');
  }

  const slots = (docId && newDate && isDoctorWorkingOnDay)
    ? getAvailableSlots(docId, newDate, adminSchedules)
    : [];

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
        const desc = `Doi lich ${newOrderCode}`.substring(0, 25);
        const data = await createPaymentLink(newOrderCode, 50000, desc);
        if (isSubscribed) setPayosData(data);
      } catch (err) {
        console.error("PayOS init error:", err);
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

  const formatTimeLeft = () => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleProceedToPayment = () => {
    if (newDate && newTime && isDoctorWorkingOnDay) {
      if (!within24h) {
        // Free reschedule (not within 24h of the current appointment)
        handleConfirmPayment();
      } else {
        // Within 24h → requires the 50k surcharge payment
        setLocalError('');
        setStep('payment');
        setTimeLeft(300);

        // Lock slot immediately for 5 minutes during the payment process
        try {
          const lockedListStr = localStorage.getItem('dermasmart_locked_slots') || '[]';
          let lockedList = [];
          try { lockedList = JSON.parse(lockedListStr); } catch (e) {}
          
          const filteredList = lockedList.filter(l => !(String(l.doctorId) === String(docId) && l.date === newDate && l.time === newTime));
          filteredList.push({
            doctorId: docId,
            date: newDate,
            time: newTime,
            lockedUntil: Date.now() + 5 * 60 * 1000 // 5 minutes
          });
          localStorage.setItem('dermasmart_locked_slots', JSON.stringify(filteredList));
          
          if (lockSlot) {
            lockSlot(docId, newDate, newTime, 5);
          }
        } catch (err) {
          console.error('Error locking slot immediately:', err);
        }
      }
    }
  };

  const handleConfirmPayment = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // ── API observability: trace the exact payload dispatched to Supabase ──
    console.log('[HungBB-Dev] RESCHEDULE PAYLOAD INITIATED:', {
      originalAppointmentId: apt.id ?? apt.appointment_id,
      newDoctorId: docId,
      newDate: newDate,
      newTime: newTime,
    });

    try {
      const res = await onConfirm(newDate, newTime, docId);
      if (res && res.success) {
        console.log('[HungBB-Dev] RESCHEDULE SUCCESS!');
        setStep('success');
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: within24h ? 'Thanh toán phụ phí thành công!' : 'Đổi lịch hẹn thành công!', type: 'success' }
        }));
        setTimeout(() => {
          isSubmittingRef.current = false;
          onClose();
        }, 3500);
      } else {
        // Controller resolved with a handled failure (validation, conflict, …).
        const message = res?.error || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
        console.error('[HungBB-Dev] RESCHEDULE FAILED:', message);
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message, type: 'error' }
        }));
        isSubmittingRef.current = false;
        setLocalError(message);
        setStep('form');
      }
    } catch (error) {
      // Unexpected throw (network/Supabase exception).
      console.error('[HungBB-Dev] RESCHEDULE FAILED:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: error?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.', type: 'error' }
      }));
      isSubmittingRef.current = false;
      setLocalError(error?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
      setStep('form');
    }
  };

  const handleCancelPayment = () => {
    setLocalError('Giao dịch thanh toán phụ phí đã bị hủy.');
    setNewTime('');
    setStep('form');
  };

  // Rendered through a portal to document.body so the high-blur overlay and the
  // glass card always escape any transformed/overflow-hidden ancestor (no z-index
  // clipping) — the Liquid Glass modal baseline.
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-md font-sans"
      onClick={step === 'payment' ? undefined : onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative z-[10000] w-[95%] sm:w-full max-w-lg bg-white/60 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl flex flex-col p-4 sm:p-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {step !== 'payment' && step !== 'success' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-transparent border-none text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 p-2 rounded-full flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 mb-1">Đổi lịch hẹn khám</h3>
                <p className="text-sm text-slate-500">Chọn ngày và giờ khám mới cho cuộc hẹn của bạn</p>
              </div>

              {(rescheduleError || localError) && (
                <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Lỗi:</span> {localError || rescheduleError}
                  </div>
                </div>
              )}

              {within24h && (
                <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-700 font-semibold leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    Lưu ý: Bạn đang đổi lịch sát giờ hẹn (dưới 24h). Việc đổi lịch sẽ phát sinh thêm phụ phí 50.000 VNĐ.
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4 space-y-1 text-xs">
                  <p className="text-slate-400 font-bold uppercase tracking-wider">Thông tin hiện tại</p>
                  <p className="font-bold text-slate-750 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-500" />
                    {apt.doctorName}
                  </p>
                  <p className="text-slate-500 font-medium">{apt.service}</p>
                  <p className="text-slate-400">
                    Đang đặt: <span className="font-semibold text-slate-500">{apt.date} • {apt.time}</span>
                  </p>
                </div>

                {/* Doctor selector — Liquid Glass <GlassSelect> in a thick glass field */}
                <div>
                  <label className="flex items-center gap-2 text-slate-900 font-semibold text-sm mb-1.5">
                    <Stethoscope className="w-4 h-4 text-emerald-500" />
                    Chọn bác sĩ
                  </label>
                  <div className="relative flex items-center w-full bg-white/70 backdrop-blur-xl border border-white/80 rounded-xl px-4 py-4 shadow-sm focus-within:ring-2 focus-within:ring-teal-500/50 transition-all">
                    <GlassSelect
                      value={newDoctor}
                      onChange={(v) => {
                        setNewDoctor(String(v));
                        setNewTime('');
                      }}
                      options={doctorOptions}
                      placeholder="Chọn bác sĩ"
                      className="w-full"
                      buttonClassName="!bg-transparent !border-0 !shadow-none !p-0 !text-slate-900 !font-semibold !text-sm"
                    />
                  </div>
                </div>

                {/* Date selector — Liquid Glass <GlassDatePicker> in a thick glass field */}
                <div>
                  <label className="flex items-center gap-2 text-slate-900 font-semibold text-sm mb-1.5">
                    <Calendar className="w-4 h-4 text-teal-500" />
                    Chọn ngày khám mới
                  </label>
                  <div className="relative flex items-center w-full bg-white/70 backdrop-blur-xl border border-white/80 rounded-xl px-4 py-4 shadow-sm focus-within:ring-2 focus-within:ring-teal-500/50 transition-all">
                    <GlassDatePicker
                      value={newDate}
                      min={minDate}
                      onChange={(v) => {
                        setNewDate(v);
                        setNewTime('');
                      }}
                      placeholder="Chọn ngày khám mới"
                      className="w-full"
                      buttonClassName="!bg-transparent !border-0 !shadow-none !p-0 !text-slate-900 !font-semibold !text-sm"
                    />
                  </div>
                  {selectedDoctorData && newDate && !isDoctorWorkingOnDay && (
                    <div className="mt-2 text-xs text-rose-500 font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        Bác sĩ không có lịch làm việc vào ngày này. Vui lòng chọn ngày khác.
                    </div>
                  )}
                </div>

                {newDate && isDoctorWorkingOnDay && (
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Chọn khung giờ mới
                    </label>
                    <div className="grid grid-cols-4 gap-3 mt-4">
                      {slots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={slot.isBooked}
                          onClick={() => setNewTime(slot.time)}
                          className={
                            slot.isBooked
                              ? 'py-2.5 rounded-xl text-sm font-semibold text-center transition-all bg-slate-900/5 backdrop-blur-sm border border-slate-200/30 text-slate-400 cursor-not-allowed line-through'
                              : newTime === slot.time
                              ? 'py-2.5 rounded-xl text-sm font-semibold text-center transition-all bg-teal-500/80 backdrop-blur-xl border border-teal-400 text-white shadow-lg shadow-teal-500/30'
                              : 'py-2.5 rounded-xl text-sm font-semibold text-center transition-all bg-white/40 backdrop-blur-md border border-white/50 text-slate-800 hover:bg-teal-50/80 hover:border-teal-300 shadow-sm'
                          }
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
                <button
                  onClick={handleProceedToPayment}
                  disabled={!newDate || !newTime || !isDoctorWorkingOnDay}
                  className={`w-full sm:w-auto py-3 px-6 rounded-xl text-white font-semibold text-sm border-none shadow-md transition-all cursor-pointer ${
                    (newDate && newTime && isDoctorWorkingOnDay)
                      ? 'bg-gradient-to-r from-emerald-500 to-sky-500 shadow-emerald-500/10 hover:shadow-lg'
                      : 'bg-slate-300 cursor-not-allowed shadow-none'
                  }`}
                >
                  {within24h ? 'Thanh toán phụ phí' : 'Xác nhận đổi lịch'}
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Quay lại
                </button>
              </div>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 relative">
                  <QrCode className="w-8 h-8 text-emerald-500" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold animate-pulse">!</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Thanh toán phụ phí</h3>
                <p className="text-sm text-slate-500 mb-1">Quét mã QR bằng ứng dụng ngân hàng</p>
                <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full mt-2 border border-amber-200">
                  <Timer className="w-4 h-4 animate-pulse" />
                  <span className="font-mono font-bold text-sm">{formatTimeLeft()}</span>
                </div>
              </div>

              <div className="bg-white border-2 border-dashed border-emerald-200 rounded-[2rem] p-8 flex flex-col items-center justify-center mb-6 relative overflow-hidden group min-h-[300px]">
                {payosData ? (
                  <>
                    <img src={`https://img.vietqr.io/image/${payosData.bin}-${payosData.accountNumber}-compact2.png?amount=${payosData.amount}&addInfo=${encodeURIComponent(payosData.description)}&accountName=${encodeURIComponent(payosData.accountName)}`} alt="QR Code" className="w-56 h-56 object-contain relative z-10 rounded-xl mix-blend-multiply" />
                    <div className="mt-4 text-center">
                      <p className="text-xs text-slate-400 font-medium mb-1">Số tiền thanh toán</p>
                      <p className="text-xl font-bold text-emerald-600">50.000 VNĐ</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                    <p className="text-sm font-medium text-emerald-600">Đang khởi tạo mã QR...</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleCancelPayment}
                className="w-full py-3.5 rounded-xl bg-white border border-rose-200 text-rose-600 font-bold text-sm hover:bg-rose-50 transition-all cursor-pointer"
              >
                Hủy giao dịch
              </button>
            </motion.div>
          )}

          {step === 'timeout' && (
            <motion.div key="timeout" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
                <Timer className="w-10 h-10 text-rose-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Hết thời gian</h3>
              <p className="text-sm text-slate-500 mb-8 max-w-[280px] mx-auto">
                Phiên giao dịch đã hết hạn. Vui lòng thực hiện lại nếu bạn vẫn muốn đổi lịch.
              </p>
              <button
                onClick={() => { setStep('form'); setNewTime(''); setTimeLeft(300); }}
                className="w-full py-3.5 rounded-xl bg-rose-500 text-white font-bold text-sm shadow-md shadow-rose-500/20 hover:bg-rose-600 transition-all border-none cursor-pointer"
              >
                Thử lại
              </button>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6 relative"
              >
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping"></div>
                <CheckCircle2 className="w-12 h-12 text-emerald-500 relative z-10" />
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Đổi lịch thành công!</h3>
              <p className="text-sm text-slate-500 mb-6">
                Hệ thống đã cập nhật lịch hẹn mới cho bạn.
              </p>
              <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Tự động đóng...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ─── Cancel Confirmation Modal ───────────────────────────────────────────────

function CancelModal({ apt, onClose, onConfirm, cancelError }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm font-sans"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-md backdrop-blur-3xl bg-white/90 border border-white/80 shadow-2xl rounded-[2rem] p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-transparent border-none text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 p-2 rounded-full flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">Xác nhận hủy lịch hẹn</h3>
          <p className="text-sm text-slate-500 mb-2">Bạn có chắc chắn muốn hủy lịch hẹn này không?</p>
          <p className="text-xs text-rose-600 font-semibold bg-rose-50 inline-block px-3 py-1 rounded-full">
            Lưu ý: Bạn sẽ mất phí đặt cọc giữ chỗ.
          </p>
        </div>

        {cancelError && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Lỗi hủy lịch:</span> {cancelError}
            </div>
          </div>
        )}

        <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 mb-6 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Stethoscope className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-slate-700">{apt.doctorName}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{apt.date}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.time}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-semibold text-sm shadow-md shadow-rose-500/20 hover:bg-rose-600 transition-all border-none cursor-pointer"
          >
            Xác nhận hủy
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all cursor-pointer"
          >
            Quay lại
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── View Feedback Modal ─────────────────────────────────────────────────────

function ViewFeedbackModal({ apt, feedback, onClose }) {
  const CRITERIA_LABELS = {
    doctor: 'Bác sĩ',
    technician: 'Kỹ thuật viên',
    treatmentEffect: 'Hiệu quả điều trị',
    waitingTime: 'Thời gian chờ',
    facility: 'Cơ sở vật chất',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm font-sans"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-lg backdrop-blur-3xl bg-white/90 border border-white/80 shadow-2xl rounded-[2rem] p-7 relative max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 bg-transparent border-none text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 p-2 rounded-full flex items-center justify-center transition-all cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <h3 className="text-xl font-bold text-slate-800 mb-1">Chi tiết lượt khám</h3>
          <p className="text-sm text-slate-500">{apt.date} • {apt.time} • {apt.service}</p>
        </div>

        <div className="space-y-4">
          {/* Doctor info */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-slate-700">{apt.doctorName}</span>
            </div>
          </div>

          {/* Diagnosis */}
          {apt.diagnosis && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" /> Chẩn đoán
              </p>
              <p className="text-sm text-slate-700 font-medium">{apt.diagnosis}</p>
            </div>
          )}

          {/* Prescription */}
          {apt.prescription && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5" /> Đơn thuốc
              </p>
              <p className="text-sm text-slate-700 font-medium">{apt.prescription}</p>
            </div>
          )}

          {/* Timeline Audit Logs */}
          {apt.history && apt.history.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" /> Nhật ký cuộc hẹn
              </p>
              <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-4">
                {apt.history.map((h, i) => (
                  <div key={i} className="relative text-xs">
                    <div className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-teal-500 ring-4 ring-slate-50 animate-pulse"></div>
                    <p className="font-bold text-slate-700">
                      {new Date(h.timestamp).toLocaleDateString('vi-VN')} {new Date(h.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    <p className="text-slate-500 mt-0.5 leading-snug">{h.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback block */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Đánh giá của bạn
            </p>
            {feedback ? (
              <div className="space-y-3">
                {/* Overall stars */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">Tổng thể:</span>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-5 h-5 ${s <= feedback.overallRating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-amber-600">{feedback.overallRating}/5</span>
                </div>
                {/* Criteria */}
                {feedback.criteriaRatings && Object.entries(feedback.criteriaRatings).filter(([,v]) => v > 0).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-32 shrink-0">{CRITERIA_LABELS[k]}:</span>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= v ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                ))}
                {/* Comment */}
                {(() => {
                  if (feedback.doctorComment || feedback.technicianComment) {
                    return (
                      <div className="space-y-2 border-t border-amber-200 pt-3 not-italic text-left text-sm">
                        {feedback.doctorComment && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nhận xét Bác sĩ:</span>
                            <p className="text-slate-700 italic mt-0.5">"{feedback.doctorComment}" <span className="text-[9px] text-slate-400 font-semibold">({(feedback.isDoctorPublic ?? true) ? 'Công khai' : 'Ẩn'})</span></p>
                          </div>
                        )}
                        {feedback.technicianComment && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nhận xét Kỹ thuật viên:</span>
                            <p className="text-slate-700 italic mt-0.5">"{feedback.technicianComment}" <span className="text-[9px] text-slate-400 font-semibold">({(feedback.isTechnicianPublic ?? true) ? 'Công khai' : 'Ẩn'})</span></p>
                          </div>
                        )}
                      </div>
                    );
                  }
                  if (feedback.comment) {
                    return (
                      <div className="border-t border-amber-200 pt-3 text-sm italic text-slate-700">
                        "{feedback.comment}"
                      </div>
                    );
                  }
                  return null;
                })()}
                {/* Images */}
                {feedback.images?.length > 0 && (
                  <div className="flex gap-2 flex-wrap border-t border-amber-200 pt-3">
                    {feedback.images.map((img, i) => (
                      <img key={i} src={img} alt="" className="w-16 h-16 rounded-xl object-cover border border-amber-200" />
                    ))}
                  </div>
                )}
                {/* Admin reply */}
                {feedback.adminReply && (
                  <div className="bg-white border border-amber-200 rounded-xl p-3 mt-2">
                    <p className="text-xs font-bold text-emerald-700 mb-1">Phản hồi từ phòng khám:</p>
                    <p className="text-xs text-slate-600 italic">{feedback.adminReply.text}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Bạn chưa để lại đánh giá cho lượt khám này.</p>
            )}
          </div>
        </div>

        <button onClick={onClose} className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all border-none cursor-pointer">
          Đóng
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main AppointmentsTab Component ──────────────────────────────────────────

export default function AppointmentsTab({ setActiveTab, setFeedbackAptId }) {
  const { user } = useAuth();
  const patientId = user?.id || 'pat-01';

  const { appointments, cancelAppointment, rescheduleAppointment } = useAppointmentController(patientId);
  const { feedbacks, getFeedbackByAppointment } = useFeedbackController({ patientId });

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelError, setCancelError] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleError, setRescheduleError] = useState('');
  const [viewTarget, setViewTarget] = useState(null);
  const [writeFeedbackTarget, setWriteFeedbackTarget] = useState(null);

  // Redirect function for rating
  const handleViewFeedbackRedirect = (apt) => {
    if (setActiveTab && setFeedbackAptId) {
      setFeedbackAptId(apt.id);
      setActiveTab('feedback');
    } else {
      setViewTarget(apt);
    }
  };

  // Invoice states
  const [invoiceRecord, setInvoiceRecord] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const getFeedbackForApt = (aptId) => {
    return (feedbacks || []).find(f => String(f.appointmentId || f.appointment_id) === String(aptId));
  };

  // Date-aware split: an *active* appointment only counts as "upcoming" while
  // its date and time haven't passed; once the time is in the past it moves to history
  // (overdue) instead of lingering in "sắp tới" forever.
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const ACTIVE_STATUSES = [
    'Đặt lịch thành công',
    'Đang chờ khám',
    'Đang khám',
    'Đã thanh toán',
    'Đã xác nhận',
    'Chờ xác nhận',
    'Đang chờ',
    'Pending'
  ];
  const TERMINAL_STATUSES = ['Đã khám', 'Đã hủy', 'Reviewed', 'Đã không đến'];
  const aptDate = (a) => a.date || a.appointment_date || '';

  const isDateTimePassed = (dateStr, timeStr) => {
    if (!dateStr) return true;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return true;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const time = timeStr || '00:00';
    const timeParts = time.split(':');
    const hours = parseInt(timeParts[0] || '0', 10);
    const minutes = parseInt(timeParts[1] || '0', 10);

    const aptDateTime = new Date(year, month, day, hours, minutes, 0, 0);
    return aptDateTime < new Date();
  };

  const upcoming = appointments.filter(
    (a) => {
      const isStatusActive = ACTIVE_STATUSES.includes(a.status);
      return isStatusActive && !isDateTimePassed(aptDate(a), a.time || a.start_time);
    }
  ).sort((a, b) => {
    const strA = `${aptDate(a)}T${a.time || a.start_time || ''}`;
    const strB = `${aptDate(b)}T${b.time || b.start_time || ''}`;
    return strA.localeCompare(strB);
  });

  const past = appointments.filter(
    (a) => {
      const isStatusTerminal = TERMINAL_STATUSES.includes(a.status);
      const isStatusActive = ACTIVE_STATUSES.includes(a.status);
      const isOverdue = isStatusActive && isDateTimePassed(aptDate(a), a.time || a.start_time);
      return isStatusTerminal || isOverdue;
    }
  ).sort((a, b) => {
    const strA = `${aptDate(a)}T${a.time || a.start_time || ''}`;
    const strB = `${aptDate(b)}T${b.time || b.start_time || ''}`;
    return strB.localeCompare(strA);
  });

  const handleConfirmCancel = async () => {
    if (cancelTarget) {
      setCancelError('');
      const res = await cancelAppointment(cancelTarget.id);
      if (res.success) setCancelTarget(null);
      else setCancelError(res.error);
    }
  };

  const handleConfirmReschedule = async (newDate, newTime, newDoctorId = null) => {
    if (rescheduleTarget) {
      setRescheduleError('');
      const res = await rescheduleAppointment(rescheduleTarget.id, newDate, newTime, newDoctorId);
      if (!res.success) setRescheduleError(res.error);
      return res;
    }
    return { success: false };
  };

  // PHASE 2 — EMR READ PATH. Only the finalized exam (Đã khám / Hoàn thành) is
  // synced to the patient. Fetch the medical_records row by appointment, then
  // its prescription (header + details), and shape it for MedicalRecordDetailModal.
  const handleViewInvoice = async (apt) => {
    const SYNCED = ['Đã khám', 'Reviewed', 'Đã thanh toán'];
    if (!SYNCED.includes(apt.status)) return;
    setInvoiceLoading(true);
    try {
      const payment = await AppointmentModel.getPaymentByAppointment(apt.id);
      
      let voucherCode = null;
      if (payment && payment.voucher_id) {
        try {
          const { VoucherModel } = await import('../../models/VoucherModel');
          const v = await VoucherModel.getVoucherById(payment.voucher_id);
          voucherCode = v?.code || null;
        } catch (e) {
          console.warn("Failed to fetch voucher for invoice:", e);
        }
      }

      let usedServices = [];
      let servicesTotal = 0;
      try {
        const { data: stData } = await supabase
          .from('service_tickets')
          .select('id, service_name')
          .eq('appointment_id', apt.id);
          
        if (stData && stData.length > 0) {
           const { data: svcData } = await supabase.from('services').select('service_name, price');
           usedServices = stData.map(t => {
               const svc = (svcData || []).find(s => s.service_name === t.service_name);
               const priceStr = svc?.price || 0;
               let priceNum = 0;
               if (typeof priceStr === 'number') priceNum = priceStr;
               else if (typeof priceStr === 'string') priceNum = parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
               servicesTotal += priceNum;
               return { id: t.id, name: t.service_name, price: priceNum };
           });
        }
      } catch (e) {
        console.warn("Failed to fetch used services:", e);
      }

      const baseTotal = parseFee(apt.fee, 0) || 300000;
      const calcTotal = baseTotal + servicesTotal;

      const followUpFee = payment ? Math.max(0, (payment.final_amount + (payment.discount_amount || 0)) - calcTotal) : 0;
      const prior = 0;
      const discount = payment?.discount_amount ?? 0;
      const netPayable = payment ? payment.final_amount : Math.max(0, calcTotal + followUpFee - discount);

      const invoice = {
        aptId: apt.id,
        patientName: apt.patientName || apt.patient_name || 'Bệnh nhân',
        doctorName: apt.doctorName || apt.doctor_name || 'Bác sĩ',
        serviceName: apt.service || apt.service_name || 'Dịch vụ khám',
        paidAt: payment?.paid_at ? new Date(payment.paid_at) : new Date(apt.date + 'T' + (apt.time || '08:00')),
        method: payment?.payment_method || 'Tiền mặt',
        baseTotal,
        usedServices,
        followUpFee,
        total: calcTotal + followUpFee,
        prior,
        discount,
        netPayable,
        voucherCode: voucherCode || payment?.voucher_code || null,
        receptionistId: payment?.receptionist_id || 'staff',
        paymentStatus: payment?.payment_status || 'PAID',
      };
      setInvoiceRecord(invoice);
    } catch (err) {
      console.error('Failed to load invoice for patient:', err);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Không tải được hóa đơn. Vui lòng thử lại.', type: 'error' },
      }));
    } finally {
      setInvoiceLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upcoming */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Lịch hẹn sắp tới</h3>
            <p className="text-xs text-slate-400 mt-0.5">Các lượt khám đã đặt và đang chờ</p>
          </div>
        </div>
        <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          {upcoming.length > 0 ? (
            upcoming.map((apt, idx) => (
              <AppointmentCard
                key={apt.id}
                apt={apt}
                index={idx}
                isUpcoming
                isOverdue={false}
                onCancel={setCancelTarget}
                onReschedule={setRescheduleTarget}
                onViewFeedback={handleViewFeedbackRedirect}
                onWriteFeedback={setWriteFeedbackTarget}
                onViewInvoice={handleViewInvoice}
                existingFeedback={getFeedbackForApt(apt.id)}
              />
            ))
          ) : (
            <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-white/60">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-semibold">Chưa có lịch hẹn sắp tới.</p>
              <p className="text-xs text-slate-400 mt-1">Đặt lịch khám mới để bắt đầu!</p>
            </div>
          )}
        </div>
      </div>

      {/* Past */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-sky-50 rounded-xl text-sky-600 border border-sky-100">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Lịch hẹn đã qua</h3>
            <p className="text-xs text-slate-400 mt-0.5">Lịch sử khám bệnh và thanh toán</p>
          </div>
        </div>
        <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          {past.length > 0 ? (
            past.map((apt, idx) => (
              <AppointmentCard
                key={apt.id}
                apt={apt}
                index={idx}
                isUpcoming={false}
                isOverdue={ACTIVE_STATUSES.includes(apt.status) && isDateTimePassed(aptDate(apt), apt.time || apt.start_time)}
                onCancel={setCancelTarget}
                onReschedule={setRescheduleTarget}
                onViewFeedback={handleViewFeedbackRedirect}
                onWriteFeedback={setWriteFeedbackTarget}
                onViewInvoice={handleViewInvoice}
                existingFeedback={getFeedbackForApt(apt.id)}
              />
            ))
          ) : (
            <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-white/60">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-semibold">Chưa có dữ liệu lịch hẹn.</p>
              <p className="text-xs text-slate-400 mt-1">Lịch sử khám sẽ hiển thị ở đây sau mỗi lượt khám.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {createPortal(
        <>
          <AnimatePresence>
            {cancelTarget && (
              <CancelModal apt={cancelTarget} onClose={() => { setCancelTarget(null); setCancelError(''); }} onConfirm={handleConfirmCancel} cancelError={cancelError} />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {rescheduleTarget && (
              <RescheduleModal apt={rescheduleTarget} onClose={() => { setRescheduleTarget(null); setRescheduleError(''); }} onConfirm={handleConfirmReschedule} rescheduleError={rescheduleError} />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {viewTarget && (
              <ViewFeedbackModal
                apt={viewTarget}
                feedback={getFeedbackForApt(viewTarget.id)}
                onClose={() => setViewTarget(null)}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {writeFeedbackTarget && (
              <FeedbackFormModal
                apt={writeFeedbackTarget}
                onClose={() => setWriteFeedbackTarget(null)}
                onSubmitted={() => setWriteFeedbackTarget(null)}
              />
            )}
          </AnimatePresence>
          {/* Invoice Detail Modal */}
          <AnimatePresence>
            {invoiceRecord && (
              <InvoiceDetailModal
                invoice={invoiceRecord}
                onClose={() => setInvoiceRecord(null)}
              />
            )}
          </AnimatePresence>
        </>,
        document.body
      )}

      {/* Lightweight loading veil while the invoice is being fetched */}
      {invoiceLoading && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
          <div className="flex items-center gap-3 bg-white/90 px-5 py-3 rounded-2xl shadow-xl border border-white">
            <RefreshCw className="w-4 h-4 text-teal-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-700">Đang tải hóa đơn...</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
