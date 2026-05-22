import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

function LandingPage({ user, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);

    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('reveal-glass')) {
                    entry.target.classList.add('reveal-glass-visible');
                    entry.target.classList.remove('reveal-glass-hidden');
                } else {
                    entry.target.classList.add('reveal-visible');
                    entry.target.classList.remove('reveal-hidden');
                }
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        el.classList.add('reveal-hidden');
        revealObserver.observe(el);
    });

    document.querySelectorAll('.reveal-glass').forEach(el => {
        el.classList.add('reveal-glass-hidden');
        revealObserver.observe(el);
    });

    const liquidGlassElements = document.querySelectorAll('.liquid-glass');
    const handleMouseMove = (e) => {
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.setProperty('--mouse-x', `${x}px`);
        el.style.setProperty('--mouse-y', `${y}px`);
    };

    liquidGlassElements.forEach(el => {
        el.addEventListener('mousemove', handleMouseMove);
    });

    return () => {
        window.removeEventListener('scroll', handleScroll);
        revealObserver.disconnect();
        liquidGlassElements.forEach(el => {
            el.removeEventListener('mousemove', handleMouseMove);
        });
    };
  }, [user, navigate]);

  return (
    <>
      <div className="bg-orbs">
        <div className="orb-1"></div>
        <div className="orb-2"></div>
        <div className="orb-3"></div>
      </div>

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <a className="nav-brand" href="#">
          <img alt="DermaSmart Logo" src="https://lh3.googleusercontent.com/aida/ADBb0uiddj6CdMnqYQ2NQ2gNS__JGsBgPQWx2cgzMSUjV-6mD0NUuXFqjDCciD2rRfG3yqpqUjf6On86BpH61ioEIsnVMniDu-5fwQXKsOXQoruC848chIGCD7shN3ZsBjRvT53vJrLxxTuEAdPuXpXKSNO6j6a71dIrnJB8tr2RDReTT12L_lXF_dcmvbMwcKN8ZxtZXya1gRZ0XvNcjzSEqMuR6j0onUQdFNslqPU3afB12kawSdIxa55oCB5k"/>
        </a>
        <div className="nav-links">
          <a href="#">Trang chủ</a>
          <a href="#">Tính năng AI</a>
          <a href="#">Bảng giá</a>
        </div>
        <div className="nav-actions">
          {user ? (
            <div className="user-profile">
              <span className="user-greeting">
                <span className="material-symbols-outlined">account_circle</span>
                Xin chào, {user.username}
              </span>
              <button className="btn-logout" onClick={() => onLogout()}>Đăng xuất</button>
            </div>
          ) : (
            <>
              <button className="btn-login" onClick={() => navigate('/login')}>Đăng nhập</button>
              <button className="btn-register">Đăng ký</button>
            </>
          )}
        </div>
        <button className="mobile-menu-btn">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </nav>

      <section className="hero-section">
        <img alt="Futuristic clinical lab background" className="hero-bg" src="https://lh3.googleusercontent.com/aida/ADBb0ugiZRAensr-eNMU_UEv4qBnu7BObTmK77qcsUtesw43DPjGg6YhHs7HQRWkjUFqed-MkB7RFtFkFGuAqmsugbBk5SKavyqu8-9KUVuR68hA40m3wL8KrnJH7sCVgRRn7bVzXxs61VbJfTRehOadkIJGS7xHMLQ8RHU_06gQ8j9xZA--57F72EdVtYg1IcUDusJ8N9ddi2c4rtnZGWbXXhIDn3czjOnUyZyWHXvoeh7M7K2001PCGiFVevo"/>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="badge animate-stagger-1">✨ Hệ thống AI Scan 2.0</div>
          <h1 className="hero-title animate-stagger-2">
              Kỷ Nguyên Mới Của<br/>Chăm Sóc Da Liễu
          </h1>
          <p className="hero-desc animate-stagger-3">
              Chào mừng bạn đã đăng nhập thành công. Hãy bắt đầu kiểm tra hồ sơ bệnh lý hoặc trải nghiệm AI phân tích chuyên sâu.
          </p>
          <div className="hero-actions animate-stagger-4">
            <button className="btn-primary btn-pulse">
                Quản lý Phòng Khám
            </button>
            <button className="btn-secondary">
                Soi Da AI
            </button>
          </div>
        </div>
      </section>

      <main className="main-content">
        <section className="reveal-on-scroll">
          <div className="features-header">
            <h2 className="features-title">Công Nghệ Đột Phá Cho Làn Da Hoàn Hảo</h2>
            <p className="features-desc">Giải pháp toàn diện kết nối dữ liệu bệnh lý, phác đồ điều trị và quản trị vận hành trên cùng một nền tảng kính tương tác mượt mà.</p>
          </div>
          <div className="bento-grid">
            <div className="bento-card glass-panel liquid-glass col-span-2 reveal-on-scroll" style={{transitionDelay: '100ms'}}>
              <div className="bento-icon-wrapper icon-primary">
                <span className="material-symbols-outlined text-[24px]">face_retouching_natural</span>
              </div>
              <h3>AI Skin Analytics Pro</h3>
              <p>Phân tích đa tầng 14 chỉ số da chỉ trong 5 giây. Công nghệ quang phổ hẹp giúp phát hiện tổn thương biểu bì ẩn sâu.</p>
            </div>
            <div className="bento-card glass-panel liquid-glass reveal-on-scroll" style={{transitionDelay: '200ms'}}>
              <div className="bento-icon-wrapper icon-secondary">
                <span className="material-symbols-outlined text-[24px]">receipt_long</span>
              </div>
              <h3>Smart EMR</h3>
              <p>Hồ sơ bệnh án điện tử thông minh, tự động liên kết kết quả soi da với phác đồ cá nhân hóa.</p>
            </div>
            <div className="bento-card glass-panel liquid-glass reveal-on-scroll" style={{transitionDelay: '300ms'}}>
              <div className="bento-icon-wrapper icon-tertiary">
                <span className="material-symbols-outlined text-[24px]">inventory_2</span>
              </div>
              <h3>Real-time Inventory</h3>
              <p>Quản lý kho dược phẩm theo thời gian thực, tự động cảnh báo tồn kho và HSD mỹ phẩm.</p>
            </div>
            <div className="bento-card glass-panel liquid-glass col-span-2 reveal-on-scroll" style={{transitionDelay: '400ms'}}>
              <div className="bento-icon-wrapper icon-surface">
                <span className="material-symbols-outlined text-[24px]">compare</span>
              </div>
              <h3>Before &amp; After Tracking</h3>
              <p>Theo dõi tiến trình điều trị trực quan. Hệ thống overlay hình ảnh giúp đánh giá hiệu quả vi điểm chính xác nhất.</p>
            </div>
          </div>
        </section>
      </main>

      <section className="showcase-section">
        <div className="showcase-overlay"></div>
        <div className="showcase-content reveal-glass">
          <h2 className="showcase-title gradient-text-anim">Tiêu Chuẩn Y Khoa - Tinh Hoa Công Nghệ</h2>
          <p className="hero-desc">Mọi điểm chạm trên hệ thống đều được thiết kế để tối ưu hóa thời gian của bác sĩ và nâng tầm trải nghiệm của bệnh nhân.</p>
        </div>
      </section>

      <footer className="site-footer glass-panel liquid-glass reveal-on-scroll">
        <div className="footer-brand">
          <span>DermaSmart</span>
          <p>© 2024 DermaSmart. Nền tảng y tế số thông minh.</p>
        </div>
        <div className="footer-links">
          <a href="#">Chính sách bảo mật</a>
          <a href="#">Điều khoản dịch vụ</a>
          <a href="#">Hỗ trợ kỹ thuật</a>
        </div>
      </footer>
    </>
  );
}

export default LandingPage;
