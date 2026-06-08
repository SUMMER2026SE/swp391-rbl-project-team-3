import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Check, ChevronRight, TestTube2, FileText, Pill, XCircle } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate, animate } from 'framer-motion';

// Left Panel Components
import PatientVitals from './LeftPanel/PatientVitals';
import AISkinAnalysis from './LeftPanel/AISkinAnalysis';
import ClinicalHistory from './LeftPanel/ClinicalHistory';

// Right Panel Components
import DiagnosisForm from './RightPanel/DiagnosisForm';
import TreatmentPlanForm from './RightPanel/TreatmentPlanForm';
import PrescriptionForm from './RightPanel/PrescriptionForm';
import ServiceSelectionForm from './RightPanel/ServiceSelectionForm';

export default function VirtualClinicWorkspace({ appointment, onBack, handleCompleteExamination }) {
  const [clinicalStep, setClinicalStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]);
  const [isPressing, setIsPressing] = useState(false);

  // Form states
  const [diagnosis, setDiagnosis] = useState('');
  const [selectedPlanServices, setSelectedPlanServices] = useState([]);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [prescriptionData, setPrescriptionData] = useState({
    medications: [],
    generalInstructions: '',
    followUpDate: '',
    followUpNotes: ''
  });

  const isReviewMode = appointment?.status === 'Đã khám';

  useEffect(() => {
    if (isReviewMode && appointment?.examRecord) {
      setDiagnosis(appointment.examRecord.diagnosis || '');
      setSelectedPlanServices(appointment.examRecord.services || []);
      setDoctorNotes(appointment.examRecord.doctorNotes || '');
    }
  }, [isReviewMode, appointment]);

  /* --------------------------------------------------------------
     Interactive Spread & Blur (Part 1).
     -------------------------------------------------------------- */
  const surfaceBlur = useMotionValue(12);
  const surfaceRadius = useMotionValue(28);
  const surfaceBackdrop = useMotionTemplate`blur(${surfaceBlur}px) saturate(140%)`;
  const surfaceBorderRadius = useMotionTemplate`${surfaceRadius}px`;

  const handlePressStart = () => {
    setIsPressing(true);
    animate(surfaceBlur, 24, { type: 'spring', stiffness: 200, damping: 24 });
    animate(surfaceRadius, 40, { type: 'spring', stiffness: 200, damping: 24 });
  };
  const handlePressEnd = () => {
    setIsPressing(false);
    animate(surfaceBlur, 12, { type: 'spring', stiffness: 200, damping: 26 });
    animate(surfaceRadius, 28, { type: 'spring', stiffness: 200, damping: 26 });
  };

  // Graceful step transitions (Part 4): exit up, enter from below, spring.
  const stepTransition = { type: 'spring', stiffness: 260, damping: 20 };
  const stepVariants = {
    initial: { opacity: 0, scale: 0.95, y: 12 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -10 },
  };

  if (!appointment) return null;

  const steps = [
    { id: 1, label: 'Cận lâm sàng', icon: TestTube2 },
    { id: 2, label: 'Chẩn đoán & Phác đồ', icon: FileText },
    { id: 3, label: 'Kê đơn & Hoàn tất', icon: Pill },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Workspace Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 glass-inner hover:bg-white rounded-full transition-all active:scale-95 text-slate-600 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-2xl md:text-3xl text-gradient-emerald tracking-tight leading-none">
              {isReviewMode ? 'Xem lại hồ sơ bệnh án' : 'Phòng khám ảo'}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1.5">
              Bệnh nhân: <span className="font-bold text-slate-800">{appointment?.patientName}</span>
              <span className="mx-2 text-slate-300">•</span>
              Dịch vụ: <span className="font-medium text-slate-700">{appointment?.service}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Massive Split-Screen Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden min-h-0">

        {/* Left Panel: Information */}
        <div className="lg:col-span-5 xl:col-span-6 h-full overflow-y-auto pr-2 lg:pr-8 lg:border-r lg:border-white/50 custom-scrollbar pb-12 space-y-6">
          <PatientVitals patientId={appointment?.patientId} />
          <AISkinAnalysis patientId={appointment?.patientId} />
          <ClinicalHistory patientId={appointment?.patientId} />
        </div>

        {/* Right Panel: Actions — Clinical Stepper Area */}
        <div className="lg:col-span-7 xl:col-span-6 h-full flex flex-col min-h-0">

          {/* Clinical Stepper — responsive horizontal scroll to prevent cutoff */}
          <div className="glass-3d-soft rounded-[1.75rem] p-2.5 mb-8 flex items-stretch gap-1.5 overflow-x-auto hide-scrollbar flex-shrink-0">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = clinicalStep === step.id;
              const isPast = clinicalStep > step.id;

              return (
                <React.Fragment key={step.id}>
                  <motion.button
                    onClick={() => setClinicalStep(step.id)}
                    whileTap={{ scale: 0.97 }}
                    animate={{ scale: isActive ? 1 : 0.97 }}
                    transition={stepTransition}
                    className={`relative flex-1 min-w-0 flex items-center gap-2.5 rounded-2xl px-3 sm:px-4 py-3 border text-left transition-colors duration-300 cursor-pointer ${
                      isActive
                        ? 'stepper-active bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-300/60'
                        : isPast
                          ? 'bg-white text-emerald-700 border-emerald-100 shadow-sm hover:bg-emerald-50/60'
                          : 'bg-white/30 text-slate-400 border-white/50 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                    }`}
                  >
                    <span className={`flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 transition-colors ${
                      isActive ? 'bg-white/25 text-white'
                        : isPast ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isPast ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                    </span>
                    <div className="hidden sm:block min-w-0">
                      <span className={`block text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-white/80' : 'opacity-70'}`}>
                        Bước {step.id}
                      </span>
                      <span className="block text-sm font-semibold leading-tight truncate">{step.label}</span>
                    </div>
                  </motion.button>
                  {index < steps.length - 1 && (
                    <ChevronRight className={`self-center w-4 h-4 flex-shrink-0 transition-colors ${
                      clinicalStep > step.id ? 'text-emerald-400' : 'text-slate-300'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Stepper Content Area — a liquid surface that spreads on press */}
          <motion.div
            onPointerDown={handlePressStart}
            onPointerUp={handlePressEnd}
            onPointerLeave={handlePressEnd}
            style={{
              backdropFilter: surfaceBackdrop,
              WebkitBackdropFilter: surfaceBackdrop,
              borderRadius: surfaceBorderRadius,
            }}
            className={`flex-1 overflow-y-auto overflow-x-hidden p-1.5 pr-2 custom-scrollbar pb-4 relative border transition-colors duration-500 ${
              isPressing ? 'border-emerald-300/50 bg-white/10' : 'border-white/30 bg-white/[0.03]'
            }`}
          >
            <AnimatePresence mode="wait">
              {clinicalStep === 1 && (
                <motion.div
                  key="step1"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={stepTransition}
                  className="h-full flex flex-col space-y-6"
                >
                  <ServiceSelectionForm onSelectionChange={setSelectedServices} />

                  <button
                    onClick={() => setClinicalStep(2)}
                    className="w-full bg-gradient-to-br from-slate-800 to-slate-900 text-white py-4 px-6 rounded-2xl font-bold tracking-tight hover:from-slate-700 hover:to-slate-800 transition-all active:scale-[0.98] flex justify-center items-center gap-2 flex-shrink-0 shadow-lg shadow-slate-900/10 cursor-pointer"
                  >
                    Tiếp tục: Chẩn đoán &amp; Phác đồ <ChevronRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {clinicalStep === 2 && (
                <motion.div
                  key="step2"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={stepTransition}
                  className="space-y-6"
                >
                  <DiagnosisForm value={diagnosis} onChange={setDiagnosis} isReviewMode={isReviewMode} />
                  <TreatmentPlanForm 
                    selectedServices={selectedPlanServices} 
                    onServicesChange={setSelectedPlanServices} 
                    doctorNotes={doctorNotes} 
                    onNotesChange={setDoctorNotes} 
                    isReviewMode={isReviewMode} 
                  />

                  <div className="flex gap-4">
                    <button
                      onClick={() => setClinicalStep(1)}
                      className="flex-1 glass-inner text-slate-700 py-4 px-6 rounded-2xl font-bold tracking-tight hover:bg-white transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer"
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={() => setClinicalStep(3)}
                      className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 text-white py-4 px-6 rounded-2xl font-bold tracking-tight hover:from-slate-700 hover:to-slate-800 transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-slate-900/10 cursor-pointer"
                    >
                      Tiếp tục: Kê đơn &amp; Hoàn tất <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {clinicalStep === 3 && (
                <motion.div
                  key="step3"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={stepTransition}
                  className="h-full flex flex-col space-y-6"
                >
                  <PrescriptionForm 
                    appointmentId={appointment?.id} 
                    isReviewMode={isReviewMode} 
                    examRecord={appointment?.examRecord} 
                    onChange={setPrescriptionData} 
                  />

                  {/* Final Action Area */}
                  <div className="pt-6 border-t border-slate-200/50 flex flex-col gap-3 flex-shrink-0">
                    <div className="flex gap-4">
                      <button
                        onClick={() => setClinicalStep(2)}
                        className="flex-1 glass-inner text-slate-700 py-4 px-6 rounded-2xl font-bold tracking-tight hover:bg-white transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer"
                      >
                        Quay lại
                      </button>
                      {isReviewMode ? (
                        <button
                          onClick={onBack}
                          className="flex-[2] bg-gradient-to-br from-slate-800 to-slate-900 text-white py-4 px-6 rounded-2xl font-bold tracking-tight hover:from-slate-700 hover:to-slate-800 transition-all active:scale-[0.98] flex justify-center items-center gap-2.5 cursor-pointer shadow-lg shadow-slate-900/10"
                        >
                          <XCircle className="w-5 h-5 mr-1" />
                          Đóng hồ sơ bệnh án
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCompleteExamination(appointment.id, selectedServices, {
                            diagnosis,
                            services: selectedPlanServices,
                            doctorNotes,
                            ...prescriptionData
                          })}
                          className="flex-[2] bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-6 rounded-2xl font-bold tracking-tight shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98] transition-all flex justify-center items-center gap-2.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Hoàn tất khám &amp; Lưu hồ sơ
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
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
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
