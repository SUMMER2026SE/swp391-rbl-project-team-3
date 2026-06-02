import React from 'react';
import { Pill, Plus } from 'lucide-react';
import { mockPrescriptions } from '../../../../mockData';

export default function PrescriptionForm({ appointmentId }) {
  // Mock finding a pre-filled prescription or create empty
  const prescription = mockPrescriptions?.find(p => p.appointmentId === appointmentId);

  return (
    <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 mb-6">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200/40">
        <div className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-teal-600" />
          <h3 className="font-extrabold text-lg text-slate-900">Đơn thuốc (Toa thuốc)</h3>
        </div>
        <button className="text-teal-600 text-xs font-bold flex items-center gap-1 hover:bg-teal-50 px-3 py-1.5 rounded-xl transition-all">
          <Plus className="w-4 h-4" /> Thêm thuốc
        </button>
      </div>

      <div className="space-y-4">
        {prescription?.medications?.map((med, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-slate-200/60 bg-white/60 shadow-sm relative group">
            <div className="font-bold text-sm text-teal-700 mb-1">{med.name}</div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-400 mr-1">Liều lượng:</span> {med.dosage}
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-400 mr-1">Tần suất:</span> {med.frequency}
              </div>
              <div className="text-xs text-slate-600 col-span-2">
                <span className="font-bold text-slate-400 mr-1">Cách dùng:</span> {med.instructions}
              </div>
            </div>
          </div>
        ))}
        
        {(!prescription || !prescription.medications || prescription.medications.length === 0) && (
          <div className="text-center py-6 text-slate-400 font-medium text-sm border-2 border-dashed border-slate-200 rounded-xl">
            Chưa có thuốc nào được kê. Nhấn "Thêm thuốc" để bắt đầu.
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2 mt-4">Hẹn tái khám</label>
          <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all cursor-pointer focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10">
            <option>Sau 1 tuần</option>
            <option>Sau 2 tuần</option>
            <option>Sau 1 tháng</option>
            <option>Không hẹn lại</option>
          </select>
        </div>
      </div>
    </div>
  );
}
