import React, { useState, useEffect } from 'react';
import { AuthModel } from '../models/AuthModel';
import '../index.css';

function ChangePasswordModal({ isOpen, onClose }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('Mật khẩu mới phải dài từ 8 ký tự trở lên.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    if (oldPassword === newPassword) {
      setErrorMsg('Mật khẩu mới không được giống mật khẩu cũ.');
      return;
    }

    setLoading(true);
    try {
      await AuthModel.changePassword(oldPassword, newPassword);
      setSuccessMsg('Thay đổi mật khẩu thành công!');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm font-sans" onClick={onClose}>
      <div className="w-full max-w-md backdrop-blur-3xl bg-white/75 border border-white/80 shadow-[0_20px_60px_rgba(14,165,233,0.12)] rounded-[2rem] p-8 relative" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 bg-transparent border-none text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 p-2 rounded-full flex items-center justify-center transition-all cursor-pointer"
        >
            <span className="material-symbols-outlined">close</span>
        </button>

        {/* Modal Header */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">
            Đổi mật khẩu tài khoản
          </h2>
          <p className="text-slate-500 text-sm">
            Vui lòng nhập mật khẩu hiện tại và mật khẩu mới của bạn
          </p>
        </div>
        
        {/* Status Alerts */}
        {errorMsg && <div className="bg-rose-50 text-rose-600 border border-rose-200 rounded-xl p-3.5 mb-6 text-sm text-center">{errorMsg}</div>}
        {successMsg && <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl p-3.5 mb-6 text-sm text-center">{successMsg}</div>}

        <form onSubmit={handleSubmit}>
          {/* Old Password */}
          <div className="mb-5">
            <label className="block text-slate-600 text-sm font-medium mb-2">Mật khẩu hiện tại</label>
            <div className="relative flex items-center">
              <input 
                type={showOldPassword ? "text" : "password"} 
                placeholder="Nhập mật khẩu hiện tại" 
                value={oldPassword} 
                onChange={(e) => setOldPassword(e.target.value)} 
                required
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 transition-colors box-border pr-12"
              />
              <button 
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-4 bg-transparent border-none text-slate-400 hover:text-slate-600 cursor-pointer flex items-center justify-center p-0 transition-colors"
              >
                <span className="material-symbols-outlined text-[1.25rem]">
                  {showOldPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="mb-5">
            <label className="block text-slate-600 text-sm font-medium mb-2">Mật khẩu mới</label>
            <div className="relative flex items-center">
              <input 
                type={showNewPassword ? "text" : "password"} 
                placeholder="Tối thiểu 8 ký tự" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 transition-colors box-border pr-12"
              />
              <button 
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 bg-transparent border-none text-slate-400 hover:text-slate-600 cursor-pointer flex items-center justify-center p-0 transition-colors"
              >
                <span className="material-symbols-outlined text-[1.25rem]">
                  {showNewPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-8">
            <label className="block text-slate-600 text-sm font-medium mb-2">Xác nhận mật khẩu mới</label>
            <div className="relative flex items-center">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder="Xác nhận mật khẩu mới" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 transition-colors box-border pr-12"
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 bg-transparent border-none text-slate-400 hover:text-slate-600 cursor-pointer flex items-center justify-center p-0 transition-colors"
              >
                <span className="material-symbols-outlined text-[1.25rem]">
                  {showConfirmPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className={`w-full p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white text-base font-semibold border-none shadow-[0_8px_20px_rgba(20,184,166,0.3)] transition-all duration-200 hover:shadow-[0_12px_25px_rgba(20,184,166,0.4)] hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;
