import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, MessageSquare, Edit3, CheckCircle2,
  Stethoscope, Calendar, Clock, Sparkles,
  Wrench, Building2, Eye, EyeOff, Image,
  ChevronDown, ChevronUp, Reply, ClipboardList,
} from 'lucide-react';
import { useFeedbackController } from '../../controllers/useFeedbackController';
import { useAppointmentController } from '../../controllers/useAppointmentController';
import FeedbackFormModal from './FeedbackFormModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StarDisplay({ value, size = 'md' }) {
  const sz = { lg: 'w-6 h-6', md: 'w-5 h-5', sm: 'w-4 h-4', xs: 'w-3.5 h-3.5' }[size];
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`${sz} ${s <= value ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
      ))}
    </span>
  );
}

const CRITERIA_META = [
  { key: 'doctor',          label: 'Bác sĩ',            icon: Stethoscope },
  { key: 'technician',      label: 'Kỹ thuật viên',      icon: Wrench },
  { key: 'treatmentEffect', label: 'Hiệu quả điều trị',  icon: Sparkles },
  { key: 'waitingTime',     label: 'Thời gian chờ',       icon: Clock },
  { key: 'facility',        label: 'Cơ sở vật chất',      icon: Building2 },
];

const RATING_LABELS = { 1: 'Rất tệ', 2: 'Tệ', 3: 'Bình thường', 4: 'Tốt', 5: 'Xuất sắc' };
const RATING_COLORS = {
  1: 'text-rose-600 bg-rose-50 border-rose-200',
  2: 'text-orange-600 bg-orange-50 border-orange-200',
  3: 'text-amber-600 bg-amber-50 border-amber-200',
  4: 'text-sky-600 bg-sky-50 border-sky-200',
  5: 'text-emerald-600 bg-emerald-50 border-emerald-200',
};

// ─── Feedback Card (Patient's own review) ─────────────────────────────────────
function MyFeedbackCard({ fb }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
    >
      {/* Header stripe */}
      <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-slate-800">{fb.doctorName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>{fb.date}</span>
              <span className="text-slate-300">•</span>
              <span>{fb.service}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <StarDisplay value={fb.overallRating} size="sm" />
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RATING_COLORS[fb.overallRating]}`}>
              {RATING_LABELS[fb.overallRating]}
            </span>
          </div>
        </div>

        {/* Comment */}
        <p className="text-sm text-slate-700 leading-relaxed mb-3">
          {fb.isAnonymous && <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5 mr-2">Ẩn danh</span>}
          "{fb.comment}"
        </p>

        {/* Images */}
        {fb.images?.length > 0 && (
          <div className="flex gap-2 mb-3">
            {fb.images.map((img, i) => (
              <img key={i} src={img} alt="" className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
            ))}
          </div>
        )}

        {/* Admin reply */}
        {fb.adminReply && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-3">
            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 mb-1">
              <Reply className="w-3 h-3" /> Phản hồi từ phòng khám
            </p>
            <p className="text-xs text-emerald-800 leading-relaxed">{fb.adminReply.text}</p>
          </div>
        )}

        {/* Expand criteria */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Ẩn' : 'Xem'} đánh giá chi tiết theo tiêu chí
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3"
            >
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                {CRITERIA_META.map(({ key, label, icon: Icon }) => {
                  const val = fb.criteriaRatings?.[key] || 0;
                  if (!val) return null;
                  return (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                        <Icon className="w-3 h-3" /> {label}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= val ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Pending Review Card (chưa có feedback) ───────────────────────────────────
function PendingReviewCard({ apt, onWrite }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Stethoscope className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-sm font-bold text-slate-800 truncate">{apt.doctorName}</span>
        </div>
        <p className="text-xs text-slate-500">{apt.date} • {apt.service}</p>
        <p className="text-[10px] text-amber-600 font-semibold mt-1.5 flex items-center gap-1">
          <Star className="w-3 h-3" /> Chưa có đánh giá — chia sẻ trải nghiệm của bạn!
        </p>
      </div>
      <button
        onClick={() => onWrite(apt)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-400/25 hover:shadow-lg hover:-translate-y-0.5 transition-all border-none cursor-pointer shrink-0"
      >
        <Edit3 className="w-3.5 h-3.5" />
        Viết đánh giá
      </button>
    </motion.div>
  );
}

// ─── Main PatientFeedbackTab ──────────────────────────────────────────────────
export default function PatientFeedbackTab({ user }) {
  const patientId = user?.id || 'pat-01';
  const { feedbacks, getFeedbackByAppointment, getStats } = useFeedbackController({ patientId });
  const { appointments } = useAppointmentController(patientId);
  const [writeTarget, setWriteTarget] = useState(null);

  // Completed appointments that don't have feedback yet
  const completedApts = appointments.filter(a => a.status === 'Đã khám' || a.status === 'Reviewed');
  const pendingApts = completedApts.filter(a => !getFeedbackByAppointment(a.id));
  const myFeedbacks = feedbacks.filter(f => f.patientId === patientId);

  const stats = getStats(myFeedbacks);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
          <Star className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Đánh giá của tôi</h3>
          <p className="text-xs text-slate-400 mt-0.5">Quản lý tất cả đánh giá bạn đã gửi</p>
        </div>
      </div>

      {/* Summary stats */}
      {completedApts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-amber-600">{stats.avg > 0 ? stats.avg : '—'}</p>
            <StarDisplay value={Math.round(stats.avg)} size="xs" />
            <p className="text-[10px] text-slate-500 mt-1 font-semibold">Điểm TB</p>
          </div>
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-sky-600">{myFeedbacks.length}</p>
            <p className="text-[10px] text-slate-500 mt-1 font-semibold">Đã đánh giá</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-orange-500">{pendingApts.length}</p>
            <p className="text-[10px] text-slate-500 mt-1 font-semibold">Chờ đánh giá</p>
          </div>
        </div>
      )}

      {/* Lịch sử khám bệnh (Examination History) */}
      <div>
        <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-teal-600" />
          Lịch sử khám bệnh
        </h4>
        
        {completedApts.length === 0 ? (
          <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-semibold">Chưa có lịch sử khám bệnh nào.</p>
            <p className="text-xs text-slate-400 mt-1">Sau khi hoàn thành ca khám, lịch sử khám và tuỳ chọn đánh giá sẽ hiển thị tại đây.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {completedApts.map(apt => {
              const fb = getFeedbackByAppointment(apt.id);
              return (
                <div key={apt.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all">
                  <div className={`h-1 bg-gradient-to-r ${fb ? 'from-emerald-400 to-teal-500' : 'from-amber-400 to-orange-400'}`} />
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Stethoscope className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-bold text-slate-800">{apt.doctorName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span>{apt.date}</span>
                          <span className="text-slate-300">•</span>
                          <span>{apt.service}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {fb ? (
                          <div className="text-right">
                            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border text-emerald-600 bg-emerald-50 border-emerald-200">
                              Đã đánh giá
                            </span>
                            <div className="mt-1">
                              <StarDisplay value={fb.overallRating} size="xs" />
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border text-amber-600 bg-amber-50 border-amber-200">
                            Chưa đánh giá
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {fb ? (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-700 leading-relaxed italic">
                          {fb.isAnonymous && <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5 mr-2">Ẩn danh</span>}
                          "{fb.comment}"
                        </p>
                        
                        {fb.images?.length > 0 && (
                          <div className="flex gap-2">
                            {fb.images.map((img, i) => (
                              <img key={i} src={img} alt="" className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
                            ))}
                          </div>
                        )}
                        
                        {fb.adminReply && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mt-2">
                            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 mb-1">
                              <Reply className="w-3 h-3" /> Phản hồi từ phòng khám
                            </p>
                            <p className="text-xs text-emerald-800 leading-relaxed">{fb.adminReply.text}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Hãy chia sẻ trải nghiệm khám bệnh của bạn để giúp phòng khám cải thiện dịch vụ.
                        </p>
                        <button
                          onClick={() => setWriteTarget(apt)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-400/25 hover:shadow-lg hover:-translate-y-0.5 transition-all border-none cursor-pointer shrink-0"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Viết đánh giá
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Write feedback modal */}
      <AnimatePresence>
        {writeTarget && (
          <FeedbackFormModal
            apt={writeTarget}
            onClose={() => setWriteTarget(null)}
            onSubmitted={() => setWriteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
