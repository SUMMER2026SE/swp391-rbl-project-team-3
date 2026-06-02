import React from 'react';
import { User, Activity, AlertTriangle } from 'lucide-react';
import { mockPatients } from '../../../../mockData';

export default function PatientVitals({ patientId }) {
  const patient = mockPatients?.find(p => p.id === patientId) || mockPatients[0];

  return (
    <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 mb-6">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200/40">
        <User className="w-5 h-5 text-teal-600" />
        <h3 className="font-extrabold text-lg text-slate-900">Thông tin Bệnh nhân</h3>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <img
          alt={`Ảnh hồ sơ bệnh nhân ${patient?.fullName}`}
          className="w-24 h-24 rounded-2xl border-2 border-white shadow-md object-cover"
          src={patient?.avatar}
        />
        <div className="flex-1 w-full space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <h2 className="font-extrabold text-xl text-slate-900">{patient?.fullName}</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {patient?.gender} • Sinh: {patient?.dob}
              </p>
            </div>
            <span className="bg-sky-50 text-sky-700 px-3 py-1 rounded-full font-bold text-xs border border-sky-200/20">
              ID: {patient?.id}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Lịch sử bệnh lý
              </p>
              <div className="flex flex-wrap gap-1">
                {patient?.medicalHistory?.map((history, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-semibold">
                    {history}
                  </span>
                )) || <span className="text-xs text-slate-500">Không có</span>}
              </div>
            </div>
            
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-500" /> Dị ứng
              </p>
              <p className="font-extrabold text-sm text-rose-600 bg-rose-50 border border-rose-200/30 px-2 py-0.5 rounded-lg inline-block">
                Penicillin
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
