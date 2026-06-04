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
} from 'lucide-react';
import { mockAppointments } from '../../mockData';

// ─── Status Badge Component ─────────────────────────────────────────────────

const STATUS_STYLES = {
  'Đã xác nhận': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Chờ xác nhận': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Đã khám': 'bg-sky-50 text-sky-700 border border-sky-200',
  'Đã hủy': 'bg-rose-50 text-rose-700 border border-rose-200',
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

function AppointmentCard({ apt, index, isUpcoming, onCancel, onViewFeedback }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition-all group"
    >
      {/* Row 1: Date, Time, Status */}
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

      {/* Row 2: Doctor + Service */}
      <div className="flex items-center gap-2 mb-2">
        <Stethoscope className="w-4 h-4 text-emerald-500 shrink-0" />
        <span className="text-sm font-bold text-slate-800">{apt.doctorName}</span>
        <span className="text-xs text-slate-400">•</span>
        <span className="text-xs text-slate-500 font-medium">{apt.service}</span>
      </div>

      {/* Row 3: Fee + Payment */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-slate-500 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-sky-500" />
          {apt.fee}
        </span>
        <StatusBadge text={apt.paymentStatus} type="payment" />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {isUpcoming && (
          <>
            <button
              onClick={() => onCancel(apt)}
              className="text-rose-500 hover:bg-rose-50 border border-rose-200 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer bg-white flex items-center gap-1.5"
            >
              <X className="w-3 h-3" />
              Hủy lịch
            </button>
            <button className="text-sky-600 hover:bg-sky-50 border border-sky-200 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer bg-white flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" />
              Đổi lịch
            </button>
          </>
        )}
        {!isUpcoming && apt.status === 'Đã khám' && (
          <>
            {(apt.paymentStatus === 'Chưa thanh toán' || apt.paymentStatus === 'Chờ xác nhận') && (
              <button className="bg-gradient-to-r from-emerald-500 to-sky-500 text-white rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer border-none shadow-sm shadow-emerald-500/20 hover:shadow-md hover:-translate-y-0.5 flex items-center gap-1.5">
                <CreditCard className="w-3 h-3" />
                Thanh toán
              </button>
            )}
            <button
              onClick={() => onViewFeedback(apt)}
              className="text-sky-600 hover:bg-sky-50 border border-sky-200 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer bg-white flex items-center gap-1.5"
            >
              <MessageSquare className="w-3 h-3" />
              Xem phản hồi
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Cancel Confirmation Modal ───────────────────────────────────────────────

function CancelModal({ apt, onClose, onConfirm }) {
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

        <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 mb-6 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Stethoscope className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-slate-700">{apt.doctorName}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{apt.date}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.time}</span>
          </div>
          <p className="text-xs text-slate-400">{apt.service}</p>
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

// ─── Feedback / Detail Modal ─────────────────────────────────────────────────

function FeedbackModal({ apt, onClose }) {
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
        className="w-full max-w-lg backdrop-blur-3xl bg-white/75 border border-white/80 shadow-2xl rounded-[2rem] p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-transparent border-none text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 p-2 rounded-full flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-800 mb-1">Chi tiết lượt khám</h3>
          <p className="text-sm text-slate-500">{apt.date} • {apt.time} • {apt.service}</p>
        </div>

        <div className="space-y-4">
          {/* Doctor */}
          <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-slate-700">{apt.doctorName}</span>
            </div>
          </div>

          {/* Diagnosis */}
          {apt.diagnosis && (
            <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" />
                Chẩn đoán
              </p>
              <p className="text-sm text-slate-700 font-medium">{apt.diagnosis}</p>
            </div>
          )}

          {/* Prescription */}
          {apt.prescription && (
            <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5" />
                Đơn thuốc
              </p>
              <p className="text-sm text-slate-700 font-medium">{apt.prescription}</p>
            </div>
          )}

          {/* Feedback */}
          <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" />
              Phản hồi của bạn
            </p>
            {apt.feedback ? (
              <p className="text-sm text-slate-700 font-medium italic">"{apt.feedback}"</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Bạn chưa để lại phản hồi cho lượt khám này.</p>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all border-none cursor-pointer"
        >
          Đóng
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main AppointmentsTab Component ──────────────────────────────────────────

export default function AppointmentsTab() {
  const [appointments, setAppointments] = useState(
    mockAppointments.filter((a) => a.patientId === 'pat-01')
  );
  const [cancelTarget, setCancelTarget] = useState(null);
  const [feedbackTarget, setFeedbackTarget] = useState(null);

  const upcoming = appointments.filter(
    (a) => a.status === 'Đã xác nhận' || a.status === 'Chờ xác nhận'
  );
  const past = appointments.filter(
    (a) => a.status === 'Đã khám' || a.status === 'Đã hủy'
  );

  const handleConfirmCancel = () => {
    if (cancelTarget) {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === cancelTarget.id ? { ...a, status: 'Đã hủy' } : a
        )
      );
      setCancelTarget(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Upcoming Section ── */}
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
                onCancel={setCancelTarget}
                onViewFeedback={setFeedbackTarget}
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

      {/* ── Past Section ── */}
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
                onCancel={setCancelTarget}
                onViewFeedback={setFeedbackTarget}
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

      {/* ── Modals ── */}
      <AnimatePresence>
        {cancelTarget && (
          <CancelModal
            apt={cancelTarget}
            onClose={() => setCancelTarget(null)}
            onConfirm={handleConfirmCancel}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {feedbackTarget && (
          <FeedbackModal
            apt={feedbackTarget}
            onClose={() => setFeedbackTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
