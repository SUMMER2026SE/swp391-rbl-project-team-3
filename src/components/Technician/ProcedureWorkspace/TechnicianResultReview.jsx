import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  FlaskConical,
  FileCheck,
  Image as ImageIcon,
  Stethoscope,
  Wrench,
  XCircle,
} from 'lucide-react';
import { GLASS_BASE, GLASS_INPUT_RECESSED } from '../../common/GlassCard';

// ─────────────────────────────────────────────────────────────────────────────
// TechnicianResultReview — READ-ONLY view of a completed service ticket.
//
// Replaces the data-entry `TechnicianWorkspace` (2-step stepper inside an opaque
// near-white sheet) for review mode. This view follows the project's "Liquid
// Glass" baseline: a TRANSPARENT root so the dashboard's teal canvas shows
// through, translucent `GLASS_BASE` cards, and every result visible at once (no
// stepper to read finished results). Mirrors the sectioned-card pattern used by
// MedicalRecordDetailModal so the technician's review matches the rest of the app.
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, type: 'spring', stiffness: 260, damping: 24 },
  }),
};

// Same procedure-type detection the workspace uses, so review classifies a
// ticket identically to how it was captured.
const classifyProcedure = (proc) => {
  const type =
    proc?.procedureType || proc?.procedure || proc?.name || proc?.service || '';
  const detailsType = proc?.procedureDetails?.type;
  const lower = type.toLowerCase();
  const isImaging =
    detailsType === 'Imaging' || lower.includes('soi da') || lower.includes('chụp');
  const isLabTest =
    detailsType === 'LabTest' || lower.includes('xét nghiệm') || lower.includes('máu');
  return { type: type || 'Thủ thuật', isImaging, isLabTest, metrics: proc?.procedureDetails?.metrics || [] };
};

// Small section-header row shared by every result card (icon chip + title).
const SectionHead = ({ icon, title, accent = 'emerald' }) => {
  const accentMap = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    teal: 'bg-teal-50 text-teal-600 border-teal-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };
  return (
    <div className="flex items-center gap-2.5 mb-1">
      <div className={`p-2 rounded-xl border ${accentMap[accent]}`}>{icon}</div>
      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h4>
    </div>
  );
};

export default function TechnicianResultReview({ task, onBack }) {
  const procedures = Array.isArray(task?.procedures) ? task.procedures : [task];

  // Resolve the captured result for a given procedure index. Single-procedure
  // tickets keep their result on resultRecord directly; multi-procedure tickets
  // index into resultsMap (matches mapTicket / TechnicianWorkspace shapes).
  const getResult = (idx) => {
    const rr = task?.resultRecord;
    if (rr?.resultsMap?.[idx]) return rr.resultsMap[idx];
    if (idx === 0 && rr) {
      return {
        images: rr.images || [],
        metrics: rr.metrics || {},
        technicianNotes: rr.technicianNotes || '',
      };
    }
    return { images: [], metrics: {}, technicianNotes: '' };
  };

  const initials = (task?.patientName || 'B')?.charAt(0)?.toUpperCase();
  const patientId = task?.patientId || task?.id || '—';
  const patientGender = task?.patientGender || task?.gender || '—';
  const patientAge = task?.patientAge || task?.age || '—';
  const doctorName = task?.assignedBy || task?.doctorName || '—';
  const doctorNotes = task?.notes || task?.doctorNotes || '';
  const generalNotes = task?.resultRecord?.technicianNotes || '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 w-full max-w-5xl mx-auto"
    >
      {/* ── Header ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="flex items-center gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onBack?.()}
          className={`${GLASS_BASE} rounded-full p-2.5 transition-all duration-200`}
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </motion.button>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-800 to-emerald-700 tracking-tight leading-tight">
            Xem lại kết quả thủ thuật
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 truncate">
            {task?.patientName || 'Bệnh nhân'} — {procedures.length} Chỉ định
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Đã hoàn thành
        </span>
      </motion.div>

      {/* ── Patient + Doctor request (responsive 2-col) ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Patient card */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className={`${GLASS_BASE} p-6 flex flex-col gap-5`}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-200/50 flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900 leading-tight truncate">
                {task?.patientName || 'Bệnh nhân'}
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium truncate">Mã BN: {patientId}</p>
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

        {/* Doctor request card */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className={`${GLASS_BASE} p-6 flex flex-col gap-4`}
        >
          <SectionHead icon={<Stethoscope className="w-4 h-4" />} title="Bác sĩ yêu cầu" accent="sky" />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 border border-slate-200/60 w-fit">
            <span className="text-sm font-bold text-slate-800">{doctorName}</span>
          </div>
          {doctorNotes ? (
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{doctorNotes}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">Không có ghi chú từ bác sĩ.</p>
          )}
        </motion.div>
      </div>

      {/* ── Result cards (one per procedure) ── */}
      {(Array.isArray(procedures) ? procedures : []).map((proc, idx) => {
        const { type, isImaging, isLabTest, metrics } = classifyProcedure(proc);
        const res = getResult(idx);
        const images = res?.images || [];
        const metricValues = res?.metrics || {};
        const accent = isImaging ? 'sky' : isLabTest ? 'emerald' : 'teal';
        const kindLabel = isImaging ? 'Hình ảnh' : isLabTest ? 'Xét nghiệm' : 'Thủ thuật';
        const icon = isImaging ? (
          <ImageIcon className="w-4 h-4" />
        ) : isLabTest ? (
          <FlaskConical className="w-4 h-4" />
        ) : (
          <FileCheck className="w-4 h-4" />
        );

        return (
          <motion.div
            key={proc?.id || idx}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3 + idx}
            className={`${GLASS_BASE} p-6 flex flex-col gap-5`}
          >
            {/* Card header */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </span>
                <h4 className="text-base font-bold text-slate-900 truncate">{type}</h4>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md shrink-0">
                {kindLabel}
              </span>
            </div>

            <SectionHead icon={icon} title="Kết quả ghi nhận" accent={accent} />

            {/* ── Imaging result ── */}
            {isImaging ? (
              images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img, i) => (
                    <div
                      key={img?.id || i}
                      className="relative group rounded-xl overflow-hidden border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
                    >
                      <img
                        src={img?.url}
                        alt={img?.name || `Hình ảnh ${i + 1}`}
                        className="w-full h-32 object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500/90 flex items-center justify-center backdrop-blur-sm">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <ImageIcon className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Không có hình ảnh được ghi nhận</p>
                </div>
              )
            ) : isLabTest && metrics.length > 0 ? (
              /* ── Lab metric grid ── */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {metrics.map((m) => (
                  <div
                    key={m}
                    className="bg-slate-950/5 backdrop-blur-xl border border-white/40 rounded-xl p-3.5 shadow-inner"
                  >
                    <span className="text-teal-950 font-bold text-xs block">{m}</span>
                    <span className="text-slate-900 font-semibold text-base block mt-1 break-words">
                      {metricValues[m] || '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* ── Free-text procedure result ── */
              <div className={`${GLASS_INPUT_RECESSED} flex flex-col gap-2`}>
                <span className="text-teal-950 font-bold text-xs uppercase tracking-wider">
                  Kết quả chi tiết
                </span>
                <p className="text-slate-900 font-semibold text-base break-words whitespace-pre-wrap leading-relaxed">
                  {metricValues.fallbackResult || '—'}
                </p>
              </div>
            )}
          </motion.div>
        );
      })}

      {/* ── General technician notes ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={3 + procedures.length}
        className={`${GLASS_BASE} p-6 flex flex-col gap-4`}
      >
        <SectionHead icon={<Wrench className="w-4 h-4" />} title="Ghi chú kỹ thuật viên" accent="teal" />
        {generalNotes ? (
          <div className={`${GLASS_INPUT_RECESSED} leading-relaxed`}>
            <p className="text-slate-900 font-medium text-base break-words whitespace-pre-wrap">
              {generalNotes}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">Không có ghi chú chung.</p>
        )}
      </motion.div>

      {/* ── Close ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={4 + procedures.length}
      >
        <motion.button
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onBack?.()}
          className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white text-sm font-bold tracking-wide shadow-lg shadow-slate-300/30 transition-all duration-300"
        >
          <XCircle className="w-5 h-5" />
          Đóng hồ sơ
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
