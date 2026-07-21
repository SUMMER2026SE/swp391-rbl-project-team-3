import React, { useState, useEffect } from 'react';
import { User, Activity, AlertTriangle, ChevronDown, Loader2, Phone, Mail, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../../supabaseClient';
import { GLASS_BASE } from '../../../common/GlassCard';

// The patient identity card the doctor reads while examining.
//
// It used to read `PatientModel.getById()` — a localStorage MOCK store keyed by
// 'pat-01'…'pat-05'. Real appointments carry Supabase UUIDs, so the lookup always
// missed, the component returned null, and the card silently never rendered. It
// also painted a stock pravatar face and hardcoded "Dị ứng: Penicillin" for every
// patient, which is fabricated clinical data on a medical screen.
//
// Now it reads the real rows (`users` + `patient_profiles`) and shows only what
// the clinic actually recorded — "Chưa ghi nhận" when a field is empty.

const formatDob = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('vi-VN');
};

const calcAge = (iso) => {
  if (!iso) return null;
  const dob = new Date(iso);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
};

const initialsOf = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

function Avatar({ url, name }) {
  // A broken/missing photo must not leave a torn image icon on the record —
  // fall back to initials.
  const [failed, setFailed] = useState(false);

  if (url && !failed) {
    return (
      <img
        alt={`Ảnh hồ sơ bệnh nhân ${name || ''}`}
        className="w-24 h-24 shrink-0 rounded-2xl border-2 border-white shadow-md object-cover bg-slate-100"
        src={url}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="w-24 h-24 shrink-0 rounded-2xl border-2 border-white shadow-md bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center">
      <span className="text-2xl font-black text-white tracking-wide">{initialsOf(name)}</span>
    </div>
  );
}

function Field({ icon: Icon, label, value, tone = 'slate' }) {
  const empty = !value;
  const toneCls =
    tone === 'rose' && !empty
      ? 'text-rose-600 bg-rose-50 border-rose-200/40'
      : 'text-slate-700 bg-slate-50 border-slate-200/40';

  return (
    <div>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
        <Icon className={`w-3 h-3 ${tone === 'rose' ? 'text-rose-500' : ''}`} /> {label}
      </p>
      <p
        className={`text-sm font-semibold px-2 py-1 rounded-lg border ${
          empty ? 'text-slate-400 italic bg-slate-50/60 border-slate-200/40' : toneCls
        }`}
      >
        {empty ? 'Chưa ghi nhận' : value}
      </p>
    </div>
  );
}

export default function PatientVitals({ patientId, fallbackName = '', fallbackPhone = '' }) {
  // NOTE: every hook is declared BEFORE any early return. The previous version
  // put `useState(showDetails)` *after* `if (!patient) return null`, so the hook
  // count changed between renders the moment a patient loaded — React then threw
  // "Rendered more hooks than during the previous render" and blanked the screen.
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchPatient = async () => {
      if (!patientId) {
        if (active) {
          setPatient(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const [{ data: user, error: userErr }, { data: profile }] = await Promise.all([
          supabase
            .from('users')
            .select('user_id, full_name, email, phone, gender, date_of_birth, avatar_url')
            .eq('user_id', patientId)
            .maybeSingle(),
          // A walk-in who never completed a profile has no row here — that is a
          // normal empty state, not an error, so its failure never blocks the card.
          supabase
            .from('patient_profiles')
            .select('address, allergy_note, medical_history, blood_type, height, weight')
            .eq('patient_id', patientId)
            .maybeSingle(),
        ]);

        if (userErr) throw userErr;
        if (!active) return;

        setPatient(user ? { ...user, ...(profile || {}) } : null);
      } catch (err) {
        console.error('[PatientVitals] Failed to load patient:', err);
        if (active) setPatient(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchPatient();
    return () => {
      active = false;
    };
  }, [patientId]);

  if (isLoading) {
    return (
      <div className={`${GLASS_BASE} water-refract rounded-2xl p-8 mb-6 text-center text-slate-500`}>
        <Loader2 className="w-7 h-7 animate-spin text-teal-600 mx-auto mb-3" />
        <p className="text-sm font-semibold">Đang tải thông tin bệnh nhân...</p>
      </div>
    );
  }

  // No `users` row (walk-in guest booked at the front desk). The doctor still
  // needs to see WHO is in the chair, so fall back to the name/phone the
  // appointment itself carries instead of rendering nothing.
  const name = patient?.full_name || fallbackName || 'Bệnh nhân';
  const phone = patient?.phone || fallbackPhone || '';
  const dob = formatDob(patient?.date_of_birth);
  const age = calcAge(patient?.date_of_birth);
  const height = patient?.height ? `${patient.height} cm` : '';
  const weight = patient?.weight ? `${patient.weight} kg` : '';
  const bodyMetrics = [height, weight].filter(Boolean).join(' • ');

  return (
    <div className={`${GLASS_BASE} water-refract rounded-2xl p-6 mb-6`}>
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200/40">
        <User className="w-5 h-5 text-teal-600" />
        <h3 className="font-bold text-lg text-slate-900">Thông tin Bệnh nhân</h3>
        {!patient && (
          <span className="ml-auto text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-full">
            Khách vãng lai
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <Avatar url={patient?.avatar_url} name={name} />

        <div className="flex-1 w-full space-y-4">
          {/* Always visible: Name, Gender/DOB, Patient ID */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <h2 className="font-bold text-xl text-slate-900">{name}</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {patient?.gender || 'Chưa rõ giới tính'}
                {dob ? ` • Sinh: ${dob}${age != null ? ` (${age} tuổi)` : ''}` : ' • Chưa có ngày sinh'}
              </p>
              {phone && (
                <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {phone}
                </p>
              )}
            </div>
            {patient?.user_id && (
              <span
                className="bg-sky-50 text-sky-700 px-3 py-1 rounded-full font-bold text-xs border border-sky-200/20"
                title={patient.user_id}
              >
                ID: {String(patient.user_id).slice(0, 8)}
              </span>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors cursor-pointer border-none bg-transparent p-0"
          >
            <motion.span
              animate={{ rotate: showDetails ? 180 : 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="inline-flex"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.span>
            {showDetails ? 'Thu gọn' : 'Xem thêm chi tiết'}
          </button>

          {/* Collapsible: Medical History & Allergies */}
          <AnimatePresence initial={false}>
            {showDetails && (
              <motion.div
                key="patient-details"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <Field icon={Activity} label="Lịch sử bệnh lý" value={patient?.medical_history} />
                  <Field
                    icon={AlertTriangle}
                    label="Dị ứng"
                    value={patient?.allergy_note}
                    tone="rose"
                  />
                  <Field icon={Activity} label="Nhóm máu / Thể trạng" value={[patient?.blood_type, bodyMetrics].filter(Boolean).join(' • ')} />
                  <Field icon={MapPin} label="Địa chỉ" value={patient?.address} />
                  {patient?.email && <Field icon={Mail} label="Email" value={patient.email} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
