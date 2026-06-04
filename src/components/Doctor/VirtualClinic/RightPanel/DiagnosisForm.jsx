import React from 'react';
import { Stethoscope } from 'lucide-react';

export default function DiagnosisForm() {
  return (
    <div className="glass-3d water-refract rounded-[2rem] p-6 mb-6">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200/40">
        <Stethoscope className="w-5 h-5 text-teal-600" />
        <h3 className="font-extrabold text-lg text-slate-900">Chẩn đoán Lâm sàng</h3>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">Chẩn đoán xác định</label>
        <textarea
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all resize-none placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
          placeholder="Nhập chẩn đoán chi tiết (VD: L20.9 Viêm da cơ địa cấp tính)..."
          rows="3"
        ></textarea>
      </div>
    </div>
  );
}
