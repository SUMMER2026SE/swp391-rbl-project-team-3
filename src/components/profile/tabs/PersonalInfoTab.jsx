/**
 * PersonalInfoTab.jsx
 * ───────────────────────────────────────────────────────────────────────────
 * "Thông tin cá nhân" — the view/edit module shared by every actor.
 *
 *  - Seamless toggle: read rows morph into `.glass-input` controls in place.
 *  - Robust validation: name (no digits), email + VN phone via the enterprise
 *    regex (profileValidation).
 *  - Async-safe submit: isMounted guard, spinner inside a centered button,
 *    localized success / error banners inside the glass card.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit3, Save, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import ProfileField from '../ProfileField';
import { STAFF_FIELDS, PATIENT_FIELDS } from '../profileConfig';
import { validateForm } from '../profileValidation';

const formatDob = (dob) => {
  if (!dob) return '';
  const d = new Date(dob);
  return Number.isNaN(d.getTime()) ? dob : d.toLocaleDateString('vi-VN');
};

// Mocks a backend write so we can exercise the real loading / success / error
// states. Swap for the actual ProfileModel.update() when the API lands.
const persistProfile = (payload) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (payload.email?.includes('fail@')) reject(new Error('Máy chủ từ chối yêu cầu. Vui lòng thử lại.'));
      else resolve(payload);
    }, 1100);
  });

export default function PersonalInfoTab({ profile, onSaved }) {
  const fields = profile.kind === 'staff' ? STAFF_FIELDS : PATIENT_FIELDS;

  const buildInitial = useMemo(
    () => () =>
      fields.reduce((acc, f) => {
        acc[f.key] = f.key === 'dob' ? formatDob(profile[f.key]) : (profile[f.key] ?? '');
        return acc;
      }, {}),
    [fields, profile]
  );

  const [formData, setFormData] = useState(buildInitial);
  const [saved, setSaved] = useState(buildInitial);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', msg }

  // Async-safety: never set state after unmount.
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Re-sync when the underlying user changes (e.g. avatar / different actor).
  useEffect(() => {
    const fresh = buildInitial();
    setFormData(fresh);
    setSaved(fresh);
    setErrors({});
    setIsEditing(false);
  }, [buildInitial]);

  const editableKeys = fields.filter((f) => f.editable).map((f) => f.key);

  const handleChange = (key, val) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleEdit = () => { setAlert(null); setIsEditing(true); };

  const handleCancel = () => {
    setFormData(saved);
    setErrors({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    const { isValid, errors: errs } = validateForm(formData, editableKeys);
    if (!isValid) {
      setErrors(errs);
      setAlert({ type: 'error', msg: 'Vui lòng kiểm tra lại các trường được đánh dấu.' });
      return;
    }
    setLoading(true);
    setAlert(null);
    try {
      const result = await persistProfile(formData);
      if (!isMountedRef.current) return;
      setSaved(result);
      setIsEditing(false);
      setAlert({ type: 'success', msg: 'Thông tin cá nhân đã được cập nhật thành công!' });
      onSaved?.(result);
    } catch (err) {
      if (!isMountedRef.current) return;
      setAlert({ type: 'error', msg: err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.' });
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  // Auto-dismiss the success banner.
  useEffect(() => {
    if (alert?.type === 'success') {
      const t = setTimeout(() => isMountedRef.current && setAlert(null), 3000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  return (
    <div className="space-y-6">
      {/* Header + edit toggle */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-on-surface tracking-tight">Thông tin cá nhân</h3>
          <p className="text-sm text-on-surface-variant/70 mt-0.5">
            Quản lý thông tin liên hệ và hồ sơ của bạn.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 border border-white/70
                       text-sm font-bold text-on-surface hover:text-primary hover:border-primary/40 transition-all
                       shadow-sm cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            Chỉnh sửa hồ sơ
          </button>
        )}
      </div>

      {/* Localized alert banner (inside the glass card) */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold border
              ${alert.type === 'success'
                ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200'
                : 'bg-rose-50/90 text-rose-700 border-rose-200'}`}
          >
            {alert.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <AlertTriangle className="w-4 h-4 shrink-0" />}
            {alert.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fields */}
      <div className="glass-3d-soft rounded-2xl p-6 space-y-5">
        {fields.map((f) => (
          <ProfileField
            key={f.key}
            fieldKey={f.key}
            label={f.label}
            icon={f.icon}
            type={f.type}
            editable={f.editable}
            isEditing={isEditing}
            value={formData[f.key]}
            error={errors[f.key]}
            onChange={(val) => handleChange(f.key, val)}
          />
        ))}
      </div>

      {/* Edit-mode actions */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="flex items-center justify-center gap-3"
          >
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary inline-flex items-center justify-center gap-2 min-w-[180px] px-6 py-3 rounded-xl
                         text-sm font-bold disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
              ) : (
                <><Save className="w-4 h-4" /> Lưu thay đổi</>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/70 border border-white/70
                         text-sm font-bold text-on-surface-variant hover:text-on-surface transition-all cursor-pointer
                         disabled:opacity-50"
            >
              <X className="w-4 h-4" /> Hủy bỏ
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
