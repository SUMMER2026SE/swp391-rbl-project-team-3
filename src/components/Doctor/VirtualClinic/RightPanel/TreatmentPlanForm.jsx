import React from 'react';
import { FileText } from 'lucide-react';

export default function TreatmentPlanForm() {
  return (
    <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 mb-6">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200/40">
        <FileText className="w-5 h-5 text-teal-600" />
        <h3 className="font-extrabold text-lg text-slate-900">Kế hoạch Điều trị</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Chỉ định dịch vụ phòng khám</label>
          <div className="grid grid-cols-2 gap-3">
            {['Chiếu đèn sinh học', 'Peel da hóa học', 'Điện di tinh chất', 'Lấy nhân mụn'].map((service, idx) => (
              <label key={idx} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-sky-50 transition-all text-xs font-semibold text-slate-700">
                <input
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500/30 border-slate-300"
                  type="checkbox"
                />
                <span>{service}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Lời dặn của Bác sĩ</label>
          <textarea
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all resize-none placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
            placeholder="Nhập lời dặn dò, chế độ ăn uống, sinh hoạt..."
            rows="2"
          ></textarea>
        </div>
      </div>
    </div>
  );
}
