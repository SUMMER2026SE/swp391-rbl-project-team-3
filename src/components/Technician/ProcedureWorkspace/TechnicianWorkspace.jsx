import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Check, ChevronRight, UploadCloud, FlaskConical, FileCheck, XCircle, Image as ImageIcon, X, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate, animate } from 'framer-motion';
import LiquidTabSwitcher from '../../ui/LiquidTabSwitcher';

// ─── Animation Variants ──────────────────────────────────────────────────────
const stepTransition = { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 };

const stepVariants = {
  enter: (direction) => ({ x: direction > 0 ? 420 : -420, opacity: 0, scale: 0.92 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction) => ({ x: direction < 0 ? 420 : -420, opacity: 0, scale: 0.92 }),
};

const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.015, y: -2, transition: { type: 'spring', stiffness: 400, damping: 20 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, type: 'spring', stiffness: 260, damping: 22 },
  }),
};

const pulseGlow = {
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(16,185,129,0.0)',
      '0 0 0 12px rgba(16,185,129,0.12)',
      '0 0 0 0 rgba(16,185,129,0.0)',
    ],
    transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
  },
};

// ─── Stepper Config ──────────────────────────────────────────────────────────
const STEPS = [
  { id: 0, key: 'collection', label: 'Thực hiện', sublabel: 'Collection', icon: FlaskConical },
  { id: 1, key: 'confirmation', label: 'Xác nhận', sublabel: 'Confirmation', icon: FileCheck },
];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function TechnicianWorkspace({ task, onBack, onComplete, isReviewMode }) {
  const [activeStep, setActiveStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeProcIndex, setActiveProcIndex] = useState(0);
  const [globalNotes, setGlobalNotes] = useState('');

  // Normalize procedures
  const procedures = Array.isArray(task?.procedures) ? task.procedures : [task];

  // Initialize resultsMap state
  const [resultsMap, setResultsMap] = useState(() => {
    if (task?.resultRecord?.resultsMap) {
      return task.resultRecord.resultsMap;
    }
    if (isReviewMode && task?.resultRecord) {
      return {
        0: {
          images: task.resultRecord.images || [],
          metrics: task.resultRecord.metrics || {},
          technicianNotes: task.resultRecord.technicianNotes || ''
        }
      };
    }
    return {};
  });

  // Cursor glow effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowBackground = useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, rgba(16,185,129,0.04), transparent 80%)`;

  // For Debugging
  console.log("Current Active Task in Workspace:", task);

  const currentProcedure = procedures[activeProcIndex];
  const currentResult = resultsMap[activeProcIndex] || { images: [], metrics: {}, technicianNotes: '' };

  const uploadedImages = currentResult.images || [];
  const metricValues = currentResult.metrics || {};

  const procedureType = currentProcedure?.procedureType || currentProcedure?.procedure || currentProcedure?.name || currentProcedure?.service || '';
  const procedureDetailsType = currentProcedure?.procedureDetails?.type;

  const isImaging = procedureDetailsType === 'Imaging' || procedureType.toLowerCase().includes('soi da') || procedureType.toLowerCase().includes('chụp');
  const isLabTest = procedureDetailsType === 'LabTest' || procedureType.toLowerCase().includes('xét nghiệm') || procedureType.toLowerCase().includes('máu');
  const metrics = currentProcedure?.procedureDetails?.metrics || [];

  // ─── Initialize review mode data ────────────────────────────────────────
  useEffect(() => {
    if (isReviewMode && task?.resultRecord) {
      if (task.resultRecord?.resultsMap) {
        setResultsMap(task.resultRecord.resultsMap);
      } else {
        setResultsMap({
          0: {
            images: task.resultRecord.images || [],
            metrics: task.resultRecord.metrics || {},
            technicianNotes: task.resultRecord.technicianNotes || ''
          }
        });
      }
      if (task.resultRecord?.technicianNotes) {
        setGlobalNotes(task.resultRecord.technicianNotes);
      }
    }
  }, [isReviewMode, task?.resultRecord]);

  // ─── Initialize metric values for empty form ────────────────────────────
  useEffect(() => {
    if (!isReviewMode) {
      procedures.forEach((proc, idx) => {
        const pMetrics = proc?.procedureDetails?.metrics || [];
        if (pMetrics.length > 0) {
          setResultsMap((prev) => {
            const existing = prev[idx] || { images: [], metrics: {}, technicianNotes: '' };
            const initialMetrics = { ...existing.metrics };
            let hasChanged = false;
            pMetrics.forEach((m) => {
              if (initialMetrics[m] === undefined) {
                initialMetrics[m] = '';
                hasChanged = true;
              }
            });
            if (hasChanged) {
              return {
                ...prev,
                [idx]: {
                  ...existing,
                  metrics: initialMetrics
                }
              };
            }
            return prev;
          });
        }
      });
    }
  }, [isReviewMode, task]);

  // ─── Navigation ─────────────────────────────────────────────────────────
  const goToStep = (stepIndex) => {
    if (stepIndex === activeStep) return;
    setDirection(stepIndex > activeStep ? 1 : -1);
    setActiveStep(stepIndex);
  };

  const goNext = () => {
    if (activeStep < STEPS.length - 1) {
      setDirection(1);
      setActiveStep((s) => s + 1);
    }
  };

  const goPrev = () => {
    if (activeStep > 0) {
      setDirection(-1);
      setActiveStep((s) => s - 1);
    }
  };

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleAddImage = () => {
    if (isReviewMode) return;
    const newImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: `https://picsum.photos/seed/${Date.now()}/400/300`,
      name: `capture_${uploadedImages.length + 1}.jpg`,
      timestamp: new Date().toISOString(),
    };
    setResultsMap((prev) => ({
      ...prev,
      [activeProcIndex]: {
        ...prev[activeProcIndex],
        images: [...(prev[activeProcIndex]?.images || []), newImage]
      }
    }));
  };

  const handleRemoveImage = (imageId) => {
    if (isReviewMode) return;
    setResultsMap((prev) => ({
      ...prev,
      [activeProcIndex]: {
        ...prev[activeProcIndex],
        images: (prev[activeProcIndex]?.images || []).filter((img) => img?.id !== imageId)
      }
    }));
  };

  const handleMetricChange = (metricName, value) => {
    if (isReviewMode) return;
    setResultsMap((prev) => ({
      ...prev,
      [activeProcIndex]: {
        ...prev[activeProcIndex],
        metrics: {
          ...(prev[activeProcIndex]?.metrics || {}),
          [metricName]: value
        }
      }
    }));
  };

  const handleComplete = () => {
    if (isReviewMode) {
      onBack?.();
      return;
    }
    const firstResult = resultsMap[0] || {};
    const resultRecord = {
      images: firstResult.images || [],
      metrics: firstResult.metrics || {},
      technicianNotes: globalNotes,
      resultsMap,
      completedAt: new Date().toISOString(),
    };
    onComplete?.(task?.id, resultRecord);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  // ─── Validation helpers ─────────────────────────────────────────────────
  const isProcedureComplete = (proc, index) => {
    const pType = proc?.procedureType || proc?.procedure || proc?.name || proc?.service || '';
    const pDetailsType = proc?.procedureDetails?.type;
    const isImg = pDetailsType === 'Imaging' || pType.toLowerCase().includes('soi da') || pType.toLowerCase().includes('chụp');
    const isLab = pDetailsType === 'LabTest' || pType.toLowerCase().includes('xét nghiệm') || pType.toLowerCase().includes('máu');
    const pMetrics = proc?.procedureDetails?.metrics || [];

    const res = resultsMap[index];
    if (!res) return false;

    if (isImg) {
      return Array.isArray(res.images) && res.images.length > 0;
    }
    if (isLab && pMetrics.length > 0) {
      return pMetrics.every((m) => res.metrics && res.metrics[m] && String(res.metrics[m]).trim() !== '');
    }
    return res.metrics && res.metrics.fallbackResult && String(res.metrics.fallbackResult).trim() !== '';
  };

  const canProceed = () => {
    return isProcedureComplete(currentProcedure, activeProcIndex);
  };

  const areAllProceduresComplete = () => {
    return procedures.every((proc, idx) => isProcedureComplete(proc, idx));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: Header
  // ═══════════════════════════════════════════════════════════════════════════
  const renderHeader = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="flex items-center gap-4 px-6 py-4 border-b border-white/20"
    >
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => onBack?.()}
        className="glass-inner hover:bg-white rounded-full p-2.5 transition-all duration-200 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
      >
        <ArrowLeft className="w-5 h-5 text-slate-700" />
      </motion.button>

      <div className="flex-1 min-w-0">
        <h1 className="text-gradient-emerald text-xl font-bold tracking-tight leading-tight">
          {isReviewMode ? 'Xem lại kết quả thủ thuật' : 'Phòng Kỹ thuật Ảo'}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5 truncate">
          {task?.patientName || 'Bệnh nhân'} — {procedures.length} Chỉ định
        </p>
      </div>

      {isReviewMode && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold"
        >
          <Check className="w-3.5 h-3.5" />
          Đã hoàn thành
        </motion.span>
      )}
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: Left Panel — Patient Info & Checklist
  // ═══════════════════════════════════════════════════════════════════════════
  const renderLeftPanel = () => {
    const initials = (task?.patientName || 'B')?.charAt(0)?.toUpperCase();
    const patientAge = task?.patientAge || task?.age || '—';
    const patientGender = task?.patientGender || task?.gender || '—';
    const patientId = task?.patientId || task?.id || '—';
    const doctorName = task?.assignedBy || task?.doctorName || '—';
    const doctorNotes = task?.notes || task?.doctorNotes || '';

    const fallbackNotes = "Ưu tiên làm nhanh, bệnh nhân đang đợi kết quả để kê đơn.";
    const displayNotes = doctorNotes || fallbackNotes;

    return (
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 26, delay: 0.1 }}
        className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-2 pb-2"
      >
        {/* CARD 1: Patient Vitals */}
        <motion.div
          className="glass-3d-soft rounded-3xl p-6 flex flex-col gap-5 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] shrink-0"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-200/50 flex-shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {task?.patientName || 'Bệnh nhân'}
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">Mã BN: {patientId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/50">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Giới tính</p>
              <p className="text-base font-bold text-slate-800 mt-0.5">{patientGender}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Tuổi</p>
              <p className="text-base font-bold text-slate-800 mt-0.5">{patientAge}</p>
            </div>
          </div>
        </motion.div>

        {/* CARD 2: Prescribed Procedures Checklist */}
        <motion.div
          className="glass-3d-soft rounded-3xl p-6 flex flex-col gap-4 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] shrink-0"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Danh sách Chỉ định
            </p>
            <h3 className="text-xs text-slate-500 font-medium">
              Chấp hành thực hiện các chỉ định dưới đây
            </h3>
          </div>

          <div className="flex flex-col gap-2.5">
            {procedures.map((proc, idx) => {
              const pType = proc?.procedureType || proc?.procedure || proc?.name || proc?.service || 'Thủ thuật';
              const isSelected = idx === activeProcIndex;
              const isDone = isProcedureComplete(proc, idx);

              return (
                <button
                  key={idx}
                  onClick={() => setActiveProcIndex(idx)}
                  className={`
                    w-full text-left p-3 rounded-2xl flex items-center justify-between border transition-all duration-300
                    ${isSelected
                      ? 'bg-emerald-50/70 border-emerald-400/80 shadow-[0_4px_16px_rgba(16,185,129,0.08)]'
                      : 'bg-white/40 border-slate-200/50 hover:bg-slate-50/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`
                      w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs
                      ${isSelected
                        ? 'bg-emerald-500 text-white'
                        : isDone
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-slate-100 text-slate-500'
                      }
                    `}>
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs truncate font-semibold ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>
                        {pType}
                      </p>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">
                        {proc?.procedureDetails?.type === 'Imaging' ? 'Hình ảnh' : proc?.procedureDetails?.type === 'LabTest' ? 'Xét nghiệm' : 'Thủ thuật'}
                      </p>
                    </div>
                  </div>

                  {isDone && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* CARD 3: Doctor's Request */}
        <motion.div
          className="glass-3d-soft rounded-3xl p-6 flex flex-col gap-5 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] shrink-0"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Bác sĩ yêu cầu</p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 border border-slate-200/60">
              <span className="text-sm font-bold text-slate-800">{doctorName}</span>
            </div>
          </div>

          <div className="mt-2 flex flex-col">
            <div className="rounded-2xl p-5 bg-amber-50 border border-amber-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-amber-600 text-sm">⚠️</span>
                </div>
                <h4 className="text-xs uppercase tracking-wider text-amber-800 font-bold">
                  Ghi chú / Yêu cầu từ Bác sĩ
                </h4>
              </div>
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap font-medium">
                {displayNotes}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: Stepper Navigation
  // ═══════════════════════════════════════════════════════════════════════════
  const renderStepper = () => (
    <div className="mb-5">
      <LiquidTabSwitcher
        tabs={STEPS}
        activeTab={activeStep}
        onChange={goToStep}
      />
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: Step 1 — Imaging Upload
  // ═══════════════════════════════════════════════════════════════════════════
  const renderImagingUpload = () => {
    const images = isReviewMode ? (task?.resultRecord?.images || uploadedImages) : uploadedImages;

    return (
      <motion.div
        className="flex flex-col gap-4 h-full"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Tải lên hình ảnh thủ thuật</h3>
          {images.length > 0 && (
            <span className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {images.length} ảnh
            </span>
          )}
        </div>

        {/* ── Drag & Drop Zone ── */}
        {!isReviewMode && (
          <motion.div
            onClick={handleAddImage}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleAddImage(); }}
            animate={{
              borderColor: isDragOver
                ? 'rgba(16,185,129,0.6)'
                : 'rgba(16,185,129,0.25)',
              backgroundColor: isDragOver
                ? 'rgba(16,185,129,0.08)'
                : 'rgba(16,185,129,0.02)',
            }}
            whileHover={{ borderColor: 'rgba(16,185,129,0.5)', backgroundColor: 'rgba(16,185,129,0.06)' }}
            transition={{ duration: 0.25 }}
            className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-[2.5px] border-dashed cursor-pointer py-10 px-6 group overflow-hidden"
          >
            {/* Pulse ring behind icon */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={false}
            >
              <motion.div
                className="w-20 h-20 rounded-full border-2 border-emerald-300/30"
                animate={{
                  scale: [1, 1.6, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <UploadCloud className="w-12 h-12 text-emerald-400 group-hover:text-emerald-500 transition-colors duration-200" />
            </motion.div>
            <div className="text-center z-10">
              <p className="text-sm font-semibold text-slate-700">
                Kéo thả hình ảnh vào đây hoặc click để chọn file
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Hỗ trợ JPG, PNG, DICOM — Tối đa 20MB
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Image Previews ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          <AnimatePresence mode="popLayout">
            {images.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-10 text-slate-400"
              >
                <ImageIcon className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Chưa có hình ảnh nào</p>
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {images.map((img, idx) => (
                <motion.div
                  key={img?.id || `img-${idx}`}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.7, y: -10 }}
                  transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                  className="relative group rounded-xl overflow-hidden border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
                >
                  <img
                    src={img?.url}
                    alt={img?.name || `Image ${idx + 1}`}
                    className="w-full h-32 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <p className="text-[10px] text-white font-medium truncate">{img?.name || `capture_${idx + 1}.jpg`}</p>
                  </div>

                  {isReviewMode && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500/90 flex items-center justify-center backdrop-blur-sm">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  {!isReviewMode && (
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(img?.id); }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: Step 1 — Lab Test Metrics
  // ═══════════════════════════════════════════════════════════════════════════
  const renderLabTestMetrics = () => {
    const reviewMetrics = isReviewMode ? (task?.resultRecord?.metrics || {}) : metricValues;

    return (
      <motion.div
        className="flex flex-col gap-4 h-full"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Nhập kết quả xét nghiệm</h3>
          {metrics.length > 0 && (
            <span className="ml-auto text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {metrics.length} chỉ số
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
          {metrics.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <FlaskConical className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Không có chỉ số nào được cấu hình</p>
            </div>
          )}

          {metrics.map((metric, idx) => (
            <motion.div
              key={metric}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={idx}
              className="glass-inner rounded-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
            >
              <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                {metric}
              </label>
              <input
                type="text"
                value={isReviewMode ? (reviewMetrics[metric] ?? '') : (metricValues[metric] ?? '')}
                onChange={(e) => handleMetricChange(metric, e.target.value)}
                readOnly={isReviewMode}
                placeholder={isReviewMode ? '—' : `Nhập giá trị ${metric}...`}
                className={`
                  w-full px-4 py-3 rounded-lg text-sm font-medium text-slate-900 
                  transition-all duration-200 outline-none
                  ${isReviewMode
                    ? 'bg-slate-50 border border-slate-200 cursor-not-allowed text-slate-700'
                    : 'bg-white border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 hover:border-slate-300'
                  }
                `}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: Step 1 — Fallback Form
  // ═══════════════════════════════════════════════════════════════════════════
  const renderFallbackForm = () => {
    const fallbackText = isReviewMode ? (task?.resultRecord?.metrics?.fallbackResult || metricValues.fallbackResult) : metricValues.fallbackResult;

    return (
      <motion.div
        className="flex flex-col gap-4 min-h-[400px] border-2 border-dashed border-emerald-400 bg-emerald-50/50 p-6 rounded-2xl"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <div className="flex items-center gap-2 mb-1">
          <FileCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Nhập kết quả thủ thuật chi tiết</h3>
        </div>

        <div className="flex-1 flex flex-col min-h-[300px]">
          <textarea
            value={fallbackText || ''}
            onChange={(e) => handleMetricChange('fallbackResult', e.target.value)}
            readOnly={isReviewMode}
            placeholder={isReviewMode ? '—' : 'Nhập chi tiết kết quả thủ thuật...'}
            className={`
              flex-1 w-full px-4 py-3 rounded-lg text-sm text-slate-900 resize-none
              transition-all duration-200 outline-none leading-relaxed
              ${isReviewMode
                ? 'bg-slate-50 border border-slate-200 cursor-not-allowed text-slate-700'
                : 'bg-white border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 hover:border-slate-300'
              }
            `}
          />
        </div>
      </motion.div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: Step 1 Content Router
  // ═══════════════════════════════════════════════════════════════════════════
  const renderStep1 = () => {
    if (isImaging) {
      return renderImagingUpload();
    }
    if (isLabTest && metrics.length > 0) {
      return renderLabTestMetrics();
    }
    return renderFallbackForm();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: Step 2 — Confirmation
  // ═══════════════════════════════════════════════════════════════════════════
  const renderStep2 = () => {
    return (
      <motion.div
        className="flex flex-col gap-5 h-full"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        {/* ── Summary Header ── */}
        <div className="flex items-center gap-2 mb-1">
          <FileCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Xác nhận tất cả kết quả</h3>
        </div>

        {/* ── Summary Cards for All Procedures ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
          {procedures.map((proc, idx) => {
            const pType = proc?.procedureType || proc?.procedure || proc?.name || proc?.service || 'Thủ thuật';
            const pDetailsType = proc?.procedureDetails?.type;
            const isImg = pDetailsType === 'Imaging' || pType.toLowerCase().includes('soi da') || pType.toLowerCase().includes('chụp');
            const isLab = pDetailsType === 'LabTest' || pType.toLowerCase().includes('xét nghiệm') || pType.toLowerCase().includes('máu');
            const pMetrics = proc?.procedureDetails?.metrics || [];

            const res = resultsMap[idx] || { images: [], metrics: {} };
            const procImages = res.images || [];
            const procMetrics = res.metrics || {};

            return (
              <motion.div
                key={idx}
                className="glass-inner rounded-2xl p-5 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.03)]"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={idx}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 mb-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    {pType}
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    {isImg ? 'Hình ảnh' : isLab ? 'Xét nghiệm' : 'Khác'}
                  </span>
                </div>

                {isImg ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Số hình ảnh thu thập:</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {procImages.length} ảnh
                      </span>
                    </div>
                    {procImages.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {procImages.map((img, i) => (
                          <div key={img?.id || i} className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                            <img src={img?.url} alt="thumbnail" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : isLab && pMetrics.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {pMetrics.map((m) => (
                      <div key={m} className="bg-slate-50/50 border border-slate-100 p-2.5 rounded-xl">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">{m}</span>
                        <span className="text-sm font-bold text-slate-800 block mt-0.5">{procMetrics[m] || '—'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50/50 border border-slate-100 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Kết quả chi tiết</span>
                    <p className="text-sm font-medium text-slate-800 mt-1 whitespace-pre-wrap">{procMetrics.fallbackResult || '—'}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* ── General Technician Notes ── */}
        <motion.div
          className="glass-inner rounded-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={procedures.length}
        >
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
            Ghi chú kỹ thuật viên (Chung)
          </label>
          <textarea
            value={globalNotes}
            onChange={(e) => setGlobalNotes(e.target.value)}
            readOnly={isReviewMode}
            placeholder={isReviewMode ? '—' : 'Nhập ghi chú chung về quá trình thực hiện toàn bộ chỉ định...'}
            rows={3}
            className={`
              w-full px-4 py-3 rounded-lg text-sm text-slate-900 resize-none
              transition-all duration-200 outline-none leading-relaxed
              ${isReviewMode
                ? 'bg-slate-50 border border-slate-200 cursor-not-allowed'
                : 'bg-white border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 hover:border-slate-300'
              }
            `}
          />
        </motion.div>

        {/* ── Action Button ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={procedures.length + 1}
          className="mt-2"
        >
          {!isReviewMode ? (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleComplete}
              disabled={!areAllProceduresComplete()}
              className={`
                w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl
                text-white text-sm font-bold tracking-wide
                shadow-lg transition-all duration-300
                ${areAllProceduresComplete()
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-200/50 cursor-pointer'
                  : 'bg-gradient-to-r from-slate-300 to-slate-400 cursor-not-allowed opacity-60 shadow-none'
                }
              `}
            >
              <CheckCircle2 className="w-5 h-5" />
              Ghi nhận kết quả & Hoàn thành
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onBack?.()}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white text-sm font-bold tracking-wide shadow-lg shadow-slate-300/30 transition-all duration-300"
            >
              <XCircle className="w-5 h-5" />
              Đóng hồ sơ
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: Right Panel (Stepper + Content)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderRightPanel = () => (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 26, delay: 0.15 }}
      className="lg:col-span-8 flex flex-col h-full overflow-hidden min-w-0"
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col h-full overflow-hidden relative"
        style={{ background: glowBackground }}
      >
        {/* Stepper Nav */}
        {renderStepper()}

        {/* Step Content */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={activeStep}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={stepTransition}
              className="absolute inset-0 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto hide-scrollbar pr-1">
                {activeStep === 0 && renderStep1()}
                {activeStep === 1 && renderStep2()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Bottom Navigation Buttons ── */}
        {activeStep === 0 && !isReviewMode && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-4 border-t border-white/15 mt-3"
          >
            <motion.button
              whileHover={{ scale: 1.02, x: 3 }}
              whileTap={{ scale: 0.98 }}
              onClick={goNext}
              disabled={!canProceed()}
              className={`
                ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                transition-all duration-300
                ${canProceed()
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200/40 hover:shadow-emerald-200/60'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              Tiếp tục
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}

        {activeStep === 0 && isReviewMode && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-4 border-t border-white/15 mt-3"
          >
            <motion.button
              whileHover={{ scale: 1.02, x: 3 }}
              whileTap={{ scale: 0.98 }}
              onClick={goNext}
              className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200/40 hover:shadow-emerald-200/60 transition-all duration-300"
            >
              Xem xác nhận
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}

        {activeStep === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-4 border-t border-white/15 mt-3"
          >
            <motion.button
              whileHover={{ scale: 1.02, x: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={goPrev}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold glass-inner hover:bg-white text-slate-700 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  //  MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-full w-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 overflow-hidden"
    >
      {/* Header */}
      {renderHeader()}

      {/* Split-screen workspace */}
      <div className="flex-1 grid lg:grid-cols-12 gap-6 p-6 overflow-hidden min-h-0">
        {/* Left: Patient Info */}
        {renderLeftPanel()}

        {/* Right: Stepper + Content */}
        {renderRightPanel()}
      </div>
    </motion.div>
  );
}
