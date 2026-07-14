import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle2, Check, ChevronRight, TestTube2, FileText, Pill, XCircle, MessageSquare, X, Send, Loader2, Clock } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate, animate } from 'framer-motion';

// Left Panel Components
import PatientVitals from './LeftPanel/PatientVitals';
import AISkinAnalysis from './LeftPanel/AISkinAnalysis';
import ClinicalHistory from './LeftPanel/ClinicalHistory';
import AmbientScribePanel from './AmbientScribePanel';

// Right Panel Components
import DiagnosisForm from './RightPanel/DiagnosisForm';
import ClinicalExamForm from './RightPanel/ClinicalExamForm';
import PrescriptionForm from './RightPanel/PrescriptionForm';
import ServiceSelectionForm from './RightPanel/ServiceSelectionForm';
import FollowUpAppointmentForm from './RightPanel/FollowUpAppointmentForm';

import { ChatModel } from '../../../models/ChatModel';
import { useDoctors } from '../../../hooks/useDoctors';
import { ServiceTicketModel } from '../../../models/ServiceTicketModel';
import { MedicalRecordModel } from '../../../models/MedicalRecordModel';
import { PrescriptionModel } from '../../../models/PrescriptionModel';
import { GLASS_BASE, GLASS_INPUT, GLASS_INPUT_FILLED } from '../../common/GlassCard';

import { supabase } from '../../../supabaseClient';

export default function VirtualClinicWorkspace({ appointment, onBack, handleCompleteExamination, handleSendIndications }) {
  const [clinicalStep, setClinicalStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]);
  const [isPressing, setIsPressing] = useState(false);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  // Form states
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [selectedPlanServices, setSelectedPlanServices] = useState([]);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [prescriptionData, setPrescriptionData] = useState({
    medications: [],
    generalInstructions: '',
    followUpDate: '',
    followUpNotes: ''
  });
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [indicationNote, setIndicationNote] = useState('');

  // DB service tickets existing for this appointment
  const [existingTickets, setExistingTickets] = useState([]);
  const [isSavingIndications, setIsSavingIndications] = useState(false);

  // Chat states (from restrict-doctor-chat)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const { doctors } = useDoctors();
  const doctorId = appointment?.doctorId || appointment?.doctor_id || 'doc-01';
  const patientId = appointment?.patientId || appointment?.patient_id || 'pat-01';
  const patientName = appointment?.patientName || appointment?.patient_name || 'Bệnh nhân';
  const activeDoctor = doctors.find(d => d.id === doctorId) || doctors[0] || null;

  const isReviewMode = appointment?.status === 'Đã khám' || appointment?.status === 'Đã thanh toán';

  const loadServiceTickets = async () => {
    if (!appointment?.id) return;
    try {
      const tickets = await ServiceTicketModel.getByAppointmentId(appointment.id);
      setExistingTickets(tickets || []);
      if (tickets && tickets.length > 0) {
        setIndicationNote(tickets[0].doctor_note || '');
      } else {
        setIndicationNote('');
      }
    } catch (err) {
      console.error('[Workspace] Error loading service tickets:', err);
    }
  };

  const loadMedicalRecord = async () => {
    if (!appointment?.id) return;
    try {
      const record = await MedicalRecordModel.getByAppointmentId(appointment.id);
      if (record) {
        setMedicalRecord(record);
        setDiagnosis(record.diagnosis || '');
        setSymptoms(record.symptoms || appointment.symptoms || appointment.reason || '');
        setDoctorNotes(record.doctor_note || '');

        // Load prescription if exists
        const prescription = await PrescriptionModel.getByRecordId(record.record_id);
        if (prescription) {
          const mappedMeds = (prescription.prescription_details || []).map(d => ({
            name: d.medicine?.medicine_name || '',
            dosage: d.dosage || '',
            frequency: d.frequency || '',
            instructions: d.instruction || '',
            quantity: d.quantity || ''
          }));
          
          const examRec = {
            medications: mappedMeds,
            generalInstructions: prescription.note || '',
            followUpDate: record.follow_up_date || '',
            followUpNotes: record.follow_up_notes || ''
          };
          setMedicalRecord(prev => ({ ...prev, ...examRec }));
        }
      } else {
        setMedicalRecord(null);
        setDiagnosis('');
        setSymptoms(appointment.symptoms || appointment.reason || '');
        setDoctorNotes('');
      }
    } catch (err) {
      console.error('[Workspace] Error loading medical record:', err);
    }
  };

  useEffect(() => {
    if (!appointment?.id) return;
    
    setIsInitialLoadDone(false);
    const init = async () => {
      // 1. Fetch default database data
      await Promise.all([loadServiceTickets(), loadMedicalRecord()]);

      // 2. Load draft from localStorage if exists
      const savedDraft = localStorage.getItem(`appointment_draft_${appointment.id}`);
      if (savedDraft && !isReviewMode) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.clinicalStep) setClinicalStep(draft.clinicalStep);
          if (draft.symptoms !== undefined) setSymptoms(draft.symptoms);
          if (draft.diagnosis !== undefined) setDiagnosis(draft.diagnosis);
          if (draft.doctorNotes !== undefined) setDoctorNotes(draft.doctorNotes);
          if (draft.selectedServices !== undefined) setSelectedServices(draft.selectedServices);
          if (draft.indicationNote !== undefined) setIndicationNote(draft.indicationNote);
          if (draft.prescriptionData !== undefined) setPrescriptionData(draft.prescriptionData);
        } catch (err) {
          console.error('Failed to parse draft from localStorage:', err);
        }
      }
      setIsInitialLoadDone(true);
    };

    init();

    // Subscribe to service tickets changes for this appointment (technician completes task)
    const channel = supabase
      .channel(`workspace-service-tickets-${appointment.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_tickets', filter: `appointment_id=eq.${appointment.id}` },
        () => {
          loadServiceTickets(); // ONLY reload tickets so we don't wipe doctor's draft notes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointment]);

  // Initialize draft immediately on mount to mark as "Đang khám"
  useEffect(() => {
    if (!appointment?.id || isReviewMode) return;
    const key = `appointment_draft_${appointment.id}`;
    if (!localStorage.getItem(key)) {
      const initialDraft = {
        clinicalStep: 1,
        symptoms: '',
        diagnosis: '',
        doctorNotes: '',
        selectedServices: [],
        indicationNote: '',
        prescriptionData: {
          medications: [],
          generalInstructions: '',
          followUpDate: '',
          followUpNotes: ''
        }
      };
      localStorage.setItem(key, JSON.stringify(initialDraft));
    }
  }, [appointment?.id, isReviewMode]);

  // Save draft to localStorage on changes
  useEffect(() => {
    if (!appointment?.id || isReviewMode || !isInitialLoadDone) return;
    
    const draft = {
      clinicalStep,
      symptoms,
      diagnosis,
      doctorNotes,
      selectedServices,
      indicationNote,
      prescriptionData
    };
    localStorage.setItem(`appointment_draft_${appointment.id}`, JSON.stringify(draft));
  }, [
    appointment?.id,
    isReviewMode,
    isInitialLoadDone,
    clinicalStep,
    symptoms,
    diagnosis,
    doctorNotes,
    selectedServices,
    indicationNote,
    prescriptionData
  ]);

  const ticketsStatusHash = (existingTickets || []).map(t => `${t.id}:${t.status}`).join(',');

  // AI Ambient Scribe → merge the confirmed draft into the EMR form fields.
  // Existing text the doctor already typed is preserved (draft is appended).
  const mergeText = (prev, next) => {
    const p = (prev || '').trim();
    const n = (next || '').trim();
    if (!n) return prev;
    if (!p) return n;
    if (p.includes(n)) return prev; // avoid duplicating an identical apply
    return `${p}\n${n}`;
  };

  const handleApplyScribeDraft = ({ symptoms: dSymptoms, medicalHistory, assessment, treatmentDirection, followUp, diagnosis: dDiagnosis }) => {
    const symptomsBlock = [dSymptoms, medicalHistory ? `Tiền sử: ${medicalHistory}` : ''].filter(Boolean).join('\n');
    if (symptomsBlock) setSymptoms(prev => mergeText(prev, symptomsBlock));

    const notesBlock = [
      assessment,
      treatmentDirection ? `Hướng điều trị: ${treatmentDirection}` : '',
      followUp ? `Tái khám/Dặn dò: ${followUp}` : '',
    ].filter(Boolean).join('\n');
    if (notesBlock) setDoctorNotes(prev => mergeText(prev, notesBlock));

    if (dDiagnosis) setDiagnosis(dDiagnosis);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [conversation, isChatOpen]);

  // Polling for messages between doctor and current patient
  useEffect(() => {
    if (!isChatOpen || !appointment) return;
    let active = true;

    const fetchMsgs = async () => {
      try {
        const msgs = await ChatModel.getMessagesBetween(patientId, doctorId);
        if (active) setConversation(msgs || []);
      } catch (err) {
        console.error("Error fetching doctor messages:", err);
      }
    };

    fetchMsgs();
    const interval = setInterval(fetchMsgs, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isChatOpen, patientId, doctorId, appointment]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const currentText = inputValue.trim();
    setInputValue('');

    try {
      const newMsg = await ChatModel.addMessage({
        senderId: doctorId,
        senderName: activeDoctor?.name || 'Bác sĩ',
        senderRole: 'DOCTOR',
        receiverId: patientId,
        receiverName: patientName,
        text: currentText
      });

      if (newMsg) {
        setConversation(prev => [...prev, newMsg]);
      }
    } catch (err) {
      console.error("Failed to send doctor message:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* --------------------------------------------------------------
     Interactive Spread & Blur (Part 1).
     -------------------------------------------------------------- */
  const surfaceBlur = useMotionValue(12);
  const surfaceRadius = useMotionValue(16);
  const surfaceBackdrop = useMotionTemplate`blur(${surfaceBlur}px) saturate(140%)`;
  const surfaceBorderRadius = useMotionTemplate`${surfaceRadius}px`;

  const handlePressStart = () => {
    setIsPressing(true);
    animate(surfaceBlur, 24, { type: 'spring', stiffness: 200, damping: 24 });
    animate(surfaceRadius, 20, { type: 'spring', stiffness: 200, damping: 24 });
  };
  const handlePressEnd = () => {
    setIsPressing(false);
    animate(surfaceBlur, 12, { type: 'spring', stiffness: 200, damping: 26 });
    animate(surfaceRadius, 16, { type: 'spring', stiffness: 200, damping: 26 });
  };

  // Graceful step transitions (Part 4): exit up, enter from below, spring.
  const stepTransition = { type: 'spring', stiffness: 260, damping: 20 };
  const stepVariants = {
    initial: { opacity: 0, scale: 0.95, y: 12 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -10 },
  };

  // Calculate new service selections (not yet created in database)
  const newSelections = selectedServices.filter(
    (svc) => !(existingTickets || []).some((t) => t.service_name === svc.name)
  );
  const hasNewSelections = newSelections.length > 0;

  if (!appointment) return null;

  const steps = [
    { id: 1, label: 'Khám lâm sàng & Chẩn đoán', shortLabel: 'Lâm sàng', icon: FileText },
    { id: 2, label: 'Chỉ định cận lâm sàng & Dịch vụ', shortLabel: 'Dịch vụ', icon: TestTube2 },
    { id: 3, label: 'Kê đơn & Hoàn tất', shortLabel: 'Kê đơn', icon: Pill },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden relative text-left">
      {/* Workspace Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            title="Quay lại danh sách khám bệnh"
            className={`p-2.5 ${GLASS_BASE} rounded-full transition-all active:scale-95 text-slate-600 cursor-pointer border-none`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm text-slate-500 font-medium">
              Bệnh nhân: <span className="font-bold text-slate-800">{appointment?.patientName || 'Bệnh nhân'}</span>
              <span className="mx-2 text-slate-300">•</span>
              Dịch vụ: <span className="font-medium text-slate-700">{appointment?.service || '—'}</span>
            </p>
            {isReviewMode && (
              <span className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-500/10 border border-emerald-300/40 px-2.5 py-0.5 rounded-full">
                Chế độ xem lại hồ sơ
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Massive Split-Screen Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden min-h-0">

        {/* Left Panel: Information */}
        <div className="lg:col-span-5 xl:col-span-6 h-full overflow-y-auto pr-2 lg:pr-8 lg:border-r lg:border-white/50 custom-scrollbar pb-12 space-y-6">
          {!isReviewMode && (
            <AmbientScribePanel patientName={patientName} onApply={handleApplyScribeDraft} />
          )}
          <PatientVitals patientId={patientId} />
          <AISkinAnalysis patientId={patientId} ticketsStatusHash={ticketsStatusHash} />
          <ClinicalHistory patientId={patientId} ticketsStatusHash={ticketsStatusHash} />
        </div>

        {/* Right Panel: Actions — Clinical Stepper Area */}
        <div className="lg:col-span-7 xl:col-span-6 h-full flex flex-col min-h-0">

          {/* Clinical Stepper — 3-step clickable progress */}
          <div className="w-full mb-6 shrink-0">
            <div className={`${GLASS_BASE} p-1.5 flex items-center gap-1`}>
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = clinicalStep === step.id;
                const isCompleted = clinicalStep > step.id;
                return (
                  <React.Fragment key={step.id}>
                    {index > 0 && (
                      <div className={`w-5 h-0.5 shrink-0 rounded-full transition-colors duration-300 ${
                        clinicalStep >= step.id ? 'bg-emerald-400' : 'bg-slate-200'
                      }`} />
                    )}
                    <button
                      onClick={() => setClinicalStep(step.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer border-none select-none ${
                        isActive
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          : isCompleted
                            ? 'bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100/90'
                            : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 transition-all duration-300 ${
                        isActive
                          ? 'bg-white/25'
                          : isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200/80 text-slate-500'
                      }`}>
                        {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.id}
                      </div>
                      <span className="hidden sm:inline truncate">{step.shortLabel}</span>
                      <Icon className={`w-4 h-4 shrink-0 sm:hidden ${isActive ? '' : 'opacity-60'}`} />
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
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
            {/* NOTE: no mode="wait" — under React StrictMode it deadlocks on the
                exiting child (stepper advances but content stays stuck). */}
            <AnimatePresence initial={false}>
              {clinicalStep === 1 && (
                <motion.div
                  key="step1"
                  variants={stepVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={stepTransition}
                  className="space-y-6"
                >
                  <ClinicalExamForm
                    symptoms={symptoms}
                    onSymptomsChange={setSymptoms}
                    doctorNotes={doctorNotes}
                    onNotesChange={setDoctorNotes}
                    isReviewMode={isReviewMode}
                  />
                  <DiagnosisForm value={diagnosis} onChange={setDiagnosis} isReviewMode={isReviewMode} />

                  <button
                    onClick={() => setClinicalStep(2)}
                    className="w-full bg-gradient-to-br from-slate-800 to-slate-900 text-white py-4 px-6 rounded-2xl font-bold tracking-tight hover:from-slate-700 hover:to-slate-800 transition-all active:scale-[0.98] flex justify-center items-center gap-2 flex-shrink-0 shadow-lg shadow-slate-900/10 cursor-pointer border-none"
                  >
                    Tiếp tục: Chỉ định cận lâm sàng &amp; Dịch vụ <ChevronRight className="w-5 h-5" />
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
                  className="h-full flex flex-col space-y-6"
                >
                  <ServiceSelectionForm onSelectionChange={setSelectedServices} existingTickets={existingTickets} />

                  {/* Doctor request notes section */}
                  <div className={`${GLASS_BASE} p-5 text-left`}>
                    <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">
                      Ghi chú / Yêu cầu gửi Kỹ thuật viên
                    </label>
                    <textarea
                      value={indicationNote}
                      onChange={(e) => setIndicationNote(e.target.value)}
                      readOnly={isReviewMode}
                      className={`${!isReviewMode && indicationNote?.trim() ? GLASS_INPUT_FILLED : GLASS_INPUT} w-full p-4 text-sm font-semibold text-gray-900 resize-none rounded-xl`}
                      placeholder="Nhập yêu cầu đặc biệt gửi phòng cận lâm sàng (Ví dụ: Soi kỹ vùng má bị đỏ, xét nghiệm AST/ALT trước 12h...)"
                      rows="3"
                    />
                  </div>

                  <div className="flex gap-4 shrink-0">
                    <button
                      onClick={() => setClinicalStep(1)}
                      className={`flex-1 ${GLASS_BASE} text-slate-700 py-4 px-6 rounded-2xl font-bold tracking-tight transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer`}
                    >
                      Quay lại
                    </button>
                    {hasNewSelections ? (
                      <button
                        onClick={async () => {
                          if (isSavingIndications) return;
                          setIsSavingIndications(true);
                          try {
                            await handleSendIndications?.(appointment.id, newSelections, indicationNote);
                          } finally {
                            setIsSavingIndications(false);
                          }
                        }}
                        className="flex-[2] bg-gradient-to-r from-sky-500 to-teal-600 text-white py-4 px-6 rounded-2xl font-bold tracking-tight shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 active:scale-[0.98] transition-all flex justify-center items-center gap-2.5 cursor-pointer border-none"
                      >
                        {isSavingIndications ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            Gửi chỉ định sang phòng Kỹ thuật
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => setClinicalStep(3)}
                        className="flex-[2] bg-gradient-to-br from-slate-800 to-slate-900 text-white py-4 px-6 rounded-2xl font-bold tracking-tight hover:from-slate-700 hover:to-slate-800 transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg shadow-slate-900/10 cursor-pointer border-none"
                      >
                        Tiếp tục: Kê đơn &amp; Hoàn tất <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
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
                    examRecord={medicalRecord} 
                    initialDiagnosis={diagnosis}
                    onChange={setPrescriptionData} 
                  />
                  <FollowUpAppointmentForm appointment={appointment} />

                  {/* Final Action Area */}
                  <div className="pt-6 border-t border-slate-200/50 flex flex-col gap-3 flex-shrink-0">
                    <div className="flex gap-4">
                      <button
                        onClick={() => setClinicalStep(2)}
                        className={`flex-1 ${GLASS_BASE} text-slate-700 py-4 px-6 rounded-2xl font-bold tracking-tight transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer`}
                      >
                        Quay lại
                      </button>
                      {isReviewMode ? (
                        <button
                          onClick={onBack}
                          className="flex-[2] bg-gradient-to-br from-slate-800 to-slate-900 text-white py-4 px-6 rounded-2xl font-bold tracking-tight hover:from-slate-700 hover:to-slate-800 transition-all active:scale-[0.98] flex justify-center items-center gap-2.5 cursor-pointer shadow-lg shadow-slate-900/10 border-none"
                        >
                          <XCircle className="w-5 h-5 mr-1" />
                          Đóng hồ sơ bệnh án
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCompleteExamination(appointment.id, selectedServices, {
                            diagnosis,
                            symptoms,
                            services: selectedPlanServices,
                            doctorNotes,
                            indicationNote,
                            ...prescriptionData
                          })}
                          className="flex-[2] bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-6 rounded-2xl font-bold tracking-tight shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98] transition-all flex justify-center items-center gap-2.5 cursor-pointer border-none"
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
