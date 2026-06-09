import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Check, ChevronRight, UploadCloud, FlaskConical, FileCheck, XCircle, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate, animate } from 'framer-motion';

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
  { key: 'collection', label: 'Thực hiện', sublabel: 'Collection', icon: FlaskConical },
  { key: 'confirmation', label: 'Xác nhận', sublabel: 'Confirmation', icon: FileCheck },
];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function TechnicianWorkspace({ task, onBack, onComplete, isReviewMode }) {
  const [activeStep, setActiveStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [metricValues, setMetricValues] = useState({});
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Cursor glow effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowBackground = useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, rgba(16,185,129,0.04), transparent 80%)`;

  const procedureType = task?.procedureDetails?.type;
  const isImaging = procedureType === 'Imaging';
  const metrics = task?.procedureDetails?.metrics || [];

  // ─── Initialize review mode data ────────────────────────────────────────
  useEffect(() => {
    if (isReviewMode && task?.resultRecord) {
      if (task.resultRecord?.images) {
        setUploadedImages(task.resultRecord.images);
      }
      if (task.resultRecord?.metrics) {
        setMetricValues(task.resultRecord.metrics);
      }
      if (task.resultRecord?.technicianNotes) {
        setTechnicianNotes(task.resultRecord.technicianNotes);
      }
    }
  }, [isReviewMode, task?.resultRecord]);

  // ─── Initialize metric values for empty form ────────────────────────────
  useEffect(() => {
    if (!isReviewMode && metrics?.length > 0) {
      const initial = {};
      metrics.forEach((m) => {
        initial[m] = '';
      });
      setMetricValues((prev) => ({ ...initial, ...prev }));
    }
  }, [isReviewMode, metrics]);

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
    setUploadedImages((prev) => [...prev, newImage]);
  };

  const handleRemoveImage = (imageId) => {
    if (isReviewMode) return;
    setUploadedImages((prev) => prev.filter((img) => img?.id !== imageId));
  };

  const handleMetricChange = (metricName, value) => {
    if (isReviewMode) return;
    setMetricValues((prev) => ({ ...prev, [metricName]: value }));
  };

  const handleComplete = () => {
    if (isReviewMode) {
      onBack?.();
      return;
    }
    const resultRecord = {
      images: isImaging ? uploadedImages : [],
      metrics: !isImaging ? metricValues : {},
      technicianNotes,
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
  const canProceed = () => {
    if (isImaging) {
      return uploadedImages.length > 0;
    }
    return metrics.every((m) => metricValues[m] && String(metricValues[m]).trim() !== '');
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
          {task?.patientName || 'Bệnh nhân'} — {procedureType === 'Imaging' ? 'Chụp hình ảnh' : procedureType === 'LabTest' ? 'Xét nghiệm' : procedureType || 'Thủ thuật'}
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
  //  RENDER: Left Panel — Patient Info
  // ═══════════════════════════════════════════════════════════════════════════
  const renderLeftPanel = () => {
    const initials = (task?.patientName || 'B')?.charAt(0)?.toUpperCase();
    const patientAge = task?.patientAge || task?.age || '—';
    const patientGender = task?.patientGender || task?.gender || '—';
    const patientId = task?.patientId || task?.id || '—';
    const doctorName = task?.assignedBy || task?.doctorName || '—';
    const doctorNotes = task?.notes || task?.doctorNotes || '';

    return (
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 26, delay: 0.1 }}
        className="w-[380px] min-w-[340px] flex flex-col h-full overflow-hidden"
      >
        <div className="glass-3d-soft rounded-2xl p-5 flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
          {/* ── Avatar + Name ── */}
          <motion.div
            className="flex flex-col items-center text-center gap-3 pt-2 pb-1"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.06 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-emerald-200/50">
                {initials}
              </div>
              <motion.div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 border-[3px] border-white flex items-center justify-center"
                {...pulseGlow}
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            </motion.div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {task?.patientName || 'Bệnh nhân'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Mã BN: {patientId}</p>
            </div>
          </motion.div>

          {/* ── Demographics ── */}
          <motion.div
            className="grid grid-cols-2 gap-2"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <div className="glass-inner rounded-xl px-3 py-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Giới tính</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{patientGender}</p>
            </div>
            <div className="glass-inner rounded-xl px-3 py-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Tuổi</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{patientAge}</p>
            </div>
          </motion.div>

          {/* ── Procedure Info Card ── */}
          <motion.div
            className="glass-inner rounded-xl p-4"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2.5">
              Thông tin thủ thuật
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Loại</span>
                <span className="text-sm font-semibold text-slate-900 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  {procedureType === 'Imaging' ? '🖼️ Chụp hình' : procedureType === 'LabTest' ? '🧪 Xét nghiệm' : procedureType || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Bác sĩ chỉ định</span>
                <span className="text-sm font-semibold text-slate-900">{doctorName}</span>
              </div>
              {task?.procedureDetails?.name && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Tên thủ thuật</span>
                  <span className="text-sm font-semibold text-slate-900 text-right max-w-[160px] truncate">
                    {task.procedureDetails.name}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Doctor Notes (Amber Warning Card) ── */}
          {doctorNotes && (
            <motion.div
              className="rounded-xl p-4 bg-amber-50/80 border border-amber-200/60 backdrop-blur-sm"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center">
                  <span className="text-amber-600 text-sm">⚠️</span>
                </div>
                <h3 className="text-xs uppercase tracking-wider text-amber-700 font-semibold">
                  Ghi chú từ Bác sĩ
                </h3>
              </div>
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
                {doctorNotes}
              </p>
            </motion.div>
          )}

          {/* ── Completed At (review mode) ── */}
          {isReviewMode && task?.resultRecord?.completedAt && (
            <motion.div
              className="glass-inner rounded-xl p-3 text-center"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
            >
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Hoàn thành lúc</p>
              <p className="text-sm font-semibold text-emerald-700 mt-0.5">
                {new Date(task.resultRecord.completedAt).toLocaleString('vi-VN')}
              </p>
            </motion.div>
          )}

          <div className="flex-1" />
        </div>
      </motion.div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: Stepper Navigation
  // ═══════════════════════════════════════════════════════════════════════════
  const renderStepper = () => (
    <div className="flex items-center gap-2 px-1 mb-5">
      {STEPS.map((step, index) => {
        const StepIcon = step.icon;
        const isActive = index === activeStep;
        const isCompleted = index < activeStep;

        return (
          <React.Fragment key={step.key}>
            <motion.button
              onClick={() => goToStep(index)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`
                flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-300 flex-1
                ${isActive
                  ? 'stepper-active shadow-[0_8px_32px_rgba(0,0,0,0.04)]'
                  : isCompleted
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'glass-inner text-slate-500 hover:text-slate-700'
                }
              `}
            >
              <div
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300
                  ${isActive
                    ? 'bg-white/30 text-white'
                    : isCompleted
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-slate-100 text-slate-400'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <StepIcon className="w-4 h-4" />
                )}
              </div>
              <div className="text-left min-w-0">
                <p className={`text-sm font-semibold leading-tight ${isActive ? 'text-white' : ''}`}>
                  {step.label}
                </p>
                <p className={`text-[10px] leading-tight mt-0.5 ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                  {step.sublabel}
                </p>
              </div>
            </motion.button>

            {index < STEPS.length - 1 && (
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mx-0.5" />
            )}
          </React.Fragment>
        );
      })}
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
                Nhấn hoặc kéo thả để tải ảnh
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
  //  RENDER: Step 1 Content Router
  // ═══════════════════════════════════════════════════════════════════════════
  const renderStep1 = () => {
    if (isImaging) {
      return renderImagingUpload();
    }
    return renderLabTestMetrics();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: Step 2 — Confirmation
  // ═══════════════════════════════════════════════════════════════════════════
  const renderStep2 = () => {
    const images = isReviewMode ? (task?.resultRecord?.images || uploadedImages) : uploadedImages;
    const currentMetrics = isReviewMode ? (task?.resultRecord?.metrics || metricValues) : metricValues;
    const currentNotes = isReviewMode ? (task?.resultRecord?.technicianNotes || technicianNotes) : technicianNotes;

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
          <h3 className="text-base font-bold text-slate-900">Xác nhận kết quả</h3>
        </div>

        {/* ── Summary Card ── */}
        <motion.div
          className="glass-inner rounded-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
            Tóm tắt kết quả thu thập
          </h4>

          {isImaging ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Số hình ảnh</span>
                <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  {images.length} ảnh
                </span>
              </div>
              {images.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {images.slice(0, 6).map((img, idx) => (
                    <div
                      key={img?.id || `thumb-${idx}`}
                      className="w-14 h-14 rounded-lg overflow-hidden border border-white/50 shadow-sm"
                    >
                      <img
                        src={img?.url}
                        alt={img?.name || `Thumb ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                  {images.length > 6 && (
                    <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <span className="text-xs font-semibold text-slate-500">+{images.length - 6}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.map((metric) => (
                <div key={metric} className="flex items-center justify-between py-1">
                  <span className="text-sm text-slate-600">{metric}</span>
                  <span className="text-sm font-bold text-slate-900">
                    {currentMetrics[metric] || '—'}
                  </span>
                </div>
              ))}
              {metrics.length === 0 && (
                <p className="text-sm text-slate-400 italic">Không có chỉ số nào</p>
              )}
            </div>
          )}
        </motion.div>

        {/* ── Technician Notes ── */}
        <motion.div
          className="glass-inner rounded-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
            Ghi chú kỹ thuật viên
          </label>
          <textarea
            value={isReviewMode ? currentNotes : technicianNotes}
            onChange={(e) => setTechnicianNotes(e.target.value)}
            readOnly={isReviewMode}
            placeholder={isReviewMode ? '—' : 'Nhập ghi chú thêm về quá trình thực hiện...'}
            rows={4}
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

        {/* ── Spacer ── */}
        <div className="flex-1" />

        {/* ── Action Button ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          {!isReviewMode ? (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleComplete}
              disabled={!canProceed()}
              className={`
                w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl
                text-white text-sm font-bold tracking-wide
                shadow-lg transition-all duration-300
                ${canProceed()
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-200/50 cursor-pointer'
                  : 'bg-gradient-to-r from-slate-300 to-slate-400 cursor-not-allowed opacity-60 shadow-none'
                }
              `}
            >
              <CheckCircle2 className="w-5 h-5" />
              Ghi nhận & Hoàn thành
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
      className="flex-1 flex flex-col h-full overflow-hidden min-w-0"
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="glass-3d-soft rounded-2xl p-5 flex flex-col h-full overflow-hidden relative shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
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
      <div className="flex-1 flex gap-5 p-5 overflow-hidden min-h-0">
        {/* Left: Patient Info */}
        {renderLeftPanel()}

        {/* Right: Stepper + Content */}
        {renderRightPanel()}
      </div>
    </motion.div>
  );
}
