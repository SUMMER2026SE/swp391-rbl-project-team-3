import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Star, Send, Eye, EyeOff, Image, Stethoscope,
  Clock, Building2, Wrench, Sparkles, CheckCircle2,
  AlertCircle, Camera, Trash2,
} from 'lucide-react';
import { useFeedbackController } from '../../controllers/useFeedbackController';
import { useAuth } from '../../context/AuthContext';

// ─── Star Rating Component ────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 'md', readOnly = false }) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === 'lg' ? 'w-9 h-9' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5]?.map?.((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          className={`transition-transform border-none bg-transparent p-0 ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
        >
          <Star
            className={`${sizeClass} transition-colors ${
              star <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-200 text-slate-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Criteria Config ──────────────────────────────────────────────────────────
const CRITERIA = [
  { key: 'doctor',          label: 'Bác sĩ phụ trách',     icon: Stethoscope,  color: 'emerald', desc: 'Chuyên môn, thái độ, giải thích bệnh tình' },
  { key: 'technician',      label: 'Kỹ thuật viên',         icon: Wrench,       color: 'sky',     desc: 'Kỹ năng thực hiện thủ thuật, tác phong' },
  { key: 'treatmentEffect', label: 'Hiệu quả điều trị',     icon: Sparkles,     color: 'violet',  desc: 'Kết quả điều trị thực tế, cải thiện da' },
  { key: 'waitingTime',     label: 'Thời gian chờ',          icon: Clock,        color: 'amber',   desc: 'Thời gian đợi trước khi được khám' },
  { key: 'facility',        label: 'Cơ sở vật chất',         icon: Building2,    color: 'teal',    desc: 'Phòng khám, trang thiết bị, vệ sinh' },
];

const COLOR_MAP = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'text-emerald-500' },
  sky:     { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200',     icon: 'text-sky-500' },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  icon: 'text-violet-500' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   icon: 'text-amber-500' },
  teal:    { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',    icon: 'text-teal-500' },
};

const RATING_LABELS = { 0: '', 1: 'Rất tệ', 2: 'Tệ', 3: 'Bình thường', 4: 'Tốt', 5: 'Xuất sắc' };
const OVERALL_COLORS = { 0: '', 1: 'text-rose-500', 2: 'text-orange-500', 3: 'text-amber-500', 4: 'text-sky-500', 5: 'text-emerald-500' };

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function FeedbackFormModal({ apt, onClose, onSubmitted }) {
  const { user } = useAuth();
  const { submitFeedback } = useFeedbackController();

  const [step, setStep] = useState(1); // 1: rating, 2: details, 3: success
  const [overallRating, setOverallRating] = useState(0);
  const [criteriaRatings, setCriteriaRatings] = useState({
    doctor: 0, technician: 0, treatmentEffect: 0, waitingTime: 0, facility: 0,
  });
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const canProceedStep1 = overallRating > 0;
  const canSubmit = overallRating > 0 && comment.trim().length >= 10;

  // ── Image Upload ──
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 3) {
      setError('Tối đa 3 ảnh được phép upload.');
      return;
    }
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 5 * 1024 * 1024) { setError('Mỗi ảnh không được vượt quá 5MB.'); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages(prev => [...prev, { url: ev.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError('');
    setIsSubmitting(true);
    try {
      const payload = {
        appointmentId: apt.id,
        patientId: user?.id || 'pat-01',
        patientName: user?.name || apt.patientName || 'Bệnh nhân',
        doctorId: apt.doctorId,
        doctorName: apt.doctorName,
        service: apt.service,
        date: apt.date,
        isAnonymous,
        isPublic,
        overallRating,
        criteriaRatings,
        comment: comment.trim(),
        images: images?.map?.(i => i.url),
      };
      const res = submitFeedback(payload);
      if (res.success) {
        setStep(3);
        setTimeout(() => {
          onSubmitted && onSubmitted(res.feedback);
          onClose();
        }, 2500);
      } else {
        setError(res.error);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 font-sans"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 200 }}
          className="w-full max-w-lg bg-white border border-slate-100 shadow-2xl rounded-[2rem] flex flex-col max-h-[92vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Đánh giá lượt khám</h3>
                <p className="text-xs text-slate-500 mt-0.5">{apt.date} • {apt.doctorName} • {apt.service}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all border-none bg-transparent cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step indicator */}
          {step < 3 && (
            <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 shrink-0">
              {[1, 2]?.map?.((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s ? 'bg-amber-400 text-white shadow-md shadow-amber-400/30' :
                    step > s  ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {step > s ? '✓' : s}
                  </div>
                  <span className={`text-xs font-semibold ${step === s ? 'text-slate-800' : 'text-slate-400'}`}>
                    {s === 1 ? 'Đánh giá sao' : 'Chi tiết & Ảnh'}
                  </span>
                  {s < 2 && <div className="w-8 h-0.5 bg-slate-200 mx-1" />}
                </div>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <AnimatePresence mode="wait">

              {/* ── Step 1: Overall + Criteria Ratings ── */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  {/* Overall */}
                  <div className="text-center py-4">
                    <p className="text-sm font-semibold text-slate-500 mb-4">Bạn cảm thấy thế nào về lượt khám này?</p>
                    <StarRating value={overallRating} onChange={setOverallRating} size="lg" />
                    <AnimatePresence>
                      {overallRating > 0 && (
                        <motion.p
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mt-3 text-lg font-bold ${OVERALL_COLORS[overallRating]}`}
                        >
                          {RATING_LABELS[overallRating]}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Criteria */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Đánh giá theo tiêu chí</p>
                    <div className="space-y-2">
                      {CRITERIA?.map?.(({ key, label, icon: Icon, color, desc }) => {
                        const c = COLOR_MAP[color];
                        return (
                          <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border ${c.bg} ${c.border}`}>
                            <div className={`p-1.5 rounded-lg bg-white/70 shrink-0`}>
                              <Icon className={`w-4 h-4 ${c.icon}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-700 leading-none">{label}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{desc}</p>
                            </div>
                            <StarRating
                              value={criteriaRatings[key]}
                              onChange={(v) => setCriteriaRatings(p => ({ ...p, [key]: v }))}
                              size="sm"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: Comment + Images + Privacy ── */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  {/* Comment */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                      Nhận xét chi tiết <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm của bạn... (tối thiểu 10 ký tự)"
                      rows={4}
                      maxLength={500}
                      className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm text-slate-700 resize-none transition-all"
                    />
                    <div className="flex justify-between items-center mt-1.5">
                      {comment.length < 10 && comment.length > 0 && (
                        <p className="text-xs text-rose-500">Cần ít nhất 10 ký tự</p>
                      )}
                      <span className={`text-xs ml-auto font-medium ${comment.length > 450 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {comment.length}/500
                      </span>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                      Ảnh trước/sau điều trị (tuỳ chọn, tối đa 3 ảnh)
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {images?.map?.((img, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group">
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setImages(prev => prev?.filter?.((_, idx) => idx !== i))}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all border-none cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ))}
                      {images.length < 3 && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50 transition-all cursor-pointer bg-transparent"
                        >
                          <Camera className="w-5 h-5" />
                          <span className="text-[10px] font-semibold">Thêm ảnh</span>
                        </button>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                    </div>
                  </div>

                  {/* Privacy */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quyền riêng tư</p>
                    <div
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isAnonymous ? 'bg-violet-50 border-violet-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isAnonymous ? 'bg-violet-100' : 'bg-white border border-slate-200'}`}>
                        {isAnonymous ? <EyeOff className="w-4 h-4 text-violet-600" /> : <Eye className="w-4 h-4 text-slate-400" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${isAnonymous ? 'text-violet-800' : 'text-slate-700'}`}>
                          {isAnonymous ? 'Gửi ẩn danh' : 'Hiển thị tên của bạn'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {isAnonymous ? 'Tên của bạn sẽ được ẩn trên tất cả đánh giá công khai' : 'Tên bạn sẽ hiển thị cùng đánh giá'}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isAnonymous ? 'border-violet-500 bg-violet-500' : 'border-slate-300'}`}>
                        {isAnonymous && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                      </div>
                    </div>

                    <div
                      onClick={() => setIsPublic(!isPublic)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        !isPublic ? 'bg-slate-100 border-slate-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${!isPublic ? 'bg-slate-200' : 'bg-white border border-slate-200'}`}>
                        {isPublic ? <Eye className="w-4 h-4 text-slate-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-700">
                          {isPublic ? 'Công khai đánh giá' : 'Chỉ phòng khám được xem'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {isPublic ? 'Đánh giá hiển thị trên trang bác sĩ và phòng khám' : 'Chỉ Admin và Bác sĩ thấy đánh giá này'}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isPublic ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                        {isPublic && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                      </div>
                    </div>
                  </div>

                </motion.div>
              )}

              {/* ── Step 3: Success ── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                  >
                    <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-5" />
                  </motion.div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Cảm ơn đánh giá của bạn!</h4>
                  <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                    Đánh giá của bạn đã được ghi nhận và giúp chúng tôi cải thiện chất lượng dịch vụ.
                  </p>
                  <div className="mt-4 flex items-center gap-1">
                    {[1,2,3,4,5]?.map?.(s => (
                      <Star key={s} className={`w-6 h-6 ${s <= overallRating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                    ))}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Error */}
            {error && step < 3 && (
              <div className="flex items-start gap-2.5 p-3 mt-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          {step < 3 && (
            <div className="px-6 py-4 border-t border-slate-100 shrink-0">
              <div className="flex gap-3">
                {step === 2 && (
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Quay lại
                  </button>
                )}
                <button
                  onClick={() => {
                    if (step === 1) {
                      if (overallRating === 0) {
                        setError('Vui lòng chọn số sao đánh giá tổng thể.');
                        return;
                      }
                      setError('');
                      setStep(2);
                    } else {
                      if (overallRating === 0) {
                        setError('Vui lòng chọn số sao đánh giá tổng thể.');
                        return;
                      }
                      if (!comment.trim()) {
                        setError('Vui lòng điền nội dung nhận xét chi tiết.');
                        return;
                      }
                      if (comment.trim().length < 10) {
                        setError('Nội dung nhận xét chi tiết phải chứa ít nhất 10 ký tự.');
                        return;
                      }
                      const TOXIC_WORDS = ['đm', 'đéo', 'vcl', 'clm', 'khốn nạn', 'mất dạy', 'lừa đảo', 'cút', 'đĩ', 'mẹ kiếp'];
                      const hasToxic = comment.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"").split(/\s+/).some(w => TOXIC_WORDS.includes(w));
                      if (hasToxic) {
                        setError('Nội dung đánh giá chứa từ ngữ không phù hợp. Vui lòng điều chỉnh lại.');
                        return;
                      }
                      setError('');
                      handleSubmit();
                    }
                  }}
                  disabled={isSubmitting}
                  className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 border-none transition-all ${
                    isSubmitting
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-400 to-orange-400 shadow-md shadow-amber-400/25 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="animate-spin">⏳</span>
                  ) : step === 1 ? (
                    <>Tiếp theo <span className="text-lg">→</span></>
                  ) : (
                    <><Send className="w-4 h-4" /> Gửi đánh giá</>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
