import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthController } from '../controllers/useAuthController';
import '../index.css';

function LoginPage() {
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

  return (
    <div style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: '#0f172a'
    }}>
      {/* Background Orbs */}
      <div className="bg-orbs">
        <div className="orb-1"></div>
        <div className="orb-2"></div>
        <div className="orb-3"></div>
      </div>
      
      {/* Background Image synced with Landing Page */}
      <img alt="Futuristic clinical lab background" className="hero-bg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.4 }} src="https://lh3.googleusercontent.com/aida/ADBb0ugiZRAensr-eNMU_UEv4qBnu7BObTmK77qcsUtesw43DPjGg6YhHs7HQRWkjUFqed-MkB7RFtFkFGuAqmsugbBk5SKavyqu8-9KUVuR68hA40m3wL8KrnJH7sCVgRRn7bVzXxs61VbJfTRehOadkIJGS7xHMLQ8RHU_06gQ8j9xZA--57F72EdVtYg1IcUDusJ8N9ddi2c4rtnZGWbXXhIDn3czjOnUyZyWHXvoeh7M7K2001PCGiFVevo"/>
      <div className="hero-overlay" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', opacity: 0.8, zIndex: 1 }}></div>

      {/* Premium Login Box */}
      <div className="login-modal custom-scrollbar" style={{ 
          position: 'relative', 
          zIndex: 10, 
          width: '90%',
          maxWidth: '420px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2.5rem 2rem',
          borderRadius: '24px',
          background: 'rgba(30, 41, 59, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
          animation: 'fade-in-up 0.6s ease-out forwards'
      }}>
        <div className="login-header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          {/* Logo Container */}
          <Link to="/" style={{ display: 'inline-block', marginBottom: '1.5rem', transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <img alt="DermaSmart Logo" src="https://lh3.googleusercontent.com/aida/ADBb0uiddj6CdMnqYQ2NQ2gNS__JGsBgPQWx2cgzMSUjV-6mD0NUuXFqjDCciD2rRfG3yqpqUjf6On86BpH61ioEIsnVMniDu-5fwQXKsOXQoruC848chIGCD7shN3ZsBjRvT53vJrLxxTuEAdPuXpXKSNO6j6a71dIrnJB8tr2RDReTT12L_lXF_dcmvbMwcKN8ZxtZXya1gRZ0XvNcjzSEqMuR6j0onUQdFNslqPU3afB12kawSdIxa55oCB5k" style={{ height: '50px', width: 'auto', objectFit: 'contain' }} />
          </Link>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
            {isForgotPass ? (isOtpVerified ? 'Đặt lại mật khẩu mới' : (isVerifyingOtp ? 'Xác thực mã OTP' : 'Khôi phục mật khẩu')) : (isRegistering ? 'Tạo tài khoản mới' : 'Đăng nhập')}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
            {isForgotPass ? (isOtpVerified ? 'Vui lòng nhập mật khẩu mới của bạn bên dưới' : (isVerifyingOtp ? 'Mã OTP đã được gửi. Vui lòng nhập mã OTP để xác minh.' : 'Nhập email của bạn để nhận mã OTP khôi phục')) : (isRegistering ? 'Gia nhập hệ thống DermaSmart' : 'Tiếp tục với tài khoản DermaSmart')}
          </p>
        </div>
        
        {errorMsg && <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '0.875rem', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', backdropFilter: 'blur(4px)' }}>{errorMsg}</div>}
        {successMsg && <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '0.875rem', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', backdropFilter: 'blur(4px)' }}>{successMsg}</div>}

        {!isRegistering && !isForgotPass && (
            <>
                <button type="button" onClick={handleGoogleLogin} style={{ 
                    width: '100%', padding: '1rem', borderRadius: '12px', background: 'white', color: '#0f172a', fontSize: '1rem', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 12px rgba(255,255,255,0.1)', boxSizing: 'border-box'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,255,255,0.1)'; }}
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{width: '24px', height: '24px'}} />
                  Đăng nhập bằng Google
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <span style={{ padding: '0 1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>hoặc bằng Email</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                </div>
            </>
        )}

        <form onSubmit={handleSubmit}>
          {isRegistering && !isForgotPass && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Họ và tên</label>
                <input 
                  type="text" placeholder="Nguyễn Văn A" value={fullNameInput} onChange={(e) => setFullNameInput(e.target.value)} required
                  style={{ width: '100%', padding: '0.875rem 1.25rem', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', fontSize: '1rem', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.background = 'rgba(0, 0, 0, 0.4)'; e.target.style.borderColor = 'rgba(20, 184, 166, 0.5)'; }}
                  onBlur={e => { e.target.style.background = 'rgba(0, 0, 0, 0.25)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                />
              </div>
          )}

          {(!isForgotPass || !isOtpVerified) && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Địa chỉ Email</label>
              <input 
                type="email" 
                placeholder="name@example.com" 
                value={emailInput} 
                onChange={(e) => setEmailInput(e.target.value)} 
                required
                disabled={isForgotPass && isVerifyingOtp}
                style={{ 
                  width: '100%', 
                  padding: '0.875rem 1.25rem', 
                  borderRadius: '12px', 
                  background: isForgotPass && isVerifyingOtp ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.25)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  color: isForgotPass && isVerifyingOtp ? 'rgba(255, 255, 255, 0.5)' : '#ffffff', 
                  fontSize: '1rem', 
                  outline: 'none', 
                  transition: 'all 0.2s', 
                  boxSizing: 'border-box' 
                }}
                onFocus={e => { if (!(isForgotPass && isVerifyingOtp)) { e.target.style.background = 'rgba(0, 0, 0, 0.4)'; e.target.style.borderColor = 'rgba(20, 184, 166, 0.5)'; } }}
                onBlur={e => { if (!(isForgotPass && isVerifyingOtp)) { e.target.style.background = 'rgba(0, 0, 0, 0.25)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; } }}
              />
            </div>
          )}

          {isForgotPass && isVerifyingOtp && !isOtpVerified && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Mã OTP</label>
              <input 
                type="text" 
                maxLength={8} 
                placeholder="Nhập mã OTP" 
                value={otpInput} 
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))} 
                required
                style={{ 
                  width: '100%', 
                  padding: '0.875rem 1.25rem', 
                  borderRadius: '12px', 
                  background: 'rgba(0, 0, 0, 0.25)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  color: '#ffffff', 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold',
                  letterSpacing: '0.5em', 
                  textAlign: 'center', 
                  outline: 'none', 
                  transition: 'all 0.2s', 
                  boxSizing: 'border-box' 
                }}
                onFocus={e => { e.target.style.background = 'rgba(0, 0, 0, 0.4)'; e.target.style.borderColor = 'rgba(20, 184, 166, 0.5)'; }}
                onBlur={e => { e.target.style.background = 'rgba(0, 0, 0, 0.25)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
              />
            </div>
          )}

          {isForgotPass && isOtpVerified && (
            <>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Mật khẩu mới</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Mật khẩu từ 8 ký tự" 
                    value={passwordInput} 
                    onChange={(e) => setPasswordInput(e.target.value)} 
                    required
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem 3rem 0.875rem 1.25rem', 
                      borderRadius: '12px', 
                      background: 'rgba(0, 0, 0, 0.25)', 
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      color: '#ffffff', 
                      fontSize: '1rem', 
                      outline: 'none', 
                      transition: 'all 0.2s', 
                      boxSizing: 'border-box' 
                    }}
                    onFocus={e => { e.target.style.background = 'rgba(0, 0, 0, 0.4)'; e.target.style.borderColor = 'rgba(20, 184, 166, 0.5)'; }}
                    onBlur={e => { e.target.style.background = 'rgba(0, 0, 0, 0.25)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.5)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Xác nhận mật khẩu mới</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Xác nhận mật khẩu" 
                    value={confirmPasswordInput} 
                    onChange={(e) => setConfirmPasswordInput(e.target.value)} 
                    required
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem 3rem 0.875rem 1.25rem', 
                      borderRadius: '12px', 
                      background: 'rgba(0, 0, 0, 0.25)', 
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      color: '#ffffff', 
                      fontSize: '1rem', 
                      outline: 'none', 
                      transition: 'all 0.2s', 
                      boxSizing: 'border-box' 
                    }}
                    onFocus={e => { e.target.style.background = 'rgba(0, 0, 0, 0.4)'; e.target.style.borderColor = 'rgba(20, 184, 166, 0.5)'; }}
                    onBlur={e => { e.target.style.background = 'rgba(0, 0, 0, 0.25)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.5)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                      {showConfirmPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {!isForgotPass && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', fontWeight: 500 }}>Mật khẩu</label>
                  {!isRegistering && (
                      <button 
                          type="button" 
                          onClick={() => { setIsForgotPass(true); resetMessages(); }} 
                          style={{ background: 'none', border: 'none', color: '#14b8a6', fontSize: '0.8rem', textDecoration: 'none', cursor: 'pointer', padding: 0 }}
                          onMouseEnter={e => e.target.style.color = '#5eead4'} 
                          onMouseLeave={e => e.target.style.color = '#14b8a6'}
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
                  style={{ 
                    width: '100%', 
                    padding: '0.875rem 3rem 0.875rem 1.25rem', 
                    borderRadius: '12px', 
                    background: 'rgba(0, 0, 0, 0.25)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    color: '#ffffff', 
                    fontSize: '1rem', 
                    outline: 'none', 
                    transition: 'all 0.2s', 
                    boxSizing: 'border-box' 
                  }}
                  onFocus={e => { e.target.style.background = 'rgba(0, 0, 0, 0.4)'; e.target.style.borderColor = 'rgba(20, 184, 166, 0.5)'; }}
                  onBlur={e => { e.target.style.background = 'rgba(0, 0, 0, 0.25)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} style={{ 
              width: '100%', padding: '1rem', borderRadius: '12px', background: 'linear-gradient(135deg, #14b8a6, #0ea5e9)', color: 'white', fontSize: '1rem', fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxSizing: 'border-box', boxShadow: '0 8px 20px rgba(20, 184, 166, 0.3)', opacity: loading ? 0.7 : 1
          }}
          onMouseEnter={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(20, 184, 166, 0.4)'; } }}
          onMouseLeave={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(20, 184, 166, 0.3)'; } }}
          >
            {loading ? 'Đang xử lý...' : (isForgotPass ? (isOtpVerified ? 'Xác nhận đặt lại mật khẩu' : (isVerifyingOtp ? 'Xác minh mã OTP' : 'Gửi mã OTP khôi phục')) : (isRegistering ? 'Đăng ký ngay' : 'Đăng nhập'))}
          </button>
          
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            {isForgotPass ? (
              <button 
                  type="button" 
                  onClick={() => { setIsForgotPass(false); setIsVerifyingOtp(false); setIsOtpVerified(false); resetMessages(); }} 
                  style={{ background: 'none', border: 'none', color: '#14b8a6', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer', padding: 0 }} 
                  onMouseEnter={e => e.target.style.color = '#5eead4'} 
                  onMouseLeave={e => e.target.style.color = '#14b8a6'}
              >
                  Quay lại đăng nhập
              </button>
            ) : (
              <>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                    {isRegistering ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
                </span>
                <button 
                    type="button" 
                    onClick={() => { setIsRegistering(!isRegistering); resetMessages(); }} 
                    style={{ background: 'none', border: 'none', color: '#14b8a6', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer', padding: 0 }} 
                    onMouseEnter={e => e.target.style.color = '#5eead4'} 
                    onMouseLeave={e => e.target.style.color = '#14b8a6'}
                >
                    {isRegistering ? 'Đăng nhập' : 'Đăng ký ngay'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
