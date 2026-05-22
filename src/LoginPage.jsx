import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './index.css';

function LoginPage({ onLogin }) {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (usernameInput === 'admin' && passwordInput === '123456') {
      onLogin({ username: 'admin', role: 'Administrator' });
      navigate('/');
    } else {
      setLoginError('Sai tên đăng nhập hoặc mật khẩu!');
    }
  };

  return (
    <div className="login-page-container">
      {/* Background Orbs */}
      <div className="bg-orbs">
        <div className="orb-1"></div>
        <div className="orb-2"></div>
        <div className="orb-3"></div>
      </div>
      
      {/* Background Image synced with Landing Page */}
      <img alt="Futuristic clinical lab background" className="hero-bg" src="https://lh3.googleusercontent.com/aida/ADBb0ugiZRAensr-eNMU_UEv4qBnu7BObTmK77qcsUtesw43DPjGg6YhHs7HQRWkjUFqed-MkB7RFtFkFGuAqmsugbBk5SKavyqu8-9KUVuR68hA40m3wL8KrnJH7sCVgRRn7bVzXxs61VbJfTRehOadkIJGS7xHMLQ8RHU_06gQ8j9xZA--57F72EdVtYg1IcUDusJ8N9ddi2c4rtnZGWbXXhIDn3czjOnUyZyWHXvoeh7M7K2001PCGiFVevo"/>
      <div className="hero-overlay" style={{ opacity: 0.8 }}></div>

      {/* Premium Login Box */}
      <div className="login-modal" style={{ 
          position: 'relative', 
          zIndex: 10, 
          margin: 'auto', 
          width: '90%',
          maxWidth: '420px',
          padding: '2.5rem 2rem',
          borderRadius: '24px',
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
          animation: 'fade-in-up 0.6s ease-out forwards'
      }}>
        <div className="login-header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          {/* Logo Container */}
          <Link to="/" style={{ display: 'inline-block', marginBottom: '1.5rem', transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <img alt="DermaSmart Logo" src="https://lh3.googleusercontent.com/aida/ADBb0uiddj6CdMnqYQ2NQ2gNS__JGsBgPQWx2cgzMSUjV-6mD0NUuXFqjDCciD2rRfG3yqpqUjf6On86BpH61ioEIsnVMniDu-5fwQXKsOXQoruC848chIGCD7shN3ZsBjRvT53vJrLxxTuEAdPuXpXKSNO6j6a71dIrnJB8tr2RDReTT12L_lXF_dcmvbMwcKN8ZxtZXya1gRZ0XvNcjzSEqMuR6j0onUQdFNslqPU3afB12kawSdIxa55oCB5k" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
          </Link>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>Chào mừng trở lại</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Đăng nhập để tiếp tục vào DermaSmart</p>
        </div>
        
        {loginError && <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '0.875rem', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center', backdropFilter: 'blur(4px)' }}>{loginError}</div>}

        <form onSubmit={handleLoginSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Tên đăng nhập</label>
            <input 
              type="text" 
              placeholder="Nhập 'admin'"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              autoFocus
              style={{
                  width: '100%',
                  padding: '0.875rem 1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
              }}
              onFocus={e => {
                  e.target.style.background = 'rgba(0, 0, 0, 0.4)';
                  e.target.style.borderColor = 'rgba(20, 184, 166, 0.5)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.15)';
              }}
              onBlur={e => {
                  e.target.style.background = 'rgba(0, 0, 0, 0.25)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Mật khẩu</label>
            <input 
              type="password" 
              placeholder="Nhập '123456'"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{
                  width: '100%',
                  padding: '0.875rem 1.25rem',
                  borderRadius: '12px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
              }}
              onFocus={e => {
                  e.target.style.background = 'rgba(0, 0, 0, 0.4)';
                  e.target.style.borderColor = 'rgba(20, 184, 166, 0.5)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.15)';
              }}
              onBlur={e => {
                  e.target.style.background = 'rgba(0, 0, 0, 0.25)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <button type="submit" style={{ 
              width: '100%', 
              padding: '1rem', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', 
              color: 'white', 
              fontSize: '1rem', 
              fontWeight: 600, 
              border: '1px solid rgba(255,255,255,0.1)', 
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
              boxSizing: 'border-box'
          }}
          onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(13, 148, 136, 0.4)';
          }}
          onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 148, 136, 0.3)';
          }}
          onMouseDown={e => {
              e.currentTarget.style.transform = 'scale(0.98)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(13, 148, 136, 0.3)';
          }}
          onMouseUp={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(13, 148, 136, 0.4)';
          }}
          >
            Đăng nhập
          </button>
          
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Chưa có tài khoản? </span>
            <Link to="#" style={{ color: '#14b8a6', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#5eead4'} onMouseLeave={e => e.target.style.color = '#14b8a6'}>Đăng ký ngay</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
