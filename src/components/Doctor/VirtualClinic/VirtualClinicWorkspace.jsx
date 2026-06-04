import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Check, ChevronRight, TestTube2, FileText, Pill } from 'lucide-react';
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

import { mockAppointments, mockAssignedTasks, mockPatients } from '../../../mockData';

export default function VirtualClinicWorkspace({ appointment, onBack }) {
  const [clinicalStep, setClinicalStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [isPressing, setIsPressing] = useState(false);

  /* --------------------------------------------------------------
     Interactive Spread & Blur (Part 1).
     The clinical work surface thickens its backdrop blur and flattens its
     border radius — like a water drop spreading — while the doctor is
     actively pressing / dragging inside it, then springs back on release.
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

  const handleCompleteExamination = () => {
    // Action 1: Find active appointment and mutate status to 'Đã khám'
    const foundApt = mockAppointments?.find(apt => apt.id === appointment.id);
    if (foundApt) {
      foundApt.status = 'Đã khám';
    }

    // Action 2: Task Creation
    if (selectedServices.length > 0) {
      const patient = mockPatients?.find(p => p.id === appointment.patientId);
      selectedServices.forEach((serviceId, index) => {
        let procedureType = '';
        if (serviceId === 'soi-da') procedureType = 'Soi da cắt lớp AI';
        else if (serviceId === 'xet-nghiem-mau') procedureType = 'Xét nghiệm máu (Gan/Thận)';
        else if (serviceId === 'lay-nhan-mun') procedureType = 'Lấy nhân mụn chuẩn y khoa';
        else if (serviceId === 'dien-di') procedureType = 'Điện di Vitamin C';
        else if (serviceId === 'peel-da') procedureType = 'Peel da điều trị mụn';
        else if (serviceId === 'chieu-den') procedureType = 'Chiếu đèn sinh học Omega Light';
        else procedureType = serviceId;

        const newTask = {
          id: `TASK-${Date.now()}-${index}`,
          patientId: appointment.patientId || 'pat-unknown',
          patientName: appointment.patientName || 'Bệnh nhân',
          age: patient?.dob ? (new Date().getFullYear() - new Date(patient.dob).getFullYear()) : 30,
          gender: patient?.gender || 'Nữ',
          procedureType,
          assignedBy: appointment.doctorName || 'Bác sĩ điều trị',
          status: 'Chờ thực hiện',
          requestTime: new Date().toISOString(),
          notes: 'Chỉ định từ phòng khám ảo (Khám lâm sàng)',
          procedureDetails: {
            type: serviceId === 'soi-da' ? 'Imaging' : 'LabTest'
          }
        };
        mockAssignedTasks.push(newTask);
      });
    }

    // Action 3: Toast Notification
    setShowToast(true);

    // Action 4: Timeout to call onBack()
    setTimeout(() => {
      setShowToast(false);
      onBack();
    }, 1000);
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
            className="p-2.5 glass-inner hover:bg-white rounded-full transition-all active:scale-95 text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-black text-3xl md:text-4xl text-gradient-emerald tracking-tight leading-none">
              Phòng khám ảo
            </h1>
            <p className="text-[15px] text-slate-500 font-medium mt-1.5">
              Đang khám: <span className="font-extrabold text-slate-800">{appointment?.patientName}</span>
              <span className="mx-2 text-slate-300">•</span>
              Dịch vụ: <span className="font-semibold text-slate-700">{appointment?.service}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Massive Split-Screen Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden min-h-0">

        {/* Left Panel: Information — separated by a subtle vertical divider */}
        <div className="lg:col-span-5 xl:col-span-6 h-full overflow-y-auto pr-2 lg:pr-8 lg:border-r lg:border-white/50 custom-scrollbar pb-12 space-y-6">
          <PatientVitals patientId={appointment?.patientId} />
          <AISkinAnalysis patientId={appointment?.patientId} />
          <ClinicalHistory patientId={appointment?.patientId} />
        </div>

        {/* Right Panel: Actions — Clinical Stepper Area */}
        <div className="lg:col-span-7 xl:col-span-6 h-full flex flex-col min-h-0">

          {/* Enlarged Clinical Stepper — active step is visually dominant */}
          <div className="glass-3d rounded-[1.75rem] p-3 mb-8 flex items-stretch gap-1.5 sm:gap-2.5">
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
                    className={`relative flex-1 flex items-center gap-3 rounded-2xl px-3 sm:px-4 py-3.5 border text-left transition-colors duration-300 ${
                      isActive
                        ? 'stepper-active bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-300/60'
                        : isPast
                          ? 'bg-white text-emerald-700 border-emerald-100 shadow-sm hover:bg-emerald-50/60'
                          : 'bg-white/30 text-slate-400 border-white/50 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                    }`}
                  >
                    <span className={`flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0 transition-colors ${
                      isActive ? 'bg-white/25 text-white'
                        : isPast ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isPast ? <Check className="w-5 h-5 stroke-[3]" /> : <Icon className="w-5 h-5" />}
                    </span>
                    <div className="hidden sm:block min-w-0">
                      <span className={`block text-[10px] font-extrabold uppercase tracking-wider ${isActive ? 'text-white/80' : 'opacity-70'}`}>
                        Bước {step.id}
                      </span>
                      <span className="block text-sm font-extrabold leading-tight truncate">{step.label}</span>
                    </div>
                  </motion.button>
                  {index < steps.length - 1 && (
                    <ChevronRight className={`self-center w-5 h-5 flex-shrink-0 transition-colors ${
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
                    className="w-full bg-gradient-to-br from-slate-800 to-slate-900 text-white py-4 px-6 rounded-2xl font-extrabold tracking-tight hover:from-slate-700 hover:to-slate-800 transition-all active:scale-[0.98] flex justify-center items-center gap-2 flex-shrink-0 shadow-lg shadow-slate-900/10"
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
                  <DiagnosisForm />
                  <TreatmentPlanForm />

                  <div className="flex gap-4">
                    <button
                      onClick={() => setClinicalStep(1)}
                      className="flex-1 glass-inner text-slate-700 py-4 px-6 rounded-2xl font-extrabold tracking-tight hover:bg-white transition-all active:scale-[0.98] flex justify-center items-center gap-2"
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={() => setClinicalStep(3)}
                      className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 text-white py-4 px-6 rounded-2xl font-extrabold tracking-tight hover:from-slate-700 hover:to-slate-800 transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-slate-900/10"
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
                  <PrescriptionForm appointmentId={appointment?.id} />

                  {/* Final Action Area */}
                  <div className="pt-6 border-t border-slate-200/50 flex flex-col gap-3 flex-shrink-0">
                    <div className="flex gap-4">
                      <button
                        onClick={() => setClinicalStep(2)}
                        className="flex-1 glass-inner text-slate-700 py-4 px-6 rounded-2xl font-extrabold tracking-tight hover:bg-white transition-all active:scale-[0.98] flex justify-center items-center gap-2"
                      >
                        Quay lại
                      </button>
                      <button
                        onClick={handleCompleteExamination}
                        className="flex-[2] bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-6 rounded-2xl font-extrabold tracking-tight shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98] transition-all flex justify-center items-center gap-2.5"
                      >
                        <CheckCircle2 className="w-5 h-5 animate-bounce" />
                        Hoàn tất khám &amp; Lưu hồ sơ
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

      </div>

      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 backdrop-blur-xl bg-emerald-500/90 text-white px-6 py-4 rounded-2xl shadow-lg shadow-emerald-500/20 border border-emerald-400/50 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white animate-pulse" />
          <span className="font-extrabold text-sm">Hồ sơ bệnh án đã lưu thành công!</span>
        </div>
      )}

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
