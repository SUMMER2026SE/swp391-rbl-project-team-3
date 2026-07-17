/**
 * FeedbackCard — shared component dùng cho tất cả actors:
 * - Patient: xem feedback của mình
 * - Doctor / Technician: xem feedback từ bệnh nhân về mình
 * - Admin / Receptionist: quản lý toàn bộ
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Stethoscope, Calendar, Clock, Sparkles, Wrench,
  Building2, ChevronDown, ChevronUp, Reply, Eye, EyeOff,
  Flag, MessageSquare, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ─── Star Display ─────────────────────────────────────────────────────────────
export function StarDisplay({ value, size = 'sm' }) {
  const sz = { lg: 'w-6 h-6', md: 'w-4 h-4', sm: 'w-3.5 h-3.5', xs: 'w-3 h-3' }[size] || 'w-3.5 h-3.5';
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5]?.map?.(s => (
        <Star
          key={s}
          className={`${sz} ${s <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`}
        />
      ))}
    </span>
  );
}

// ─── Criteria labels ──────────────────────────────────────────────────────────
export const CRITERIA_META = [
  { key: 'treatmentEffect', label: 'Hiệu quả điều trị',  icon: Sparkles,     color: 'text-violet-600' },
  { key: 'waitingTime',     label: 'Thời gian chờ',       icon: Clock,        color: 'text-amber-600' },
  { key: 'facility',        label: 'Cơ sở vật chất',      icon: Building2,    color: 'text-teal-600' },
];

export const RATING_LABELS  = { 1: 'Rất tệ', 2: 'Tệ', 3: 'Bình thường', 4: 'Tốt', 5: 'Xuất sắc' };
export const RATING_COLORS  = {
  1: 'text-rose-600   bg-rose-50   border-rose-200',
  2: 'text-orange-600 bg-orange-50 border-orange-200',
  3: 'text-amber-600  bg-amber-50  border-amber-200',
  4: 'text-sky-600    bg-sky-50    border-sky-200',
  5: 'text-emerald-600 bg-emerald-50 border-emerald-200',
};

const STATUS_STYLES = {
  published: { label: 'Công khai',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  hidden:    { label: 'Đã ẩn',     cls: 'bg-slate-100  text-slate-600   border-slate-200'   },
  flagged:   { label: 'Gắn cờ',    cls: 'bg-rose-50    text-rose-700    border-rose-200'    },
};

// ─── FeedbackCard ─────────────────────────────────────────────────────────────
/**
 * Props:
 *   fb            — feedback object
 *   showPatient   — hiển thị tên bệnh nhân (admin / doctor view)
 *   showDoctor    — hiển thị tên bác sĩ (patient view)
 *   showStatus    — hiển thị badge trạng thái (admin view)
 *   onReply       — callback (fb) => void   (admin only)
 *   onToggleHide  — callback (fb) => void   (admin only)
 *   onFlag        — callback (fb) => void   (admin only)
 *   highlightKey  — criteria key để highlight (e.g. 'technician' for KTV view)
 */
export default function FeedbackCard({
  fb,
  showPatient  = false,
  showDoctor   = true,
  showStatus   = false,
  onReply,
  onToggleHide,
  onFlag,
  highlightKey,
}) {
  const { user } = useAuth();
  const role = user?.role;
  const isMyFeedback = user?.id === fb.patientId;

  const [expanded, setExpanded] = useState(false);

  const statusMeta = STATUS_STYLES[fb.status] || STATUS_STYLES.published;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all ${
        fb.status === 'hidden' ? 'opacity-60 border-slate-200' :
        fb.status === 'flagged' ? 'border-rose-200' : 'border-slate-200'
      }`}
    >
      {/* Top colour stripe based on rating */}
      <div className={`h-1 ${
        fb.overallRating >= 4 ? 'bg-gradient-to-r from-emerald-400 to-teal-400' :
        fb.overallRating === 3 ? 'bg-gradient-to-r from-amber-400 to-yellow-400' :
        'bg-gradient-to-r from-rose-400 to-orange-400'
      }`} />
      <div className="p-5">
        {/* ── Header row ── */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${
              fb.isAnonymous
                ? 'bg-violet-200 text-violet-700'
                : 'bg-gradient-to-br from-amber-400 to-orange-400'
            }`}>
              {fb.isAnonymous ? '?' : (fb.patientName || '?').charAt(0)}
            </div>
            <div>
              {showPatient && (
                <p className="text-sm font-bold text-slate-800 leading-none mb-0.5">
                  {fb.isAnonymous ? 'Bệnh nhân' : fb.patientName}
                </p>
              )}
              {showDoctor && (
                <p className="text-sm font-bold text-slate-800 leading-none mb-0.5 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-500" />
                  {fb.doctorName}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <Calendar className="w-3 h-3" />
                <span>{fb.date}</span>
                <span className="text-slate-200">•</span>
                <span className="truncate max-w-[180px]">{fb.service}</span>
              </div>
            </div>
          </div>

          {/* Rating + badges */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {(() => {
              const displayRating = highlightKey === 'technician' ? (fb.technicianRating || fb.overallRating) : fb.overallRating;
              const safeRating = Math.max(1, Math.min(5, Math.round(displayRating || 5)));
              return (
                <>
                  <StarDisplay value={displayRating} size="sm" />
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RATING_COLORS[safeRating] || ''}`}>
                    {RATING_LABELS[safeRating]}
                  </span>
                </>
              );
            })()}
            {showStatus && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.cls}`}>
                {statusMeta.label}
              </span>
            )}
          </div>
        </div>

        {/* ── Comment ── */}
        <div className="text-sm text-slate-700 leading-relaxed mb-3 italic">
          {(() => {
            const canSeePrivate = role === 'admin' || role === 'doctor' || role === 'technician' || isMyFeedback;
            
            const docCommentStr = fb.doctorComment;
            const isDocPublic = fb.isDoctorPublic ?? true;
            const techCommentStr = fb.technicianComment;
            const isTechPublic = fb.isTechnicianPublic ?? true;

            const showDoc = docCommentStr && (isDocPublic || canSeePrivate);
            const showTech = techCommentStr && (isTechPublic || canSeePrivate);

            // Fallback for old feedbacks if any
            if (!docCommentStr && !techCommentStr && fb.comment) {
               return <p>"{fb.comment}"</p>;
            }

            if (!showDoc && !showTech) {
              return <p className="text-slate-400 italic">Đánh giá đã được ẩn hoặc chưa có nhận xét.</p>;
            }

            if (highlightKey === 'technician') {
              if (!showTech) return <p className="text-slate-400 italic">Nhận xét đã được ẩn.</p>;
              return <p>"{techCommentStr}" {!isTechPublic && <span className="text-[10px] text-slate-400 font-semibold">(Ẩn)</span>}</p>;
            } else if (highlightKey === 'doctor') {
              if (!showDoc) return <p className="text-slate-400 italic">Nhận xét đã được ẩn.</p>;
              return <p>"{docCommentStr}" {!isDocPublic && <span className="text-[10px] text-slate-400 font-semibold">(Ẩn)</span>}</p>;
            } else {
              return (
                <div className="space-y-2 not-italic text-left">
                  {showDoc && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        Bác sĩ {fb.overallRating ? <StarDisplay value={fb.overallRating} size="xs" /> : null}
                      </span>
                      <p className="text-sm text-slate-700 italic">"{docCommentStr}" {!isDocPublic && <span className="text-[9px] text-slate-400 font-semibold">(Ẩn)</span>}</p>
                    </div>
                  )}
                  {showTech && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        Kỹ thuật viên {fb.technicianRating ? <StarDisplay value={fb.technicianRating} size="xs" /> : null}
                      </span>
                      <p className="text-sm text-slate-700 italic">"{techCommentStr}" {!isTechPublic && <span className="text-[9px] text-slate-400 font-semibold">(Ẩn)</span>}</p>
                    </div>
                  )}
                </div>
              );
            }
          })()}
        </div>

        {/* ── Images ── */}
        {fb.images?.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {fb.images?.map?.((img, i) => (
              <img
                key={i} src={img} alt=""
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
              />
            ))}
          </div>
        )}

        {/* ── Admin / clinic reply ── */}
        {fb.adminReply && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-3">
            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 mb-1">
              <Reply className="w-3 h-3" /> Phản hồi từ phòng khám
            </p>
            <p className="text-xs text-emerald-800 leading-relaxed">{fb.adminReply.text}</p>
          </div>
        )}

        {/* ── Criteria expand ── */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer mb-1"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Ẩn' : 'Xem'} đánh giá chi tiết
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-slate-50 border border-slate-100 rounded-xl p-3 mt-1">
                {CRITERIA_META?.map?.(({ key, label, icon: Icon, color }) => {
                  const val = fb.criteriaRatings?.[key] || 0;
                  if (!val) return null;
                  const isHighlighted = key === highlightKey;
                  return (
                    <div
                      key={key}
                      className={`flex items-center justify-between gap-2 px-1 py-0.5 rounded-lg ${isHighlighted ? 'bg-amber-50' : ''}`}
                    >
                      <span className={`text-[10px] font-semibold flex items-center gap-1 ${isHighlighted ? 'text-amber-700' : 'text-slate-500'}`}>
                        <Icon className={`w-3 h-3 ${color}`} /> {label}
                        {isHighlighted && <span className="text-amber-500">★</span>}
                      </span>
                      <StarDisplay value={val} size="xs" />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Action row (admin only) ── */}
        {(onReply || onToggleHide || onFlag) && (
          <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t border-slate-100">
            {onReply && (
              <button
                onClick={() => onReply(fb)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all cursor-pointer"
              >
                <Reply className="w-3 h-3" />
                {fb.adminReply ? 'Sửa phản hồi' : 'Phản hồi'}
              </button>
            )}
            {onToggleHide && fb.status !== 'hidden' && (
              <button
                onClick={() => onToggleHide(fb, 'hidden')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <EyeOff className="w-3 h-3" /> Ẩn
              </button>
            )}
            {onToggleHide && fb.status === 'hidden' && (
              <button
                onClick={() => onToggleHide(fb, 'published')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
              >
                <Eye className="w-3 h-3" /> Hiện lại
              </button>
            )}
            {onFlag && fb.status !== 'flagged' && (
              <button
                onClick={() => onFlag(fb)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
              >
                <Flag className="w-3 h-3" /> Gắn cờ
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
