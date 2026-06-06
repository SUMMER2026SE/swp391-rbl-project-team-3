import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star, MessageSquare, TrendingUp, ThumbsUp, Eye, EyeOff,
  Stethoscope, Clock, Building2, Wrench, Sparkles, BarChart3,
} from 'lucide-react';
import { useFeedbackController } from '../../controllers/useFeedbackController';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StarDisplay({ value, size = 'sm' }) {
  const sz = { lg: 'w-6 h-6', md: 'w-4 h-4', sm: 'w-3.5 h-3.5', xs: 'w-3 h-3' }[size] || 'w-3.5 h-3.5';
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`${sz} ${s <= value ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
      ))}
    </span>
  );
}

const CRITERIA_META = [
  { key: 'doctor',          label: 'Bác sĩ',               icon: Stethoscope, color: 'text-emerald-600 bg-emerald-50' },
  { key: 'technician',      label: 'Kỹ thuật viên',         icon: Wrench,      color: 'text-sky-600 bg-sky-50' },
  { key: 'treatmentEffect', label: 'Hiệu quả điều trị',     icon: Sparkles,    color: 'text-violet-600 bg-violet-50' },
  { key: 'waitingTime',     label: 'Thời gian chờ',          icon: Clock,       color: 'text-amber-600 bg-amber-50' },
  { key: 'facility',        label: 'Cơ sở vật chất',         icon: Building2,   color: 'text-teal-600 bg-teal-50' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DoctorFeedbackView({ doctorId }) {
  const { feedbacks, getStats } = useFeedbackController({ doctorId });
  const published = feedbacks.filter(f => f.status === 'published');
  const stats = getStats(published);
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? published : published.slice(0, 5);

  const avgColor =
    stats.avg >= 4.5 ? 'text-emerald-600' :
    stats.avg >= 3.5 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Đánh giá của bệnh nhân</h2>
        <p className="text-sm text-slate-500 mt-1">Xem phản hồi từ bệnh nhân về chất lượng khám chữa bệnh</p>
      </div>

      {/* Overall Score + Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Big score */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <p className={`text-6xl font-black ${avgColor} leading-none mb-2`}>{stats.avg > 0 ? stats.avg : '—'}</p>
          <StarDisplay value={Math.round(stats.avg)} size="lg" />
          <p className="text-sm text-slate-500 mt-3">{stats.total} đánh giá</p>
          <p className="text-xs text-slate-400 mt-1">
            {stats.total > 0 ? `${Math.round(((stats.distribution[4] + stats.distribution[5]) / stats.total) * 100)}% hài lòng (4-5★)` : 'Chưa có đánh giá'}
          </p>
        </div>

        {/* Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Phân bổ sao</p>
          <div className="space-y-2">
            {[5,4,3,2,1].map(star => {
              const count = stats.distribution[star] || 0;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 w-5 text-right">{star}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" />
                  </div>
                  <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Criteria Averages */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <p className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-teal-500" /> Điểm trung bình theo tiêu chí
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CRITERIA_META.map(({ key, label, icon: Icon, color }) => {
            const val = stats.criteria[key] ? Math.round(stats.criteria[key] * 10) / 10 : 0;
            return (
              <div key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className={`p-2 rounded-lg ${color.split(' ')[1]} shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${color.split(' ')[0]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700">{label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(val / 5) * 100}%` }}
                        transition={{ duration: 0.8 }} className="h-full bg-amber-400 rounded-full" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 shrink-0">{val > 0 ? val : '—'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-slate-800">
            {published.length} đánh giá công khai
          </p>
        </div>

        <div className="space-y-4">
          {displayed.length > 0 ? (
            displayed.map((fb, i) => (
              <motion.div key={fb.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {fb.isAnonymous ? '?' : fb.patientName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{fb.patientName}</p>
                      <p className="text-xs text-slate-400">{fb.date} • {fb.service}</p>
                    </div>
                  </div>
                  <StarDisplay value={fb.overallRating} size="sm" />
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">{fb.comment}</p>

                {/* Images */}
                {fb.images?.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {fb.images.map((img, j) => (
                      <img key={j} src={img} alt="" className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
                    ))}
                  </div>
                )}

                {/* Admin reply */}
                {fb.adminReply && (
                  <div className="mt-3 bg-teal-50 border border-teal-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-teal-700 mb-1">Phản hồi phòng khám:</p>
                    <p className="text-xs text-teal-800">{fb.adminReply.text}</p>
                  </div>
                )}

                {/* Criteria summary */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {CRITERIA_META.map(({ key, label }) => {
                    const v = fb.criteriaRatings?.[key] || 0;
                    if (!v) return null;
                    return (
                      <span key={key} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {label}: {v}★
                      </span>
                    );
                  })}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-semibold">Chưa có đánh giá nào.</p>
              <p className="text-xs text-slate-400 mt-1">Các đánh giá từ bệnh nhân sẽ hiển thị ở đây.</p>
            </div>
          )}
        </div>

        {published.length > 5 && (
          <button onClick={() => setShowAll(!showAll)}
            className="w-full mt-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all cursor-pointer bg-white">
            {showAll ? 'Thu gọn' : `Xem thêm ${published.length - 5} đánh giá`}
          </button>
        )}
      </div>
    </div>
  );
}
