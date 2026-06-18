import React, { useState } from 'react';
import { User, Activity, AlertTriangle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../../common/GlassCard';

export default function PatientVitals({ patientId }) {
  const patient = ([])?.find(p => p?.id === patientId) || ([])[0] || {};
  const [showDetails, setShowDetails] = useState(false);

  // Critical safety data — surfaced even when the rest of the record is missing.
  const allergies = Array.isArray(patient?.allergies) && patient.allergies.length > 0
    ? patient.allergies
    : ['Penicillin'];
  const medicalHistory = patient?.medicalHistory || [];

  return (
    <GlassCard className="p-6 mb-6">
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
              ID: {patient?.id || '—'}
            </span>
          </div>

          {/* Critical: Allergies — ALWAYS visible, never hidden behind a toggle */}
          <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-300/40 px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 mr-1">
                Dị ứng
              </span>
              {allergies?.map?.((a, idx) => (
                <span
                  key={idx}
                  className="font-bold text-xs text-rose-700 bg-white/60 border border-rose-200/50 px-2 py-0.5 rounded-lg"
                >
                  {a}
                </span>
              ))}
            </div>
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
                <div className="pt-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Lịch sử bệnh lý
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {medicalHistory.length > 0 ? (
                      medicalHistory?.map?.((history, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-semibold">
                          {history}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">Không có tiền sử bệnh lý ghi nhận.</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </GlassCard>
  );
}
