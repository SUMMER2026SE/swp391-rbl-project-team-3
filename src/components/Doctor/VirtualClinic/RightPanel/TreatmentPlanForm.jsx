import React from 'react';
import { FileText } from 'lucide-react';
import GlassCheckbox from '../../../common/GlassCheckbox';
import GlassCard, { GLASS_INPUT } from '../../../common/GlassCard';

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
    <GlassCard className="p-6 mb-6">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200/40">
        <FileText className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Kế hoạch Điều trị</h3>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">Chỉ định dịch vụ phòng khám</label>
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
                  <GlassCheckbox
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
          <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">Lời dặn của Bác sĩ</label>
          <textarea
            value={doctorNotes || ''}
            onChange={(e) => onNotesChange && onNotesChange(e.target.value)}
            readOnly={isReviewMode}
            className={`${GLASS_INPUT} w-full p-4 text-sm font-semibold text-gray-900 resize-none rounded-xl ${
              isReviewMode ? 'bg-slate-100/50 cursor-not-allowed' : ''
            }`}
            placeholder="Nhập lời dặn dò, chế độ ăn uống, sinh hoạt..."
            rows="2"
          ></textarea>
        </div>
      </div>
    </GlassCard>
  );
}
