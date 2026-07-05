import React, { useState, useEffect } from 'react';
import { User, Activity, AlertTriangle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PatientModel } from '../../../../models/PatientModel';
import { GLASS_BASE } from '../../../common/GlassCard';

export default function PatientVitals({ patientId }) {
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    if (patientId) {
      setPatient(PatientModel.getById(patientId));
    }
  }, [patientId]);

  if (!patient) return null;
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`${GLASS_BASE} water-refract rounded-2xl p-6 mb-6`}>
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200/40">
        <User className="w-5 h-5 text-teal-600" />
        <h3 className="font-bold text-lg text-slate-900">Thông tin Bệnh nhân</h3>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <img
          alt={`Ảnh hồ sơ bệnh nhân ${patient?.fullName}`}
          className="w-24 h-24 rounded-2xl border-2 border-white shadow-md object-cover"
          src={patient?.avatar}
        />
        <div className="flex-1 w-full space-y-4">
          {/* Always visible: Name, Gender/DOB, Patient ID */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <h2 className="font-bold text-xl text-slate-900">{patient?.fullName}</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {patient?.gender} • Sinh: {patient?.dob}
              </p>
            </div>
            <span className="bg-sky-50 text-sky-700 px-3 py-1 rounded-full font-bold text-xs border border-sky-200/20">
              ID: {patient?.id}
            </span>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors cursor-pointer"
          >
            <motion.span
              animate={{ rotate: showDetails ? 180 : 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="inline-flex"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.span>
            {showDetails ? 'Thu gọn' : 'Xem thêm chi tiết'}
          </button>

          {/* Collapsible: Medical History & Allergies */}
          <AnimatePresence initial={false}>
            {showDetails && (
              <motion.div
                key="patient-details"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-4 pt-2">
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
                    <p className="font-bold text-sm text-rose-600 bg-rose-50 border border-rose-200/30 px-2 py-0.5 rounded-lg inline-block">
                      Penicillin
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
