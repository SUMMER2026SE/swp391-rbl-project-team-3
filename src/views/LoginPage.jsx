import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthController } from '../controllers/useAuthController';
import { useAuth } from '../context/AuthContext';
import '../index.css';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [activePortal, setActivePortal] = React.useState('patient'); // 'patient' or 'staff'

  const {
    emailInput,
    setEmailInput,
    passwordInput,
    setPasswordInput,
    fullNameInput,
    setFullNameInput,
    isRegistering,
    setIsRegistering,
    isForgotPass,
    setIsForgotPass,
    otpInput,
    setOtpInput,
    isVerifyingOtp,
    setIsVerifyingOtp,
    isOtpVerified,
    setIsOtpVerified,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    confirmPasswordInput,
    setConfirmPasswordInput,
    loading,
    errorMsg,
    successMsg,
    handleGoogleLogin,
    handleSubmit,
    resetMessages
  } = useAuthController();

  const handleDemoLogin = (role) => {
    const path = login(role);
    navigate(path, { replace: true });
  };

  return (
    <div style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: '#f8fafc', // bg-slate-50 Pristine Medical System
        fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(20px) translateX(-10px); }
        }
        .animate-spin-custom {
          animation: spin 1s linear infinite;
        }
        .form-input-focus:focus {
          background: #ffffff !important;
          border-color: #14b8a6 !important;
          box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.1) !important;
        }
      `}</style>

      {/* Pristine Medical Blurred Animated Blobs */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute',
          top: '-10%', left: '-10%',
          width: '50vw', height: '50vw',
          borderRadius: '50%',
          background: 'rgba(110, 231, 183, 0.45)', // emerald-300
          filter: 'blur(120px)',
          animation: 'float 15s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-10%', right: '-10%',
          width: '60vw', height: '60vw',
          borderRadius: '50%',
          background: 'rgba(125, 211, 252, 0.45)', // sky-300
          filter: 'blur(150px)',
          animation: 'float-reverse 20s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '30%', left: '40%',
          width: '40vw', height: '40vw',
          borderRadius: '50%',
          background: 'rgba(110, 231, 183, 0.35)', // emerald-300
          filter: 'blur(100px)',
          animation: 'float 18s ease-in-out infinite 3s'
        }}></div>
      </div>

      {/* Premium Liquid Glass Card */}
      <div className="login-modal custom-scrollbar" style={{ 
          position: 'relative', 
          zIndex: 10, 
          width: '92%',
          maxWidth: '430px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '2.5rem 2rem',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.75)', // backdrop bg-white/70
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5)',
          animation: 'modal-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        {/* Header logo & title */}
        <div className="login-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: '0.75rem', transition: 'transform 0.3s', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <div style={{
              fontSize: '1.875rem',
              fontWeight: 900,
              letterSpacing: '-0.025em',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              backgroundImage: 'linear-gradient(to right, #059669, #0ea5e9)',
              lineHeight: 1.2
            }}>DermaSmart</div>
          </Link>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
            {isForgotPass ? (isOtpVerified ? 'Đặt lại mật khẩu mới' : (isVerifyingOtp ? 'Xác thực mã OTP' : 'Khôi phục mật khẩu')) : (isRegistering ? 'Tạo tài khoản mới' : 'Đăng nhập hệ thống')}
          </h2>
          <p style={{ color: '#475569', fontSize: '0.875rem' }}>
            {isForgotPass ? (isOtpVerified ? 'Vui lòng nhập mật khẩu mới của bạn bên dưới' : (isVerifyingOtp ? 'Mã OTP đã được gửi. Vui lòng kiểm tra email.' : 'Nhập email của bạn để nhận mã OTP khôi phục')) : (isRegistering ? 'Gia nhập hệ thống DermaSmart' : (activePortal === 'patient' ? 'Tiếp tục với Cổng Bệnh Nhân' : 'Dành cho nhân viên y tế & quản trị'))}
          </p>

          {/* 3-Step Forgot Password Progress Indicator */}
          {isForgotPass && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
              {[
                { step: 1, label: 'Email' },
                { step: 2, label: 'OTP' },
                { step: 3, label: 'Mật khẩu' },
              ].map(({ step, label }, idx) => {
                const currentStep = isOtpVerified ? 3 : isVerifyingOtp ? 2 : 1;
                const isActive = step === currentStep;
                const isCompleted = step < currentStep;
                return (
                  <React.Fragment key={step}>
                    {idx > 0 && (
                      <div style={{
                        width: '2rem', height: '2px',
                        background: isCompleted ? '#0d9488' : '#e2e8f0',
                        borderRadius: '1px',
                        transition: 'background 0.3s'
                      }} />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <div style={{
                        width: '2rem', height: '2rem',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700,
                        transition: 'all 0.3s',
                        background: isActive ? 'linear-gradient(135deg, #0d9488, #0ea5e9)' : isCompleted ? '#0d9488' : '#e2e8f0',
                        color: isActive || isCompleted ? '#ffffff' : '#94a3b8',
                        boxShadow: isActive ? '0 4px 12px rgba(13, 148, 136, 0.3)' : 'none',
                      }}>
                        {isCompleted ? '✓' : step}
                      </div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: isActive ? '#0d9488' : '#94a3b8' }}>{label}</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Dual-Portal Sliding Pill Toggle (Framer Motion) */}
        {!isForgotPass && !isRegistering && (
          <div style={{
            position: 'relative',
            display: 'flex',
            background: 'rgba(241, 245, 249, 0.9)',
            padding: '4px',
            borderRadius: '9999px',
            marginBottom: '1.5rem',
            border: '1px solid rgba(226, 232, 240, 0.8)',
          }}>
            {/* Animated sliding pill background */}
            <motion.div
              style={{
                position: 'absolute',
                top: '4px',
                bottom: '4px',
                width: 'calc(50% - 4px)',
                background: '#ffffff',
                borderRadius: '9999px',
                boxShadow: '0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)',
                zIndex: 0,
              }}
              animate={{ left: activePortal === 'staff' ? 'calc(50% + 2px)' : '4px' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            <button 
              type="button"
              onClick={() => { setActivePortal('patient'); resetMessages(); }}
              style={{
                flex: 1,
                padding: '0.625rem 0.5rem',
                borderRadius: '9999px',
                border: 'none',
                background: 'transparent',
                color: activePortal === 'patient' ? '#0f172a' : '#94a3b8',
                fontWeight: activePortal === 'patient' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'color 0.2s, font-weight 0.2s',
                position: 'relative',
                zIndex: 1,
              }}
            >
              Cổng Bệnh Nhân
            </button>
            <button 
              type="button"
              onClick={() => { setActivePortal('staff'); setIsRegistering(false); resetMessages(); }}
              style={{
                flex: 1,
                padding: '0.625rem 0.5rem',
                borderRadius: '9999px',
                border: 'none',
                background: 'transparent',
                color: activePortal === 'staff' ? '#0f172a' : '#94a3b8',
                fontWeight: activePortal === 'staff' ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'color 0.2s, font-weight 0.2s',
                position: 'relative',
                zIndex: 1,
              }}
            >
              Cổng Nội Bộ
            </button>
          </div>
        )}

        {/* Clean alert messages */}
        {errorMsg && (
          <div className="w-full p-4 mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl font-medium animate-fadeIn">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.08)', 
            color: '#065f46', 
            border: '1px solid rgba(16, 185, 129, 0.2)', 
            borderRadius: '12px', 
            padding: '0.75rem 1rem', 
            marginBottom: '1.25rem', 
            fontSize: '0.875rem', 
            textAlign: 'center', 
            backdropFilter: 'blur(4px)',
            fontWeight: 500
          }}>
            {successMsg}
          </div>
        )}

        {/* Google OAuth Option (Only for Patient Portal login) */}
        {!isRegistering && !isForgotPass && activePortal === 'patient' && (
          <>
            <button type="button" onClick={handleGoogleLogin} style={{ 
                width: '100%', padding: '0.875rem', borderRadius: '12px', background: 'white', color: '#1e293b', fontSize: '0.95rem', fontWeight: 600, border: '1px solid rgba(226, 232, 240, 0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', boxSizing: 'border-box'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; e.currentTarget.style.background = 'white'; }}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{width: '20px', height: '20px'}} />
              Đăng nhập bằng Google
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(226, 232, 240, 0.8)' }}></div>
                <span style={{ padding: '0 0.875rem', color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>hoặc tài khoản mật khẩu</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(226, 232, 240, 0.8)' }}></div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          {isForgotPass ? (
            <>
              {/* STEP 1: Enter Email to receive OTP */}
              {!isVerifyingOtp && !isOtpVerified && (
                <div className="space-y-4 animate-fadeIn">
                  <label className="text-sm font-semibold text-slate-700">Địa chỉ Email</label>
                  <input 
                    type="email" 
                    placeholder="nhap-email@gmail.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500"
                  />
                  <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? "Đang gửi..." : "Gửi mã OTP qua Email"}
                  </button>
                </div>
              )}

              {/* STEP 2: Enter the OTP code received via Email */}
              {isVerifyingOtp && !isOtpVerified && (
                <div className="space-y-4 animate-fadeIn">
                  <label className="text-sm font-semibold text-slate-700">Địa chỉ Email (Đang xác thực)</label>
                  <input 
                    type="email" 
                    value={emailInput}
                    readOnly 
                    disabled 
                    className="w-full p-3 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                  />
                  
                  <label className="text-sm font-semibold text-slate-700 mt-2 block">Mã xác thực OTP</label>
                  <input 
                    type="text" 
                    placeholder="Nhập mã OTP (6-8 chữ số)" 
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    required
                    maxLength={8}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-sky-500 font-mono tracking-widest text-center text-lg"
                  />
                  <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? "Đang xác thực..." : "Xác nhận mã OTP"}
                  </button>
                </div>
              )}

              {/* STEP 3: Enter New Password */}
              {isOtpVerified && (
                <div className="space-y-4 animate-fadeIn">
                  <label className="text-sm font-semibold text-slate-700">Mật khẩu mới</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      required
                      className="w-full p-3 pr-10 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-[1.15rem]">
                        {showPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                  
                  <label className="text-sm font-semibold text-slate-700 block mt-2">Xác nhận mật khẩu mới</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      required
                      className="w-full p-3 pr-10 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-[1.15rem]">
                        {showConfirmPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                  
                  <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-4">
                    {loading ? "Đang xử lý..." : "Cập nhật mật khẩu mới"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Regular Login / Register form fields */}
              {isRegistering && activePortal === 'patient' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', color: '#334155', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Họ và tên</label>
                  <input 
                    type="text" placeholder="Nguyễn Văn A" value={fullNameInput} onChange={(e) => setFullNameInput(e.target.value)} required
                    className="form-input-focus"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(203, 213, 225, 0.8)', color: '#0f172a', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#334155', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Địa chỉ Email</label>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={emailInput} 
                  onChange={(e) => setEmailInput(e.target.value)} 
                  required
                  className="form-input-focus"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '10px', 
                    background: 'rgba(255, 255, 255, 0.8)', 
                    border: '1px solid rgba(203, 213, 225, 0.8)', 
                    color: '#0f172a', 
                    fontSize: '0.95rem', 
                    outline: 'none', 
                    transition: 'all 0.2s', 
                    boxSizing: 'border-box' 
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ display: 'block', color: '#334155', fontSize: '0.85rem', fontWeight: 600 }}>Mật khẩu</label>
                    {!isRegistering && (
                        <button 
                            type="button" 
                            onClick={() => { setIsForgotPass(true); resetMessages(); }} 
                            style={{ background: 'none', border: 'none', color: '#0d9488', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                            onMouseEnter={e => e.target.style.color = '#0f766e'} 
                            onMouseLeave={e => e.target.style.color = '#0d9488'}
                        >
                            Quên mật khẩu?
                        </button>
                    )}
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="***" 
                    value={passwordInput} 
                    onChange={(e) => setPasswordInput(e.target.value)} 
                    required
                    className="form-input-focus"
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem 2.5rem 0.75rem 1rem', 
                      borderRadius: '10px', 
                      background: 'rgba(255, 255, 255, 0.8)', 
                      border: '1px solid rgba(203, 213, 225, 0.8)', 
                      color: '#0f172a', 
                      fontSize: '0.95rem', 
                      outline: 'none', 
                      transition: 'all 0.2s', 
                      boxSizing: 'border-box' 
                    }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>
              
              {/* Submit Button with Loading State (Login/Register Only) */}
              <button type="submit" disabled={loading} style={{ 
                  width: '100%', padding: '0.875rem', borderRadius: '12px', background: 'linear-gradient(135deg, #0d9488, #0ea5e9)', color: 'white', fontSize: '0.95rem', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxSizing: 'border-box', boxShadow: '0 8px 20px rgba(13, 148, 136, 0.25)', opacity: loading ? 0.8 : 1
              }}
              onMouseEnter={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(13, 148, 136, 0.35)'; } }}
              onMouseLeave={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(13, 148, 136, 0.25)'; } }}
              >
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <svg className="animate-spin-custom" style={{ width: '18px', height: '18px', color: '#ffffff' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang xử lý...</span>
                  </div>
                ) : (
                  isRegistering ? 'Đăng ký ngay' : 'Đăng nhập'
                )}
              </button>
            </>
          )}
          
          {/* Back & Toggle registration (Only for Patient Portal) */}
          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            {isForgotPass ? (
              <button 
                  type="button" 
                  onClick={() => { setIsForgotPass(false); setIsVerifyingOtp(false); setIsOtpVerified(false); resetMessages(); }} 
                  style={{ background: 'none', border: 'none', color: '#0d9488', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', padding: 0 }} 
                  onMouseEnter={e => e.target.style.color = '#0f766e'} 
                  onMouseLeave={e => e.target.style.color = '#0d9488'}
              >
                  Quay lại đăng nhập
              </button>
            ) : (
              activePortal === 'patient' && (
                <>
                  <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>
                      {isRegistering ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
                  </span>
                  <button 
                      type="button" 
                      onClick={() => { setIsRegistering(!isRegistering); resetMessages(); }} 
                      style={{ background: 'none', border: 'none', color: '#0d9488', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', padding: 0 }} 
                      onMouseEnter={e => e.target.style.color = '#0f766e'} 
                      onMouseLeave={e => e.target.style.color = '#0d9488'}
                  >
                      {isRegistering ? 'Đăng nhập' : 'Đăng ký ngay'}
                  </button>
                </>
              )
            )}
          </div>
        </form>

        {/* Demo Fast Login (Only for Staff Portal Mode) */}
        {activePortal === 'staff' && !isForgotPass && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(226, 232, 240, 0.8)', paddingTop: '1.25rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
              Đăng nhập nhanh Demo
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN')}
                style={{
                  padding: '0.5rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(13, 148, 136, 0.12)',
                  background: 'rgba(13, 148, 136, 0.04)',
                  color: '#0f766e',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(13, 148, 136, 0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(13, 148, 136, 0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>admin_panel_settings</span>
                Quản trị viên
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('DOCTOR')}
                style={{
                  padding: '0.5rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(2, 132, 199, 0.12)',
                  background: 'rgba(2, 132, 199, 0.04)',
                  color: '#0369a1',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(2, 132, 199, 0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(2, 132, 199, 0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>stethoscope</span>
                Bác sĩ
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('RECEPTIONIST')}
                style={{
                  padding: '0.5rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(217, 119, 6, 0.12)',
                  background: 'rgba(217, 119, 6, 0.04)',
                  color: '#b45309',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217, 119, 6, 0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(217, 119, 6, 0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>support_agent</span>
                Lễ tân
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('TECHNICIAN')}
                style={{
                  padding: '0.5rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(100, 116, 139, 0.12)',
                  background: 'rgba(100, 116, 139, 0.04)',
                  color: '#475569',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(100, 116, 139, 0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(100, 116, 139, 0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>biotech</span>
                Kỹ thuật viên
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
