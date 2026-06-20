import React from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, TrendingUp, Wrench, ThumbsUp } from 'lucide-react';
import { useFeedbackController } from '../../controllers/useFeedbackController';
import FeedbackCard, { StarDisplay, CRITERIA_META } from '../shared/FeedbackCard';
import { GLASS_BASE } from '../common/GlassCard';

export default function TechnicianFeedbackView({ technicianId }) {
  // KTV được lưu dưới doctorId trong feedback (vì dùng chung field)
  const resolvedId = technicianId || 'doc-03';
  const { feedbacks, getStats } = useFeedbackController();

  const [feedbackList, setFeedbackList] = React.useState([]);

  React.useEffect(() => {
    setFeedbackList(Array.isArray(feedbacks) ? feedbacks : []);
  }, [feedbacks]);

  const ownPublished = (Array.isArray(feedbackList) ? feedbackList : []).filter(
    f => f?.doctorId === resolvedId && f?.status === 'published'
  );
  const visibleFeedbacks = (Array.isArray(feedbackList) ? feedbackList : []).filter(
    f => f?.status === 'published' && (f?.doctorId === resolvedId || f?.isPublic === true)
  );
  const stats = getStats(ownPublished) || {
    total: 0,
    avg: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    criteria: { doctor: 0, technician: 0, treatmentEffect: 0, waitingTime: 0, facility: 0 }
  };

  const technicianCriteria = (Array.isArray(CRITERIA_META) ? CRITERIA_META : []).filter(c =>
    c && ['technician', 'treatmentEffect', 'waitingTime', 'facility'].includes(c.key)
  ) || [];

  const avgColor =
    stats.avg >= 4.5 ? 'text-emerald-600' :
    stats.avg >= 3.5 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className="space-y-6">
      {/* Score cards & Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Big score */}
        <div className="backdrop-blur-2xl bg-gradient-to-br from-amber-100/60 to-orange-100/40 border border-amber-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl p-6 flex flex-col items-center justify-center text-center">
          <p className={`text-6xl font-black ${avgColor} leading-none mb-2`}>{stats.avg > 0 ? stats.avg : '—'}</p>
          <StarDisplay value={Math.round(stats.avg)} size="lg" />
          <p className="text-sm text-slate-500 mt-3">{stats.total} đánh giá</p>
          <p className="text-xs text-slate-400 mt-1">
            {stats.total > 0 ? `${Math.round((((stats.distribution[4] || 0) + (stats.distribution[5] || 0)) / stats.total) * 100)}% hài lòng (4-5★)` : 'Chưa có đánh giá'}
          </p>
        </div>

        {/* Distribution */}
        <div className={`${GLASS_BASE} p-5`}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Phân bổ sao</p>
          <div className="space-y-2">
            {[5,4,3,2,1]?.map?.(star => {
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
      {/* Technician-specific criteria */}
      {(stats?.total || 0) > 0 && (
        <div className={`${GLASS_BASE} p-5`}>
          <p className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Điểm tiêu chí liên quan
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(Array.isArray(technicianCriteria) ? technicianCriteria : []).map(({ key, label, icon: Icon, color }) => {
              const val = stats?.criteria?.[key]
                ? Math.round(stats.criteria[key] * 10) / 10
                : 0;
              return (
                <div key={key} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <Icon className={`w-4 h-4 ${color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{label}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(val / 5) * 100}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full bg-amber-400 rounded-full"
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 w-6 shrink-0">{val > 0 ? val : '—'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Feedback list */}
      <div>
        <p className="text-sm font-bold text-slate-700 mb-3">
          {(Array.isArray(visibleFeedbacks) ? visibleFeedbacks : []).length} đánh giá công khai
        </p>
        {(Array.isArray(visibleFeedbacks) ? visibleFeedbacks : []).length > 0 ? (
          <div className="space-y-4">
            {(Array.isArray(visibleFeedbacks) ? visibleFeedbacks : []).map(fb => (
              <FeedbackCard
                key={fb?.id}
                fb={fb}
                showPatient
                showDoctor={fb?.doctorId !== resolvedId}
                highlightKey="technician"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 backdrop-blur-xl bg-white/30 border border-dashed border-slate-300/60 rounded-3xl">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-semibold">Chưa có đánh giá nào.</p>
            <p className="text-xs text-slate-400 mt-1">Đánh giá từ bệnh nhân sẽ xuất hiện ở đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}
