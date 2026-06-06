import React from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, TrendingUp, Wrench, ThumbsUp } from 'lucide-react';
import { useFeedbackController } from '../../controllers/useFeedbackController';
import FeedbackCard, { StarDisplay, CRITERIA_META } from '../shared/FeedbackCard';

export default function TechnicianFeedbackView({ technicianId }) {
  // KTV được lưu dưới doctorId trong feedback (vì dùng chung field)
  const resolvedId = technicianId || 'doc-03';
  const { feedbacks, getStats } = useFeedbackController();

  const ownPublished = feedbacks.filter(f => f.doctorId === resolvedId && f.status === 'published');
  const visibleFeedbacks = feedbacks.filter(
    f => f.status === 'published' && (f.doctorId === resolvedId || f.isPublic === true)
  );
  const stats = getStats(ownPublished);

  const technicianCriteria = CRITERIA_META.filter(c =>
    ['technician', 'treatmentEffect', 'waitingTime', 'facility'].includes(c.key)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Đánh giá từ bệnh nhân</h2>
        <p className="text-sm text-slate-500 mt-1">Phản hồi về kỹ năng thực hiện và chất lượng dịch vụ của bạn</p>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Điểm trung bình',
            value: stats.avg > 0 ? stats.avg : '—',
            sub: '/5 sao',
            color: 'amber',
            icon: Star,
          },
          {
            label: 'Tổng đánh giá',
            value: stats.total,
            sub: 'từ bệnh nhân',
            color: 'sky',
            icon: MessageSquare,
          },
          {
            label: 'Kỹ thuật viên',
            value: stats.criteria.technician
              ? (Math.round(stats.criteria.technician * 10) / 10)
              : '—',
            sub: 'điểm kỹ thuật',
            color: 'emerald',
            icon: Wrench,
          },
          {
            label: 'Hài lòng',
            value: stats.total > 0
              ? `${Math.round(((stats.distribution[4] + stats.distribution[5]) / stats.total) * 100)}%`
              : '—',
            sub: '4–5 sao',
            color: 'teal',
            icon: ThumbsUp,
          },
        ].map((s, i) => {
          const CARD_COLORS = {
            amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-500', val: 'text-amber-700' },
            sky: { bg: 'bg-sky-50', border: 'border-sky-100', text: 'text-sky-500', val: 'text-sky-700' },
            emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-500', val: 'text-emerald-700' },
            teal: { bg: 'bg-teal-50', border: 'border-teal-100', text: 'text-teal-500', val: 'text-teal-700' },
          };
          const colors = CARD_COLORS[s.color] || CARD_COLORS.sky;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`${colors.bg} border ${colors.border} rounded-2xl p-4 text-center`}
            >
              <s.icon className={`w-5 h-5 ${colors.text} mx-auto mb-2`} />
              <p className={`text-2xl font-black ${colors.val}`}>{s.value}</p>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{s.label}</p>
              <p className="text-[10px] text-slate-400">{s.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Technician-specific criteria */}
      {stats.total > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Điểm tiêu chí liên quan
          </p>
          <div className="grid grid-cols-2 gap-3">
            {technicianCriteria.map(({ key, label, icon: Icon, color }) => {
              const val = stats.criteria[key]
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
          {visibleFeedbacks.length} đánh giá công khai
        </p>
        {visibleFeedbacks.length > 0 ? (
          <div className="space-y-4">
            {visibleFeedbacks.map(fb => (
              <FeedbackCard
                key={fb.id}
                fb={fb}
                showPatient
                showDoctor={fb.doctorId !== resolvedId}
                highlightKey="technician"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-semibold">Chưa có đánh giá nào.</p>
            <p className="text-xs text-slate-400 mt-1">Đánh giá từ bệnh nhân sẽ xuất hiện ở đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}
