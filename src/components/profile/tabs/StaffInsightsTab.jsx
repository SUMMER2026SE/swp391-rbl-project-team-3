/**
 * StaffInsightsTab.jsx
 * ───────────────────────────────────────────────────────────────────────────
 * "Hồ sơ chuyên sâu" for staff actors (Admin / Doctor / Technician /
 * Receptionist): performance KPIs in frosted mini-cards plus department,
 * specialization and the weekly clinic schedule.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Award, Building2, Sparkles, CalendarDays, TrendingUp } from 'lucide-react';
import { ROLE_METRICS, ROLE_THEME } from '../profileConfig';
import { GLASS_BASE, GLASS_INPUT_RECESSED } from '../../common/GlassCard';

export default function StaffInsightsTab({ profile }) {
  const metrics = ROLE_METRICS[profile.role] || [];
  const theme = ROLE_THEME[profile.role] || ROLE_THEME.DOCTOR;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-extrabold text-on-surface tracking-tight">Hồ sơ chuyên sâu</h3>
        <p className="text-sm text-on-surface-variant/70 mt-0.5">
          Chỉ số hiệu suất và thông tin công tác của bạn.
        </p>
      </div>
      {/* KPI highlight cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {metrics?.map?.((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`${GLASS_BASE} p-5 flex flex-col gap-3 water-refract`}
            >
              <span className={`w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center ${m.accent}`}>
                <Icon className="w-5 h-5" />
              </span>
              <div>
                <p className={`text-3xl font-extrabold leading-none ${m.accent}`}>{m.value ?? '—'}</p>
                <p className="text-xs font-semibold text-on-surface-variant/70 mt-1.5">{m.label}</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-auto">
                <TrendingUp className="w-3.5 h-3.5" /> Cập nhật theo thời gian thực
              </div>
            </motion.div>
          );
        })}
      </div>
      {/* Work info */}
      <div className={`${GLASS_BASE} p-6 grid grid-cols-1 sm:grid-cols-2 gap-4`}>
        <InfoTile icon={Building2} label="Phòng ban" value={profile.department} accent={theme.soft} />
        <InfoTile icon={Award} label="Mã nhân viên" value={profile.employeeId} accent={theme.soft} />
        <InfoTile icon={Sparkles} label="Chuyên môn" value={profile.specialization} accent={theme.soft} full />
      </div>
      {/* Weekly schedule */}
      <div className={`${GLASS_BASE} p-6`}>
        <h4 className="flex items-center gap-2 text-base font-extrabold text-on-surface mb-4">
          <CalendarDays className="w-5 h-5 text-primary" /> Lịch làm việc
        </h4>
        <div className={`${GLASS_INPUT_RECESSED} px-4 py-4 flex items-center justify-between`}>
          <span className="text-sm font-bold text-on-surface">Khung giờ công tác</span>
          <span className="text-sm font-semibold text-primary bg-primary/10 px-3.5 py-1.5 rounded-lg">
            {profile.schedule || 'Chưa cập nhật'}
          </span>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value, accent, full }) {
  return (
    <div className={`${GLASS_INPUT_RECESSED} px-4 py-3.5 flex items-center gap-3 ${full ? 'sm:col-span-2' : ''}`}>
      <span className={`shrink-0 p-2 rounded-lg bg-white shadow-sm ${accent}`}>
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-on-surface truncate">{value || '—'}</p>
      </div>
    </div>
  );
}
