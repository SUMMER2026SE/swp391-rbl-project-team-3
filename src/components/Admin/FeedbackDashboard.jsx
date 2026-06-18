import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassSelect from '../common/GlassSelect';
import {
  Star, MessageSquare, TrendingUp, Eye, EyeOff, Flag,
  CheckCircle2, Filter, Search, ChevronDown, Reply,
  Stethoscope, Clock, Building2, Wrench, Sparkles,
  AlertCircle, X, BarChart3, Users, ThumbsUp,
} from 'lucide-react';
import { useFeedbackController } from '../../controllers/useFeedbackController';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StarDisplay({ value, size = 'sm' }) {
  const sz = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5]?.map?.(s => (
        <Star key={s} className={`${sz} ${s <= value ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
      ))}
    </span>
  );
}

const STATUS_STYLES = {
  published: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Công khai' },
  hidden:    { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200',   label: 'Ẩn' },
  flagged:   { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    label: 'Gắn cờ' },
};

const CRITERIA_META = [
  { key: 'doctor',          label: 'Bác sĩ',               icon: Stethoscope, color: 'emerald' },
  { key: 'technician',      label: 'Kỹ thuật viên',         icon: Wrench,      color: 'sky' },
  { key: 'treatmentEffect', label: 'Hiệu quả điều trị',     icon: Sparkles,    color: 'violet' },
  { key: 'waitingTime',     label: 'Thời gian chờ',          icon: Clock,       color: 'amber' },
  { key: 'facility',        label: 'Cơ sở vật chất',         icon: Building2,   color: 'teal' },
];

const COLOR_BADGE = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sky:     'bg-sky-50 text-sky-700 border-sky-200',
  violet:  'bg-violet-50 text-violet-700 border-violet-200',
  amber:   'bg-amber-50 text-amber-700 border-amber-200',
  teal:    'bg-teal-50 text-teal-700 border-teal-200',
};

// ─── Score Bar ────────────────────────────────────────────────────────────────
function ScoreBar({ value, max = 5, color = 'amber' }) {
  const pct = (value / max) * 100;
  const barColors = { amber: 'bg-amber-400', emerald: 'bg-emerald-500', sky: 'bg-sky-500', violet: 'bg-violet-500', teal: 'bg-teal-500' };
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${barColors[color] || barColors.amber}`}
        />
      </div>
      <span className="text-xs font-bold text-slate-700 w-8 text-right">{value > 0 ? value.toFixed(1) : '—'}</span>
    </div>
  );
}

// ─── Reply Modal ──────────────────────────────────────────────────────────────
function ReplyModal({ feedback, onClose, onSubmit }) {
  const [text, setText] = useState(feedback.adminReply?.text || '');
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-white"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-4">
          <h4 className="font-bold text-slate-800">Phản hồi đánh giá</h4>
          <button onClick={onClose} className="border-none bg-transparent text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-sm text-slate-600 italic">
          "{feedback.comment}"
        </div>
        <textarea
          value={text} onChange={e => setText(e.target.value)}
          placeholder="Nhập phản hồi của phòng khám..."
          rows={4} maxLength={300}
          className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 resize-none"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={() => onSubmit(text)} disabled={!text.trim()}
            className={`flex-1 py-2.5 rounded-xl text-white font-semibold text-sm border-none cursor-pointer ${text.trim() ? 'bg-gradient-to-r from-indigo-500 to-sky-500' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
            Gửi phản hồi
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm bg-white cursor-pointer">Hủy</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Feedback Card (Admin view) ───────────────────────────────────────────────
function FeedbackCard({ fb, onStatusChange, onReply }) {
  const [expanded, setExpanded] = useState(false);
  const s = STATUS_STYLES[fb.status] || STATUS_STYLES.published;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {fb.isAnonymous ? '?' : (fb.patientName || 'B').charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{fb.patientName || 'Bệnh nhân'}</p>
            <p className="text-xs text-slate-400">{fb.date} • {fb.service}</p>
            <p className="text-xs text-slate-400">{fb.doctorName}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StarDisplay value={fb.overallRating} size="sm" />
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
            {s.label}
          </span>
        </div>
      </div>
      {/* Comment */}
      <p className="text-sm text-slate-700 leading-relaxed mb-3 line-clamp-2">{fb.comment}</p>
      {/* Images */}
      {fb.images?.length > 0 && (
        <div className="flex gap-1.5 mb-3">
          {fb.images?.map?.((img, i) => (
            <img key={i} src={img} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
          ))}
        </div>
      )}
      {/* Admin reply */}
      {fb.adminReply && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-3">
          <p className="text-xs font-bold text-indigo-700 mb-1 flex items-center gap-1"><Reply className="w-3 h-3" /> Phản hồi phòng khám</p>
          <p className="text-xs text-indigo-800">{fb.adminReply.text}</p>
        </div>
      )}
      {/* Criteria (expandable) */}
      <button onClick={() => setExpanded(!expanded)}
        className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-3 border-none bg-transparent cursor-pointer">
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        {expanded ? 'Ẩn' : 'Xem'} đánh giá tiêu chí
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-slate-50 rounded-xl p-3">
              {CRITERIA_META?.map?.(({ key, label, color }) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-slate-500">{label}</span>
                  <StarDisplay value={fb.criteriaRatings?.[key] || 0} size="xs" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => onReply(fb)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all cursor-pointer">
          <Reply className="w-3 h-3" /> {fb.adminReply ? 'Sửa phản hồi' : 'Phản hồi'}
        </button>
        {fb.status !== 'hidden' && (
          <button onClick={() => onStatusChange(fb.id, 'hidden')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer">
            <EyeOff className="w-3 h-3" /> Ẩn
          </button>
        )}
        {fb.status === 'hidden' && (
          <button onClick={() => onStatusChange(fb.id, 'published')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer">
            <Eye className="w-3 h-3" /> Hiện lại
          </button>
        )}
        {fb.status !== 'flagged' && (
          <button onClick={() => onStatusChange(fb.id, 'flagged')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer">
            <Flag className="w-3 h-3" /> Gắn cờ
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main FeedbackDashboard ───────────────────────────────────────────────────
export default function FeedbackDashboard() {
  const { feedbacks, getStats, updateStatus, replyToFeedback } = useFeedbackController();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRating, setFilterRating] = useState(0);
  const [replyTarget, setReplyTarget] = useState(null);

  // Filter
  const filtered = feedbacks?.filter?.(f => {
    const matchSearch = search === '' ||
      (f.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.doctorName || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.comment || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || f.status === filterStatus;
    const matchRating = filterRating === 0 || f.overallRating === filterRating;
    return matchSearch && matchStatus && matchRating;
  });

  const stats = getStats(feedbacks?.filter?.(f => f.status === 'published'));

  const handleReplySubmit = (text) => {
    replyToFeedback(replyTarget.id, text);
    setReplyTarget(null);
  };

  // Distribution bar
  const distMax = Math.max(...Object.values(stats.distribution), 1);

  // Static colors lookup to prevent Tailwind class purge
  const CARD_COLORS = {
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      iconBg: 'bg-indigo-100',
      iconText: 'text-indigo-600',
      valText: 'text-indigo-700',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-600',
      valText: 'text-amber-700',
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-600',
      valText: 'text-emerald-700',
    },
    rose: {
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      iconBg: 'bg-rose-100',
      iconText: 'text-rose-600',
      valText: 'text-rose-700',
    },
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng đánh giá', value: stats.total, icon: MessageSquare, color: 'indigo', sub: 'đã ghi nhận' },
          { label: 'Điểm trung bình', value: stats.avg > 0 ? `${stats.avg}★` : '—', icon: Star, color: 'amber', sub: 'trên thang 5 sao' },
          { label: 'Tỷ lệ hài lòng', value: stats.total > 0 ? `${Math.round(((stats.distribution[4] + stats.distribution[5]) / stats.total) * 100)}%` : '—', icon: ThumbsUp, color: 'emerald', sub: '4-5 sao' },
          { label: 'Chờ phản hồi', value: feedbacks?.filter?.(f => !f.adminReply && f.status === 'published').length, icon: Reply, color: 'rose', sub: 'chưa được trả lời' },
        ]?.map?.((s, i) => {
          const colors = CARD_COLORS[s.color] || CARD_COLORS.indigo;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`${colors.bg} border ${colors.border} rounded-2xl p-4`}>
              <div className={`p-2 ${colors.iconBg} rounded-xl w-fit mb-3`}>
                <s.icon className={`w-5 h-5 ${colors.iconText}`} />
              </div>
              <p className={`text-2xl font-bold ${colors.valText}`}>{s.value}</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">{s.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
            </motion.div>
          );
        })}
      </div>
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rating Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" /> Phân bổ đánh giá sao
          </h4>
          <div className="space-y-2">
            {[5,4,3,2,1]?.map?.(star => {
              const count = stats.distribution[star] || 0;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-slate-600">{star}</span>
                  </div>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1 }}
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Criteria Averages */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Điểm trung bình theo tiêu chí
          </h4>
          <div className="space-y-3">
            {CRITERIA_META?.map?.(({ key, label, icon: Icon, color }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold flex items-center gap-1.5 ${COLOR_BADGE[color].split(' ')[1]}`}>
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </span>
                </div>
                <ScoreBar value={stats.criteria[key] ? Math.round(stats.criteria[key] * 10) / 10 : 0} color={color} />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, bác sĩ, nội dung..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
          />
        </div>

        <GlassSelect value={filterStatus} onChange={setFilterStatus}
          options={[{ value: 'all', label: 'Tất cả trạng thái' }, { value: 'published', label: 'Công khai' }, { value: 'hidden', label: 'Đã ẩn' }, { value: 'flagged', label: 'Gắn cờ' }]}
          buttonClassName="px-3 py-2.5 text-sm" />

        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <span className="text-xs text-slate-500 mr-1">Lọc sao:</span>
          {[0,1,2,3,4,5]?.map?.(r => (
            <button key={r} onClick={() => setFilterRating(r === filterRating ? 0 : r)}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold border-none cursor-pointer transition-all ${filterRating === r && r > 0 ? 'bg-amber-400 text-white' : r === 0 ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-transparent text-slate-500 hover:bg-amber-50'}`}>
              {r === 0 ? 'Tất cả' : `${r}★`}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-medium">
          {filtered.length} / {feedbacks.length} đánh giá
        </span>
      </div>
      {/* Feedback List */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered?.map?.(fb => (
            <FeedbackCard
              key={fb.id}
              fb={fb}
              onStatusChange={updateStatus}
              onReply={setReplyTarget}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-semibold">Không tìm thấy đánh giá nào.</p>
          </div>
        )}
      </div>
      {/* Reply Modal */}
      <AnimatePresence>
        {replyTarget && (
          <ReplyModal feedback={replyTarget} onClose={() => setReplyTarget(null)} onSubmit={handleReplySubmit} />
        )}
      </AnimatePresence>
    </div>
  );
}
