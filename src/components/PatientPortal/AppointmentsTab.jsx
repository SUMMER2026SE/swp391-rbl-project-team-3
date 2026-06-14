import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAppointmentController } from '../../controllers/useAppointmentController';
import { useFeedbackController } from '../../controllers/useFeedbackController';
import { useAuth } from '../../context/AuthContext';
import { DoctorModel } from '../../models/DoctorModel';
import FeedbackFormModal from './FeedbackFormModal';

// ─── Status Badge Component ─────────────────────────────────────────────────

const STATUS_STYLES = {
  'Đã xác nhận': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Chờ xác nhận': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Đang chờ': 'bg-teal-50 text-teal-700 border border-teal-200',
  'Đã khám': 'bg-sky-50 text-sky-700 border border-sky-200',
  'Đã hủy': 'bg-rose-50 text-rose-700 border border-rose-200',
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

function AppointmentCard({ apt, index, isUpcoming, onCancel, onReschedule, onViewFeedback, onWriteFeedback, existingFeedback }) {
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
        <StatusBadge text={apt.status} type="status" />
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
          {apt.fee}
        </span>
        <StatusBadge text={apt.paymentStatus} type="payment" />
        {/* Show star rating if feedback exists */}
        {existingFeedback && (
          <span className="flex items-center gap-0.5">
            {[1,2,3,4,5]?.map?.(s => (
              <Star key={s} className={`w-3 h-3 ${s <= existingFeedback.overallRating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
            ))}
          </span>
        )}
        {/* Voucher badge — chỉ hiện tên ưu đãi, không hiện mã */}
        {apt.voucherId && apt.discount > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            🏷️ Ưu đãi -{Number(apt.discount).toLocaleString('vi-VN')}đ
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
        {!isUpcoming && (apt.status === 'Đã khám' || apt.status === 'Reviewed') && (
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
              onClick={() => onViewFeedback(apt)}
              className="text-sky-600 hover:bg-sky-50 border border-sky-200 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer bg-white flex items-center gap-1.5"
            >
              <MessageSquare className="w-3 h-3" />
              Chi tiết khám
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Reschedule Confirmation Modal ───────────────────────────────────────────

function RescheduleModal({ apt, onClose, onConfirm, rescheduleError }) {
  const { getAvailableSlots, canCancel } = useAppointmentController();
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const selectedDoctorData = DoctorModel.getAllDoctors().find((d) => d.id === apt.doctorId);

  let isDoctorWorkingOnDay = true;
  let doctorScheduleText = '';
  if (selectedDoctorData && newDate) {
    const parts = newDate.split('-');
    const selectDateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const dayOfWeek = selectDateObj.getDay();

    const DAY_MAP = {
      'Chủ Nhật': 0, 'Thứ Hai': 1, 'Thứ Ba': 2, 'Thứ Tư': 3, 'Thứ Năm': 4, 'Thứ Sáu': 5, 'Thứ Bảy': 6,
    };

    const workingDays = selectedDoctorData.schedule?.map(s => DAY_MAP[s.day] !== undefined ? DAY_MAP[s.day] : -1)?.filter?.(d => d !== -1);
    isDoctorWorkingOnDay = workingDays.includes(dayOfWeek);
    doctorScheduleText = selectedDoctorData.schedule?.map?.(s => s.day).join(', ');
  }

  const slots = (apt.doctorId && newDate && isDoctorWorkingOnDay)
    ? getAvailableSlots(apt.doctorId, newDate)
    : [];

  const handleConfirm = () => {
    if (newDate && newTime && isDoctorWorkingOnDay) {
      onConfirm(newDate, newTime);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/35 backdrop-blur-sm font-sans"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-md backdrop-blur-3xl bg-white/80 border border-white/80 shadow-2xl rounded-[2rem] p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-transparent border-none text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 p-2 rounded-full flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-slate-800 mb-1">Đổi lịch hẹn khám</h3>
          <p className="text-sm text-slate-500">Chọn ngày và giờ khám mới cho cuộc hẹn của bạn</p>
        </div>

        {rescheduleError && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Lỗi đổi lịch:</span> {rescheduleError}
            </div>
          </div>
        )}

        {!canCancel(apt) && (
          <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-700 font-semibold leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              Lưu ý: Bạn đang đổi lịch sát giờ hẹn (dưới 24h). Việc đổi lịch sẽ phát sinh thêm phụ phí 50.000 VNĐ cộng vào hóa đơn khám.
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

          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              <Calendar className="w-4 h-4 text-teal-500" />
              Chọn ngày khám mới
            </label>
            <input
              type="date"
              value={newDate}
              min={minDate}
              onChange={(e) => {
                setNewDate(e.target.value);
                setNewTime('');
              }}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 transition-colors cursor-pointer text-sm"
            />
            {selectedDoctorData && newDate && !isDoctorWorkingOnDay && (
              <div className="mt-2 text-xs text-rose-500 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                Bác sĩ không trực ngày này. Lịch trực: {doctorScheduleText}.
              </div>
            )}
          </div>

          {newDate && isDoctorWorkingOnDay && (
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                Chọn khung giờ mới
              </label>
              <div className="grid grid-cols-4 gap-2">
                {slots?.map?.((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={slot.isBooked}
                    onClick={() => setNewTime(slot.time)}
                    className={`px-2 py-2 rounded-xl text-xs font-bold text-center cursor-pointer border transition-all ${
                      slot.isBooked
                        ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed line-through'
                        : newTime === slot.time
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleConfirm}
            disabled={!newDate || !newTime || !isDoctorWorkingOnDay}
            className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm border-none shadow-md transition-all cursor-pointer ${
              (newDate && newTime && isDoctorWorkingOnDay)
                ? 'bg-gradient-to-r from-emerald-500 to-sky-500 shadow-emerald-500/10 hover:shadow-lg'
                : 'bg-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            Xác nhận đổi lịch
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
        className="w-full max-w-md backdrop-blur-3xl bg-white/75 border border-white/80 shadow-2xl rounded-[2rem] p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-transparent border-none text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 p-2 rounded-full flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-rose-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Xác nhận hủy lịch hẹn</h3>
          <p className="text-sm text-slate-500">Bạn có chắc chắn muốn hủy lịch hẹn này không?</p>
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
                {apt.history?.map?.((h, i) => (
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
                    {[1,2,3,4,5]?.map?.(s => (
                      <Star key={s} className={`w-5 h-5 ${s <= feedback.overallRating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-amber-600">{feedback.overallRating}/5</span>
                </div>
                {/* Criteria */}
                {feedback.criteriaRatings && Object.entries(feedback.criteriaRatings)?.filter(([,v]) => v > 0)?.map?.(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-32 shrink-0">{CRITERIA_LABELS[k]}:</span>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5]?.map?.(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= v ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                ))}
                {/* Comment */}
                {feedback.comment && (
                  <p className="text-sm text-slate-700 italic border-t border-amber-200 pt-3">"{feedback.comment}"</p>
                )}
                {/* Images */}
                {feedback.images?.length > 0 && (
                  <div className="flex gap-2 flex-wrap border-t border-amber-200 pt-3">
                    {feedback.images?.map?.((img, i) => (
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

export default function AppointmentsTab() {
  const { user } = useAuth();
  const patientId = user?.id || 'pat-01';

  const { appointments, cancelAppointment, rescheduleAppointment } = useAppointmentController(patientId);
  const { getFeedbackByAppointment } = useFeedbackController({ patientId });

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelError, setCancelError] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleError, setRescheduleError] = useState('');
  const [viewTarget, setViewTarget] = useState(null);
  const [writeFeedbackTarget, setWriteFeedbackTarget] = useState(null);

  const upcoming = appointments?.filter?.(
    (a) => a.status === 'Đã xác nhận' || a.status === 'Chờ xác nhận' || a.status === 'Đang chờ'
  );
  const past = appointments?.filter?.(
    (a) => a.status === 'Đã khám' || a.status === 'Đã hủy' || a.status === 'Reviewed'
  );

  const handleConfirmCancel = () => {
    if (cancelTarget) {
      setCancelError('');
      const res = cancelAppointment(cancelTarget.id);
      if (res.success) setCancelTarget(null);
      else setCancelError(res.error);
    }
  };

  const handleConfirmReschedule = (newDate, newTime) => {
    if (rescheduleTarget) {
      setRescheduleError('');
      const res = rescheduleAppointment(rescheduleTarget.id, newDate, newTime);
      if (res.success) setRescheduleTarget(null);
      else setRescheduleError(res.error);
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
            upcoming?.map?.((apt, idx) => (
              <AppointmentCard
                key={apt.id}
                apt={apt}
                index={idx}
                isUpcoming
                onCancel={setCancelTarget}
                onReschedule={setRescheduleTarget}
                onViewFeedback={setViewTarget}
                onWriteFeedback={setWriteFeedbackTarget}
                existingFeedback={getFeedbackByAppointment(apt.id)}
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
            past?.map?.((apt, idx) => (
              <AppointmentCard
                key={apt.id}
                apt={apt}
                index={idx}
                isUpcoming={false}
                onCancel={setCancelTarget}
                onReschedule={setRescheduleTarget}
                onViewFeedback={setViewTarget}
                onWriteFeedback={setWriteFeedbackTarget}
                existingFeedback={getFeedbackByAppointment(apt.id)}
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
            feedback={getFeedbackByAppointment(viewTarget.id)}
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
    </div>
  );
}
