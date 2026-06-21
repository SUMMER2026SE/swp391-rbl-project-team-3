import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, MessageSquare, TrendingUp, ThumbsUp, Search,
  BarChart3, Reply, X,
} from 'lucide-react';
import { useFeedbackController } from '../../controllers/useFeedbackController';
import FeedbackCard, { StarDisplay, CRITERIA_META } from '../shared/FeedbackCard';

// ─── Reply Modal ──────────────────────────────────────────────────────────────
function ReplyModal({ feedback, onClose, onSubmit }) {
  const [text, setText] = useState(feedback.adminReply?.text || '');
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-slate-800">Phản hồi đánh giá</h4>
          <button onClick={onClose} className="border-none bg-transparent text-slate-400 cursor-pointer hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-sm text-slate-600 italic">
          {(() => {
            if (feedback.doctorComment || feedback.technicianComment) {
              return (
                <div className="space-y-1 not-italic text-left">
                  {feedback.doctorComment && <p><span className="font-bold text-slate-400">BS:</span> "{feedback.doctorComment}"</p>}
                  {feedback.technicianComment && <p><span className="font-bold text-slate-400">KTV:</span> "{feedback.technicianComment}"</p>}
                </div>
              );
            }
            return `"${feedback.comment || 'Chưa có nhận xét'}"`;
          })()}
        </div>
        <textarea
          value={text} onChange={e => setText(e.target.value)}
          placeholder="Nhập phản hồi chân thành từ phòng khám..."
          rows={4} maxLength={300}
          className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 resize-none min-h-[100px]"
        />
        <p className="text-xs text-slate-400 text-right mt-1 mb-4">{text.length}/300</p>
        <div className="flex gap-3">
          <button
            onClick={() => { if (text.trim()) onSubmit(text); }}
            disabled={!text.trim()}
            className={`flex-1 py-2.5 rounded-xl text-white font-semibold text-sm border-none cursor-pointer transition-all ${
              text.trim()
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-md'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Gửi phản hồi
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm bg-white cursor-pointer hover:bg-slate-50">
            Hủy
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ReceptionistFeedbackView() {
  // Use the controller's loaded `feedbacks` state — getAllFeedbacks() is async
  // and returned a Promise, which made `published`/`filtered` undefined and
  // crashed the tab on `filtered.length`.
  const { feedbacks, isLoading, getStats, replyToFeedback, updateStatus } = useFeedbackController();
  const published = (Array.isArray(feedbacks) ? feedbacks : []).filter(f => f.status === 'published');
  const stats = getStats(published);

  const [search, setSearch]           = useState('');
  const [filterRating, setFilterRating] = useState(0);
  const [replyTarget, setReplyTarget]   = useState(null);

  const filtered = published?.filter?.(f => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (f.patientName || '').toLowerCase().includes(q) ||
      (f.doctorName || '').toLowerCase().includes(q) ||
      (f.comment || '').toLowerCase().includes(q);
    const matchRating = !filterRating || f.overallRating === filterRating;
    return matchSearch && matchRating;
  });

  const handleReplySubmit = (text) => {
    replyToFeedback(replyTarget.id, text);
    setReplyTarget(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Đánh giá bệnh nhân</h2>
        <p className="text-sm text-slate-500 mt-1">Xem và phản hồi đánh giá từ bệnh nhân về dịch vụ phòng khám</p>
      </div>
      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Điểm TB', value: stats.avg > 0 ? `${stats.avg}★` : '—', color: 'amber', icon: Star },
          { label: 'Tổng đánh giá', value: stats.total, color: 'sky', icon: MessageSquare },
          {
            label: 'Hài lòng (4-5★)',
            value: stats.total ? `${Math.round(((stats.distribution[4]+stats.distribution[5])/stats.total)*100)}%` : '—',
            color: 'emerald', icon: ThumbsUp,
          },
          {
            label: 'Chờ phản hồi',
            value: published?.filter?.(f => !f.adminReply).length,
            color: 'rose', icon: Reply,
          },
        ]?.map?.((s, i) => {
          const CARD_COLORS = {
            amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-500', val: 'text-amber-700' },
            sky: { bg: 'bg-sky-50', border: 'border-sky-100', text: 'text-sky-500', val: 'text-sky-700' },
            emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-500', val: 'text-emerald-700' },
            rose: { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-500', val: 'text-rose-700' },
          };
          const colors = CARD_COLORS[s.color] || CARD_COLORS.sky;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`${colors.bg} border ${colors.border} rounded-2xl p-4 text-center`}
            >
              <s.icon className={`w-5 h-5 ${colors.text} mx-auto mb-2`} />
              <p className={`text-2xl font-black ${colors.val}`}>{s.value}</p>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{s.label}</p>
            </motion.div>
          );
        })}
      </div>
      {/* Rating distribution */}
      {stats.total > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" /> Phân bổ sao
          </p>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1]?.map?.(star => {
              const count = stats.distribution[star] || 0;
              const pct   = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-slate-600">{star}</span>
                  </div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-400 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm bệnh nhân, bác sĩ, nội dung..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <span className="text-xs text-slate-400 mr-1">Lọc:</span>
          {[0, 5, 4, 3, 2, 1]?.map?.(r => (
            <button
              key={r}
              onClick={() => setFilterRating(r === filterRating ? 0 : r)}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold border-none cursor-pointer transition-all ${
                filterRating === r && r > 0 ? 'bg-amber-400 text-white' :
                r === 0 ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' :
                'bg-transparent text-slate-500 hover:bg-amber-50'
              }`}
            >
              {r === 0 ? 'Tất cả' : `${r}★`}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 font-medium">{filtered.length} đánh giá</span>
      </div>
      {/* List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl">
            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-semibold">Đang tải đánh giá...</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered?.map?.(fb => (
            <FeedbackCard
              key={fb.id}
              fb={fb}
              showPatient
              showDoctor
              onReply={setReplyTarget}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-semibold">Không tìm thấy đánh giá nào.</p>
          </div>
        )}
      </div>
      <AnimatePresence>
        {replyTarget && (
          <ReplyModal
            feedback={replyTarget}
            onClose={() => setReplyTarget(null)}
            onSubmit={handleReplySubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
