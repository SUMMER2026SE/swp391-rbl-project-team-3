import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthController } from '../controllers/useAuthController';
import { AuthModel } from '../models/AuthModel';
import '../index.css';
import logo from '../assets/logo.png';

function ResetPasswordPage() {
  const {
    passwordInput,
    setPasswordInput,
    confirmPasswordInput,
    setConfirmPasswordInput,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    loading,
    errorMsg,
    setErrorMsg,
    successMsg,
    handleResetPassword
  } = useAuthController();

  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Check if user is authenticated (meaning they clicked the recovery link and Supabase signed them in)
    const checkUserSession = async () => {
      try {
        const session = await AuthModel.getSession();
        if (session) {
          setHasSession(true);
        } else {
          setHasSession(false);
          setErrorMsg('Liên kết khôi phục mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại.');
        }
      } catch (error) {
        setHasSession(false);
        setErrorMsg('Đã xảy ra lỗi khi kiểm tra phiên làm việc.');
      } finally {
        setCheckingSession(false);
      }
    };

    checkUserSession();
  }, [setErrorMsg]);

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

      {/* Premium Glass Box */}
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
            <img alt="DermaSmart Logo" src={logo} style={{ height: '100px', width: 'auto', objectFit: 'contain' }} />
          </Link>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
            Đặt lại mật khẩu mới
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
            {checkingSession ? 'Đang kiểm tra thông tin phiên làm việc...' : (hasSession ? 'Vui lòng điền mật khẩu mới của bạn bên dưới' : 'Yêu cầu không hợp lệ')}
          </p>
        </div>
        
        {errorMsg && <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '0.875rem', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', backdropFilter: 'blur(4px)' }}>{errorMsg}</div>}
        {successMsg && <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '0.875rem', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', backdropFilter: 'blur(4px)' }}>{successMsg}</div>}

        {checkingSession ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100px', color: '#14b8a6' }}>
            <span style={{ fontSize: '1rem', fontWeight: 600 }}>Đang kiểm tra...</span>
          </div>
        ) : hasSession ? (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Mật khẩu mới</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Nhập mật khẩu mới" 
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
                  placeholder="Xác nhận mật khẩu mới" 
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

            <button type="submit" disabled={loading} style={{ 
                width: '100%', padding: '1rem', borderRadius: '12px', background: 'linear-gradient(135deg, #14b8a6, #0ea5e9)', color: 'white', fontSize: '1rem', fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxSizing: 'border-box', boxShadow: '0 8px 20px rgba(20, 184, 166, 0.3)', opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(20, 184, 166, 0.4)'; } }}
            onMouseLeave={e => { if(!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(20, 184, 166, 0.3)'; } }}
            >
              {loading ? 'Đang cập nhật...' : 'Xác nhận đặt lại mật khẩu'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/login" style={{ 
                display: 'inline-block', width: '100%', padding: '1rem', borderRadius: '12px', background: 'linear-gradient(135deg, #14b8a6, #0ea5e9)', color: 'white', fontSize: '1rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxSizing: 'border-box', textDecoration: 'none', boxShadow: '0 8px 20px rgba(20, 184, 166, 0.3)'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(20, 184, 166, 0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(20, 184, 166, 0.3)'; }}
            >
              Quay lại Trang Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;
