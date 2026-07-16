/**
 * MedicalRecordTab.jsx
 * ───────────────────────────────────────────────────────────────────────────
 * Apple-Health-inspired, view-only patient record with strict progressive
 * disclosure. Data-over-labels typography throughout: muted micro-labels sit
 * above massive, bold, high-contrast values.
 *
 * Layout
 *   1. Vital strip          — 4 mini glass-cards (blood type / weight / height / BP)
 *   2. Allergies + family   — highlighted alert card (red) or comforting green
 *   3. Tiền sử bệnh án       — 2 recent + "Xem thêm" (ProgressiveList)
 *   4. Lịch sử khám bệnh     — glowing vertical timeline, 2 recent + "Xem thêm"
 *   5. Phác đồ điều trị      — active treatments w/ progress (soft emerald)
 */
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Stethoscope, Calendar, ChevronRight, Sparkles, FileText,
} from 'lucide-react';
import MedicalRecordDetailModal from '../../PatientPortal/MedicalRecordDetailModal';
import GlassPagination from '../../common/GlassPagination';
import { useAuth } from '../../../context/AuthContext';
import { GLASS_BASE } from '../../common/GlassCard';

const SEVERITY_TONE = {
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  sky: 'bg-sky-50 text-sky-600 border-sky-100',
};

// ── Section shell ────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, subtitle, accent = 'text-primary', tint = 'bg-primary/10', children, index = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', damping: 26, stiffness: 140 }}
      className={`${GLASS_BASE} rounded-[1.75rem] p-6`}
    >
      <div className="flex items-center gap-3 mb-5">
        <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tint} ${accent}`}>
          <Icon className="w-5 h-5" />
        </span>
        <div>
          <h4 className="text-lg font-extrabold text-on-surface leading-tight tracking-tight">{title}</h4>
          {subtitle && <p className="text-sm font-medium text-on-surface-variant/70">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.section>
  );
}



// Timeline shows exactly one page of visits; older visits live on next pages.
const PAGE_SIZE = 5;

export default function MedicalRecordTab({ profile }) {
  const { user } = useAuth();
  const { medicalHistory = [], clinicalHistory = [], activeTreatments = [] } = profile.medical || {};
  const [selected, setSelected] = useState(null);
  const [visitPage, setVisitPage] = useState(1);
  const pagedVisits = clinicalHistory.slice((visitPage - 1) * PAGE_SIZE, visitPage * PAGE_SIZE);

  const renderVisit = (c, i) => (
    <div key={c.id || i} className="relative pl-11">
      {/* node */}
      <span className="absolute left-[11px] top-3 w-4 h-4 rounded-full bg-white border-[3px] border-primary
                       shadow-[0_0_10px_rgba(0,104,95,0.5)] z-10" />
      <div className="rounded-2xl bg-white/65 border border-white/60 backdrop-blur-xl p-4 hover:bg-white/80 transition-colors">
        {/* date pill */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2.5">
          <Calendar className="w-3.5 h-3.5" /> {c.date}
          <span className="text-primary/50 font-semibold">• {c.specialty}</span>
        </span>
        {/* diagnosis = hero data */}
        <p className="text-sm font-medium text-on-surface-variant/70">Chẩn đoán</p>
        <p className="text-lg font-extrabold text-on-surface leading-snug">
          {c.diagnosis}
          {c.diagnosisCode && <span className="text-sm font-bold text-on-surface-variant/40"> · {c.diagnosisCode}</span>}
        </p>
        <div className="flex items-center justify-between gap-3 mt-2.5">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-on-surface-variant/80">
            <Stethoscope className="w-4 h-4 text-emerald-500" /> {c.doctor}
          </span>
          <button
            onClick={() => setSelected(c.record)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:gap-2.5
                       transition-all bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-full border-none cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" /> Hồ sơ chi tiết
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-2xl font-extrabold text-on-surface tracking-tight">Hồ sơ bệnh án</h3>
        <p className="text-sm font-medium text-on-surface-variant/70 mt-1 leading-relaxed">
          Bản tổng hợp sức khỏe của bạn — chỉ xem. Liên hệ phòng khám để cập nhật.
        </p>
      </div>
      {/* ── 4. Clinical timeline (progressive) ── */}
      <Section icon={Stethoscope} title="Lịch sử khám bệnh" subtitle="Dòng thời gian các lần khám"
        accent="text-sky-600" tint="bg-sky-50" index={1}>
        {clinicalHistory.length ? (
          <div className="space-y-4">
            <div className="relative space-y-4">
              {/* glowing vertical spine */}
              <span className="absolute left-[18px] top-3 bottom-3 w-[3px] rounded-full
                               bg-gradient-to-b from-primary via-sky-400/70 to-transparent
                               shadow-[0_0_14px_rgba(0,104,95,0.35)]" />
              {pagedVisits?.map?.(renderVisit)}
            </div>

            {/* Numbered pagination — older visits live on the next pages */}
            <GlassPagination
              total={clinicalHistory.length}
              page={visitPage}
              pageSize={PAGE_SIZE}
              onPageChange={setVisitPage}
              className="pt-1"
            />
          </div>
        ) : (
          <EmptyState text="Chưa có lịch sử khám bệnh." />
        )}
      </Section>



      {/* Prescription / record detail modal */}
      <AnimatePresence>
        {selected && <MedicalRecordDetailModal record={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-white/50">
      <FileText className="w-7 h-7 text-slate-300 mx-auto mb-2" />
      <p className="text-sm font-medium text-on-surface-variant/70">{text}</p>
    </div>
  );
}
