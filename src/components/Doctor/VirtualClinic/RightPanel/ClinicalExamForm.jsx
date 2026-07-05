import React from 'react';
import { Clipboard, HeartPulse } from 'lucide-react';
import GlassCard, { GLASS_INPUT } from '../../../common/GlassCard';

export default function ClinicalExamForm({
  symptoms = '',
  onSymptomsChange,
  doctorNotes = '',
  onNotesChange,
  isReviewMode = false,
}) {
  return (
    <GlassCard className="p-6 mb-6 text-left">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-200/40">
        <HeartPulse className="w-5 h-5 text-teal-600 animate-pulse" />
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Hỏi bệnh & Đánh giá lâm sàng</h3>
      </div>
      
      <div className="space-y-4">
        {/* Symptoms Section */}
        <div>
          <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Clipboard className="w-3.5 h-3.5 text-slate-400" />
            Triệu chứng lâm sàng & Lý do khám
          </label>
          <textarea
            value={symptoms}
            onChange={(e) => onSymptomsChange && onSymptomsChange(e.target.value)}
            readOnly={isReviewMode}
            className={`${GLASS_INPUT} w-full p-4 text-sm font-semibold text-gray-900 resize-none rounded-xl ${
              isReviewMode ? 'bg-slate-100/50 cursor-not-allowed' : ''
            }`}
            placeholder="Nhập triệu chứng bệnh nhân mô tả, quan sát lâm sàng (ví dụ: mụn bọc sưng đỏ ở má, da tiết dầu nhiều, ngứa...)"
            rows="3"
          />
        </div>

        {/* Condition Assessment / Doctor Advice Section */}
        <div>
          <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5 text-slate-400" />
            Đánh giá tình trạng
          </label>
          <textarea
            value={doctorNotes}
            onChange={(e) => onNotesChange && onNotesChange(e.target.value)}
            readOnly={isReviewMode}
            className={`${GLASS_INPUT} w-full p-4 text-sm font-semibold text-gray-900 resize-none rounded-xl ${
              isReviewMode ? 'bg-slate-100/50 cursor-not-allowed' : ''
            }`}
            placeholder="Nhập đánh giá tình trạng da của bệnh nhân..."
            rows="3"
          />
        </div>
      </div>
    </GlassCard>
  );
}
