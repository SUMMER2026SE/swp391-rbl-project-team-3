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
  Droplets, Weight, Ruler, HeartPulse, ShieldAlert, ShieldCheck, Users2,
  Stethoscope, ClipboardList, Pill, Calendar, ChevronRight, Sparkles, FileText,
} from 'lucide-react';
import ProgressiveList from '../ProgressiveList';
import MedicalRecordDetailModal from '../../PatientPortal/MedicalRecordDetailModal';
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

// ── Vital mini-card (data over label) ────────────────────────────────────────
function VitalCard({ icon: Icon, label, value, accent, tint }) {
  return (
    <div className="rounded-2xl bg-white/55 border border-white/60 backdrop-blur-xl px-3 py-5
                    flex flex-col items-center text-center gap-2 transition-transform duration-300 hover:-translate-y-1">
      <span className={`p-3 rounded-2xl ${tint} ${accent}`}>
        <Icon className="w-6 h-6" />
      </span>
      <p className="text-sm font-medium text-on-surface-variant/70 leading-none">{label}</p>
      <p className={`text-2xl font-extrabold leading-tight ${accent}`}>{value}</p>
    </div>
  );
}

export default function MedicalRecordTab({ profile }) {
  const { vitals, medicalHistory = [], clinicalHistory = [], activeTreatments = [] } = profile.medical || {};
  const [selected, setSelected] = useState(null);
  const [showAllVisits, setShowAllVisits] = useState(false);

  const hasAllergies = (vitals?.allergies?.length || 0) > 0;
  const headVisits = clinicalHistory.slice(0, 2);
  const tailVisits = clinicalHistory.slice(2);

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
      {/* ── 1. Vital strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <VitalCard icon={Droplets} label="Nhóm máu" value={vitals?.bloodType || '—'} accent="text-rose-500" tint="bg-rose-50" />
        <VitalCard icon={Weight} label="Cân nặng" value={vitals?.weight ? `${vitals.weight} kg` : '—'} accent="text-indigo-500" tint="bg-indigo-50" />
        <VitalCard icon={Ruler} label="Chiều cao" value={vitals?.height ? `${vitals.height} cm` : '—'} accent="text-sky-500" tint="bg-sky-50" />
      </div>
      {/* ── 2. Allergies ── */}
      <div className={`rounded-[1.75rem] p-6 border ${hasAllergies ? 'bg-rose-50/70 border-rose-100' : 'bg-emerald-50/70 border-emerald-100'}`}>
        <div className="flex items-center gap-3">
          <span className={`p-3 rounded-2xl ${hasAllergies ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 text-emerald-500'}`}>
            {hasAllergies ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </span>
          <div>
            <p className="text-sm font-medium text-on-surface-variant/70 leading-none">Cảnh báo dị ứng</p>
            <p className={`mt-1.5 text-2xl font-extrabold leading-none ${hasAllergies ? 'text-rose-600' : 'text-emerald-600'}`}>
              {hasAllergies ? `${vitals.allergies.length} tác nhân` : 'An toàn'}
            </p>
          </div>
        </div>
        {hasAllergies ? (
          <div className="flex flex-wrap gap-2 mt-4 max-h-[120px] overflow-y-auto pr-2 glass-scrollbar">
            {vitals.allergies?.map?.((a) => (
              <span key={a} className="text-sm font-bold px-3 py-1.5 rounded-full bg-white/80 text-rose-600 border border-rose-100 whitespace-nowrap">
                {a}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm font-medium text-emerald-700/80 leading-relaxed">
            Không có tiền sử dị ứng
          </p>
        )}
      </div>
      {/* ── 3. Medical history (progressive) ── */}
      <Section icon={ClipboardList} title="Tiền sử bệnh án" subtitle="Bệnh lý nền về da & mãn tính"
        accent="text-amber-600" tint="bg-amber-50" index={2}>
        {medicalHistory.length ? (
          <ProgressiveList
            items={medicalHistory}
            initialCount={2}
            moreLabel={`Xem thêm ${Math.max(0, medicalHistory.length - 2)} bệnh lý`}
            renderItem={(m, i) => (
              <div key={m.condition || i} className="rounded-2xl bg-white/65 border border-white/60 backdrop-blur-xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-on-surface-variant/70 leading-none">Chẩn đoán</p>
                    <p className="text-lg font-extrabold text-on-surface mt-1">{m.condition}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full border ${SEVERITY_TONE[m.tone] || SEVERITY_TONE.sky}`}>
                    {m.severity}
                  </span>
                </div>
                <p className="text-sm font-medium text-on-surface-variant/80 mt-2 leading-relaxed">{m.note}</p>
              </div>
            )}
          />
        ) : (
          <EmptyState text="Chưa ghi nhận tiền sử bệnh lý." />
        )}
      </Section>
      {/* ── 4. Clinical timeline (progressive) ── */}
      <Section icon={Stethoscope} title="Lịch sử khám bệnh" subtitle="Dòng thời gian các lần khám"
        accent="text-sky-600" tint="bg-sky-50" index={3}>
        {clinicalHistory.length ? (
          <div className="space-y-4">
            <div className="relative space-y-4">
              {/* glowing vertical spine */}
              <span className="absolute left-[18px] top-3 bottom-3 w-[3px] rounded-full
                               bg-gradient-to-b from-primary via-sky-400/70 to-transparent
                               shadow-[0_0_14px_rgba(0,104,95,0.35)]" />
              {headVisits?.map?.(renderVisit)}
              <AnimatePresence initial={false}>
                {showAllVisits && tailVisits.length > 0 && (
                  <motion.div
                    key="tail-visits"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden space-y-4"
                  >
                    {tailVisits?.map?.(renderVisit)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {tailVisits.length > 0 && (
              <button
                onClick={() => setShowAllVisits((v) => !v)}
                className="group w-full flex items-center justify-center gap-2 py-3 rounded-2xl
                           bg-white/45 hover:bg-white/70 border border-white/60 backdrop-blur-xl
                           text-sm font-bold text-on-surface-variant hover:text-primary shadow-sm transition-all cursor-pointer"
              >
                {showAllVisits ? 'Thu gọn' : `Xem thêm ${tailVisits.length} lần khám`}
                <motion.span animate={{ rotate: showAllVisits ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </motion.span>
              </button>
            )}
          </div>
        ) : (
          <EmptyState text="Chưa có lịch sử khám bệnh." />
        )}
      </Section>
      {/* ── 5. Active treatments ── */}
      <Section icon={Sparkles} title="Phác đồ điều trị hiện tại" subtitle="Liệu trình đang hoạt động & tiến độ"
        accent="text-emerald-600" tint="bg-emerald-50" index={4}>
        {activeTreatments.length ? (
          <ProgressiveList
            items={activeTreatments}
            initialCount={2}
            moreLabel={`Xem thêm ${Math.max(0, activeTreatments.length - 2)} liệu trình`}
            renderItem={(t, i) => (
              <div key={t.id || i} className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold text-on-surface leading-snug">{t.title}</p>
                    <p className="text-sm font-medium text-on-surface-variant/70 mt-0.5">
                      {t.doctor} • {t.duration}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-extrabold text-emerald-700 bg-white/80 border border-emerald-100 px-3 py-1.5 rounded-full">
                    {t.done}/{t.total} buổi
                  </span>
                </div>
                <div className="mt-4">
                  <div className="h-2.5 rounded-full bg-emerald-100/80 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${t.percent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    />
                  </div>
                  <p className="text-xs font-bold text-emerald-600 mt-2">{t.percent}% hoàn thành</p>
                </div>
                {t.notes && (
                  <p className="text-sm font-medium text-on-surface-variant/80 mt-3 leading-relaxed border-t border-emerald-100 pt-3">
                    <span className="font-bold text-on-surface">Ghi chú: </span>{t.notes}
                  </p>
                )}
              </div>
            )}
          />
        ) : (
          <EmptyState text="Hiện không có liệu trình điều trị nào đang hoạt động." />
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
