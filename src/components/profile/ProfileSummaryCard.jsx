/**
 * ProfileSummaryCard.jsx
 * ───────────────────────────────────────────────────────────────────────────
 * Sticky identity card (left col-span-4 of the bento grid):
 *   • large avatar with hover-blur "change photo" affordance
 *   • name + role tag
 *   • contact quick-actions (Call / Message / Email)
 *   • frosted quick-metric cards using data-over-labels typography
 */
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Phone, MessageSquare, Mail, IdCard, CalendarClock, ShieldCheck } from 'lucide-react';
import { ROLE_THEME, ROLE_METRICS } from './profileConfig';
import { GLASS_BASE } from '../common/GlassCard';

function InfoRow({ icon: Icon, label, value, valueNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/40 border border-white/55">
      <span className="inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant/70">
        <Icon className="w-4 h-4 text-on-surface-variant/50" /> {label}
      </span>
      {valueNode || <span className="text-sm font-bold text-on-surface truncate max-w-[55%] text-right">{value}</span>}
    </div>
  );
}

function QuickAction({ icon: Icon, label, href }) {
  return (
    <a
      href={href}
      className="group flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl
                 bg-white/45 hover:bg-white/75 border border-white/60 backdrop-blur-xl
                 shadow-sm transition-all cursor-pointer no-underline"
    >
      <span className="p-2 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
        <Icon className="w-4 h-4" />
      </span>
      <span className="text-[11px] font-bold text-on-surface-variant/80">{label}</span>
    </a>
  );
}

export default function ProfileSummaryCard({ profile, onAvatarChange }) {
  const fileRef = useRef(null);
  const theme = ROLE_THEME[profile.role] || ROLE_THEME.PATIENT;
  const RoleIcon = theme.icon;

  // Patient and Doctor metrics carry live values; merge them into the config row.
  let metrics = ROLE_METRICS[profile.role] || [];
  if (profile.kind === 'patient' && profile.metrics) {
    metrics = metrics?.map?.((m, i) =>
      i === 0 ? { ...m, value: String(profile.metrics.visits ?? '—') } : m);
  } else if (profile.role === 'DOCTOR' && profile.metrics) {
    metrics = metrics?.map?.((m, i) => {
      if (i === 0) return { ...m, value: String(profile.metrics.successVisits ?? '—') };
      if (i === 1) return { ...m, value: String(profile.metrics.workHours ?? '—') };
      if (i === 2) return { ...m, value: String(profile.metrics.avgRating ?? '—') };
      return m;
    });
  } else if (profile.role === 'TECHNICIAN' && profile.metrics) {
    metrics = metrics?.map?.((m, i) => {
      if (i === 0) return { ...m, value: String(profile.metrics.successVisits ?? '—') };
      if (i === 1) return { ...m, value: String(profile.metrics.workHours ?? '—') };
      return m;
    });
  }

  const handlePick = (e) => {
    const file = e.target.files?.[0];
    if (file) onAvatarChange?.(file);
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 120 }}
      className={`${GLASS_BASE} rounded-[2rem] p-7 h-full flex flex-col items-center text-center`}
    >
      {/* Avatar with hover-blur change overlay */}
      <div className="relative group">
        <div className={`w-36 h-36 rounded-[2.25rem] p-[3px] bg-gradient-to-br ${theme.ring} shadow-xl shadow-emerald-500/20`}>
          <div className="w-full h-full rounded-[2rem] overflow-hidden bg-white flex items-center justify-center">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl font-extrabold text-on-surface/80">{profile.initials}</span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="absolute inset-0 rounded-[2.25rem] flex flex-col items-center justify-center gap-1
                     bg-on-surface/45 backdrop-blur-md text-white opacity-0 group-hover:opacity-100
                     transition-all duration-300 border-none cursor-pointer"
        >
          <Camera className="w-6 h-6" />
          <span className="text-[11px] font-bold">Đổi ảnh</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePick} className="hidden" />
      </div>
      {/* Identity */}
      <h2 className="mt-5 text-2xl font-extrabold text-on-surface tracking-tight leading-tight">
        {profile.name}
      </h2>
      <span className={`inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 rounded-full text-xs font-bold border ${theme.tag}`}>
        <RoleIcon className="w-3.5 h-3.5" />
        {profile.roleLabel}
      </span>
      {profile.kind === 'staff' && (
        <p className="mt-2 text-sm font-semibold text-on-surface-variant/70 leading-relaxed">
          {profile.employeeId} • {profile.department}
        </p>
      )}
      {/* Contact quick-actions removed as per request */}
      {/* Quick metrics — data over labels */}
      <div className="w-full mt-5 pt-5 border-t border-white/50 grid grid-cols-1 gap-2.5">
        {metrics?.map?.((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-white/40 border border-white/55
                         transition-transform duration-300 hover:-translate-y-0.5"
            >
              <span className={`shrink-0 p-2.5 rounded-xl bg-white shadow-sm ${m.accent}`}>
                <Icon className="w-5 h-5" />
              </span>
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium text-on-surface-variant/70 leading-none">{m.label}</p>
                <p className={`mt-1 text-2xl font-extrabold leading-none ${m.accent}`}>{m.value}</p>
                {profile.memberSince && (
                  <p className="mt-1.5 text-[10px] text-on-surface-variant/50 font-medium italic">Tính từ {profile.memberSince}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Administrative info — fills the column, anchored to the bottom */}
      <div className="w-full mt-auto pt-5 border-t border-white/50 space-y-2.5">
        <InfoRow
          icon={ShieldCheck}
          label="Trạng thái hồ sơ"
          valueNode={
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {profile.status || 'Hoạt động'}
            </span>
          }
        />
        <InfoRow
          icon={IdCard}
          label={profile.kind === 'patient' ? 'Mã bệnh nhân' : (profile.role === 'DOCTOR' ? 'Mã bác sĩ / Thẻ nhân viên' : (profile.role === 'RECEPTIONIST' ? 'Mã nhân viên' : (profile.role === 'TECHNICIAN' ? 'Mã nhân viên / Mã KTV' : 'Mã nhân viên / ID Hệ thống')))}
          value={profile.kind === 'staff' ? profile.employeeId : profile.code}
        />
        <InfoRow icon={CalendarClock} label="Ngày tạo hồ sơ" value={profile.memberSince} />
      </div>
    </motion.aside>
  );
}
