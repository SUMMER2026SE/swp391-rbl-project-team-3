import React, { useState } from 'react';
import { Calendar, Check, Clock } from 'lucide-react';
import { doctors } from '../../mockData';

export default function WorkSchedule({ doctorId }) {
  const doctor = doctors?.find(doc => doc?.id === doctorId) || doctors[0];
  const [confirmedShifts, setConfirmedShifts] = useState({});

  const handleConfirmShift = (day) => {
    setConfirmedShifts(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight">Lịch làm việc</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Lịch ca trực tuần này của {doctor?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctor?.schedule?.map((shift, index) => {
          const isConfirmed = confirmedShifts[shift.day];
          
          return (
            <div key={index} className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -z-10 transition-all duration-500 ${isConfirmed ? 'bg-emerald-500/10' : 'bg-sky-500/5 group-hover:bg-sky-500/10'}`}></div>
              
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 shadow-inner border ${isConfirmed ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 'bg-sky-50 text-sky-600 border-sky-100/50'}`}>
                  <Calendar className="w-6 h-6" />
                </div>
                {isConfirmed && (
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Đã xác nhận
                  </span>
                )}
              </div>

              <h3 className="font-extrabold text-xl text-slate-900 mb-2">{shift.day}</h3>
              <div className="flex items-center gap-2 text-slate-600 font-medium mb-6 bg-white/50 p-3 rounded-xl border border-slate-100">
                <Clock className="w-4 h-4 text-slate-400" />
                {shift.hours}
              </div>

              <button 
                onClick={() => handleConfirmShift(shift.day)}
                className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  isConfirmed 
                    ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
                    : 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30'
                }`}
              >
                {isConfirmed ? 'Hủy xác nhận' : 'Xác nhận ca'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
