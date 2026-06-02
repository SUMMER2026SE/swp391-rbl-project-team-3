import React from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import PatientVitals from './LeftPanel/PatientVitals';
import AISkinAnalysis from './LeftPanel/AISkinAnalysis';
import DiagnosisForm from './RightPanel/DiagnosisForm';
import TreatmentPlanForm from './RightPanel/TreatmentPlanForm';
import PrescriptionForm from './RightPanel/PrescriptionForm';

export default function VirtualClinicWorkspace({ appointment, onBack }) {
  if (!appointment) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Workspace Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-200/50 rounded-full transition-all active:scale-95 text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight">
              Phòng khám ảo
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Đang khám: <span className="font-bold text-slate-700">{appointment?.patientName}</span> • Dịch vụ: {appointment?.service}
            </p>
          </div>
        </div>
      </div>

      {/* Massive Split-Screen Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden min-h-0">
        
        {/* Left Panel: Patient Info & AI Analysis (Scrollable) */}
        <div className="lg:col-span-5 xl:col-span-6 h-full overflow-y-auto pr-2 custom-scrollbar pb-12">
          <PatientVitals patientId={appointment?.patientId} />
          <AISkinAnalysis patientId={appointment?.patientId} />
        </div>

        {/* Right Panel: Action Area (Scrollable) */}
        <div className="lg:col-span-7 xl:col-span-6 h-full flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-4">
            <DiagnosisForm />
            <TreatmentPlanForm />
            <PrescriptionForm appointmentId={appointment?.id} />
          </div>

          {/* Fixed Footer Action inside Right Panel */}
          <div className="pt-4 border-t border-slate-200/50">
            <button 
              onClick={() => {
                alert('Khám xong! Lưu hồ sơ...');
                onBack();
              }}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 px-6 rounded-[1.5rem] font-bold text-lg shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-95 transition-all flex justify-center items-center gap-3"
            >
              <CheckCircle2 className="w-6 h-6" />
              Hoàn tất khám & Lưu hồ sơ
            </button>
          </div>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(203, 213, 225, 0.5);
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.8);
        }
      `}</style>
    </div>
  );
}
