import React from 'react';
import { FileText } from 'lucide-react';

export default function TreatmentPlanForm({
  selectedServices = [],
  onServicesChange,
  doctorNotes = '',
  onNotesChange,
  isReviewMode = false
}) {
  const services = ['Chiếu đèn sinh học', 'Peel da hóa học', 'Điện di tinh chất', 'Lấy nhân mụn'];

  const handleToggle = (service) => {
    if (selectedServices.includes(service)) {
      onServicesChange && onServicesChange(selectedServices?.filter?.((s) => s !== service));
    } else {
      onServicesChange && onServicesChange([...selectedServices, service]);
    }
  };

  return (
    <div className="glass-3d water-refract rounded-[2rem] p-6 mb-6">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200/40">
        <FileText className="w-5 h-5 text-teal-600" />
        <h3 className="font-extrabold text-lg text-slate-900">Kế hoạch Điều trị</h3>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Chỉ định dịch vụ phòng khám</label>
          <div className="grid grid-cols-2 gap-3">
            {services?.map?.((service, idx) => {
              const checked = selectedServices.includes(service);
              return (
                <label 
                  key={idx} 
                  className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-xs font-semibold ${
                    isReviewMode
                      ? 'border-slate-200/50 bg-slate-100/30 text-slate-800 cursor-not-allowed'
                      : 'border-slate-200 bg-slate-50 cursor-pointer hover:bg-sky-50 text-slate-700'
                  }`}
                >
                  <input
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500/30 border-slate-300 disabled:opacity-85"
                    type="checkbox"
                    checked={checked}
                    onChange={() => !isReviewMode && handleToggle(service)}
                    disabled={isReviewMode}
                  />
                  <span>{service}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Lời dặn của Bác sĩ</label>
          <textarea
            value={doctorNotes}
            onChange={(e) => onNotesChange && onNotesChange(e.target.value)}
            readOnly={isReviewMode}
            className={`w-full border rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all resize-none placeholder-slate-400 ${
              isReviewMode
                ? 'bg-slate-100/50 text-slate-900 font-medium cursor-not-allowed border-slate-200/60'
                : 'bg-slate-50 border-slate-200 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10'
            }`}
            placeholder="Nhập lời dặn dò, chế độ ăn uống, sinh hoạt..."
            rows="2"
          ></textarea>
        </div>
      </div>
    </div>
  );
}
