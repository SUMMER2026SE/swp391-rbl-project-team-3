import React from 'react';
import { Stethoscope } from 'lucide-react';
import GlassCard, { GLASS_INPUT } from '../../../common/GlassCard';

export default function DiagnosisForm({ value = '', onChange, isReviewMode = false }) {
  return (
    <GlassCard className="p-6 mb-6">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200/40">
        <Stethoscope className="w-5 h-5 text-teal-600" />
        <h3 className="font-extrabold text-lg text-slate-900">Chẩn đoán Lâm sàng</h3>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">Chẩn đoán xác định</label>
        <textarea
          value={value || ''}
          onChange={(e) => onChange && onChange(e.target.value)}
          readOnly={isReviewMode}
          className={`${GLASS_INPUT} w-full py-3 px-4 text-sm font-semibold resize-none rounded-xl ${
            isReviewMode ? 'bg-slate-100/50 text-slate-900 font-medium cursor-not-allowed' : ''
          }`}
          placeholder="Nhập chẩn đoán chi tiết (VD: L20.9 Viêm da cơ địa cấp tính)..."
          rows="3"
        ></textarea>
      </div>
    </GlassCard>
  );
}
