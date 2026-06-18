/**
 * AccountSettingsTab.jsx
 * ───────────────────────────────────────────────────────────────────────────
 * "Cài đặt tài khoản" — password change + notification preferences.
 * Same async-safe pattern (isMounted guard, spinner button, inline banner).
 */
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Bell, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AuthModel } from '../../../models/AuthModel';

function PasswordInput({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="glass-input w-full text-[15px] text-on-surface rounded-xl px-4 py-3 pr-12"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface
                     bg-transparent border-none cursor-pointer p-1"
        >
          {show ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked = false, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 glass-inner rounded-xl px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-bold text-on-surface">{label}</p>
        <p className="text-xs text-on-surface-variant/70 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative rounded-full transition-colors duration-200 border-none cursor-pointer shrink-0
                    ${checked ? 'bg-primary' : 'bg-slate-300'}`}
        style={{ height: '26px', width: '46px' }}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                      ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

export default function AccountSettingsTab() {
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Notifications preferences
  const [prefs, setPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem('dermasmart_notification_prefs');
      return stored ? JSON.parse(stored) : { email: true, sms: false, inApp: true };
    } catch {
      return { email: true, sms: false, inApp: true };
    }
  });

  const updatePref = (key, value) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    localStorage.setItem('dermasmart_notification_prefs', JSON.stringify(newPrefs));
  };

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (alert?.type === 'success') {
      const t = setTimeout(() => isMountedRef.current && setAlert(null), 3000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  const handleChangePassword = async () => {
    if (!pw.current || !pw.next) {
      setAlert({ type: 'error', msg: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.' });
      return;
    }
    if (pw.next.length < 8) {
      setAlert({ type: 'error', msg: 'Mật khẩu mới phải dài tối thiểu 8 ký tự.' });
      return;
    }
    if (pw.next !== pw.confirm) {
      setAlert({ type: 'error', msg: 'Mật khẩu xác nhận không trùng khớp.' });
      return;
    }
    setLoading(true);
    setAlert(null);
    try {
      await AuthModel.changePassword(pw.current, pw.next);
      if (!isMountedRef.current) return;
      setPw({ current: '', next: '', confirm: '' });
      setAlert({ type: 'success', msg: 'Đổi mật khẩu thành công!' });
    } catch (err) {
      if (!isMountedRef.current) return;
      setAlert({ type: 'error', msg: err.message || 'Đã có lỗi xảy ra khi đổi mật khẩu.' });
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-extrabold text-on-surface tracking-tight">Cài đặt tài khoản</h3>
        <p className="text-sm text-on-surface-variant/70 mt-0.5">Bảo mật và tùy chọn thông báo của bạn.</p>
      </div>

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

      {/* Change password */}
      <div className="glass-3d-soft rounded-2xl p-6">
        <h4 className="flex items-center gap-2 text-base font-extrabold text-on-surface mb-5">
          <Lock className="w-5 h-5 text-primary" /> Đổi mật khẩu
        </h4>
        <div className="space-y-4">
          <PasswordInput label="Mật khẩu hiện tại" value={pw.current}
            onChange={(v) => setPw((p) => ({ ...p, current: v }))} placeholder="Nhập mật khẩu hiện tại" />
          <PasswordInput label="Mật khẩu mới" value={pw.next}
            onChange={(v) => setPw((p) => ({ ...p, next: v }))} placeholder="Tối thiểu 8 ký tự" />
          <PasswordInput label="Xác nhận mật khẩu mới" value={pw.confirm}
            onChange={(v) => setPw((p) => ({ ...p, confirm: v }))} placeholder="Nhập lại mật khẩu mới" />
          <div className="flex justify-center pt-1">
            <button
              onClick={handleChangePassword}
              disabled={loading}
              className="btn-primary inline-flex items-center justify-center gap-2 min-w-[200px] px-6 py-3 rounded-xl
                         text-sm font-bold disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                : <><ShieldCheck className="w-4 h-4" /> Cập nhật mật khẩu</>}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-3d-soft rounded-2xl p-6">
        <h4 className="flex items-center gap-2 text-base font-extrabold text-on-surface mb-5">
          <Bell className="w-5 h-5 text-primary" /> Thông báo
        </h4>
        <div className="space-y-3">
          <ToggleRow 
            label="Thông báo qua email" 
            description="Nhận email khi có lịch hẹn mới hoặc thay đổi" 
            checked={prefs.email}
            onChange={(v) => updatePref('email', v)}
          />
          <ToggleRow 
            label="Thông báo qua SMS" 
            description="Nhận tin nhắn nhắc nhở trước lịch hẹn" 
            checked={prefs.sms}
            onChange={(v) => updatePref('sms', v)}
          />
          <ToggleRow 
            label="Thông báo trong ứng dụng" 
            description="Hiện popup thông báo trong giao diện" 
            checked={prefs.inApp}
            onChange={(v) => updatePref('inApp', v)}
          />
        </div>
      </div>
    </div>
  );
}
