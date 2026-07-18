/**
 * ProfileField.jsx
 * ───────────────────────────────────────────────────────────────────────────
 * A single labelled field that smoothly toggles between a read view and a
 * controlled GLASS_INPUT field. Layout is identical in both modes (same row
 * height / paddings) so flipping to edit never shifts the surrounding grid.
 */
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Calendar, BadgeCheck, Building2,
  Sparkles, CalendarDays, AlertCircle, Lock, Award, Clock
} from 'lucide-react';
import { GLASS_INPUT } from '../common/GlassCard';

const ICONS = {
  User, Mail, Phone, MapPin, Calendar, BadgeCheck, Building2,
  Sparkles, CalendarDays, Lock, Award, Clock
};

export default function ProfileField({
  fieldKey,
  label,
  icon = 'User',
  type = 'text',
  value,
  isEditing,
  editable = true,
  error = '',
  onChange,
}) {
  const Icon = ICONS[icon] || User;
  const canEdit = isEditing && editable;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
        {/* Label */}
        <div className="flex items-center gap-2.5 w-full sm:w-44 shrink-0">
          <span className={`${canEdit ? 'text-primary' : 'text-on-surface-variant/80'} transition-colors`}>
            <Icon className="w-4 h-4" />
          </span>
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            {label}
          </span>
          {!editable && (
            <Lock className="w-3 h-3 text-on-surface-variant/30" title="Không thể chỉnh sửa" />
          )}
        </div>

        {/* Value / Input — both occupy the same box so there is zero layout shift */}
        <div className="flex-1 min-w-0">
          {canEdit ? (
            <input
              type={type}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              aria-invalid={!!error}
              className={`${GLASS_INPUT} w-full text-[15px] font-medium rounded-xl px-4 py-2.5
                ${error ? '!border-rose-400 focus:!ring-rose-400/15' : ''}`}
            />
          ) : (
            <div className="w-full text-[15px] font-semibold text-on-surface px-4 py-2.5 rounded-xl bg-white/55 border border-white/60 truncate">
              {value || <span className="text-on-surface-variant/60 font-normal">—</span>}
            </div>
          )}
        </div>
      </div>

      {/* Inline validation error */}
      <AnimatePresence>
        {canEdit && error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 sm:pl-48 text-rose-600"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-semibold">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
