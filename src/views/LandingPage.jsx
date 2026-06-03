import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDoctorController } from '../controllers/useDoctorController';
import ChangePasswordModal from './ChangePasswordModal';
import BookingModal from '../components/BookingModal';
import FreeSkinScanModal from '../components/FreeSkinScanModal';
import FloatingChatbot from '../components/PatientPortal/FloatingChatbot';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, LogOut, User } from 'lucide-react';
import '../index.css';


// Framer Motion Animation Variants
const heroContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

const heroFadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 100,
      duration: 0.8
    }
  }
};

function LandingPage({ user, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAIScanOpen, setIsAIScanOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDocId, setBookingDocId] = useState(null);
  
  const navigate = useNavigate();
  const { getDoctors } = useDoctorController();
  const doctorsList = getDoctors();
  const mobileMenuRef = useRef(null);

  const handleBookFromHero = () => {
    if (!user) {
      navigate('/login');
    } else {
      setBookingDocId(null);
      setIsBookingOpen(true);
    }
  };

  const handleBookFromModal = () => {
    if (!user) {
      navigate('/login');
    } else {
      const docId = selectedDoctor.id;
      setSelectedDoctor(null);
      setBookingDocId(docId);
      setIsBookingOpen(true);
    }
  };

  // Close user dropdown on outside click
  useEffect(() => {
    if (!showUserDropdown) return;
    const closeDropdown = (e) => {
      if (!e.target.closest('.user-profile')) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, [showUserDropdown]);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeMobileMenu = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target) && !e.target.closest('.mobile-menu-btn')) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('click', closeMobileMenu);
    return () => document.removeEventListener('click', closeMobileMenu);
  }, [mobileMenuOpen]);

  // Scroll handler + IntersectionObserver for reveal animations + liquid glass mouse tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);

    // Scroll reveal observer
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

    // Liquid glass mouse tracking
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
  }, []);

  const handleNavigateToDoctor = useCallback((docId) => {
    navigate(`/doctor/${docId}`);
  }, [navigate]);

  return (
    <>
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/20 blur-[120px] animate-[float_15s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-secondary/10 blur-[150px] animate-[float-reverse_20s_ease-in-out_infinite]" />
        <div className="absolute top-[30%] left-[50%] w-[40vw] h-[40vw] rounded-full bg-primary-fixed-dim/20 blur-[100px] animate-[float_18s_ease-in-out_infinite_3s]" />
      </div>

      {/* TopNavBar */}
      <motion.nav
        className={`fixed top-0 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between backdrop-blur-xl ${
          scrolled
            ? 'bg-white/70 border border-white/50 shadow-[0_10px_30px_rgba(0,0,0,0.08)]'
            : 'bg-white/5 border-b border-white/10'
        }`}
        animate={{
          width: scrolled ? "80%" : "100%",
          maxWidth: scrolled ? "1024px" : "100vw",
          top: scrolled ? "16px" : "0px",
          borderRadius: scrolled ? "9999px" : "0px",
          paddingLeft: scrolled ? "2rem" : "1.5rem",
          paddingRight: scrolled ? "2rem" : "1.5rem",
          height: scrolled ? "70px" : "80px",
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 30,
          mass: 0.8,
        }}
      >
        <a
          className="flex items-center gap-2 transition-transform hover:scale-105"
          href="#"
        >
          <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-sky-500">
            DermaSmart
          </span>
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <a className={`transition-colors duration-300 font-semibold text-sm ${scrolled ? 'text-on-surface hover:text-primary' : 'text-gray-100 hover:text-white'}`} href="#">Trang chủ</a>
          <a className={`transition-colors duration-300 font-semibold text-sm ${scrolled ? 'text-on-surface hover:text-primary' : 'text-gray-100 hover:text-white'}`} href="#features">Tính năng AI</a>
          <a
            onClick={handleBookFromHero}
            className={`transition-colors duration-300 font-semibold text-sm cursor-pointer ${scrolled ? 'text-on-surface hover:text-primary' : 'text-gray-100 hover:text-white'}`}
          >
            Đặt lịch khám
          </a>
          <a className={`transition-colors duration-300 font-semibold text-sm ${scrolled ? 'text-on-surface hover:text-primary' : 'text-gray-100 hover:text-white'}`} href="#pricing">Bảng giá</a>
        </div>

        {/* Desktop Nav Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="user-profile relative">
              <span
                className={`cursor-pointer select-none gap-2 flex items-center transition-colors duration-200 font-semibold text-sm ${scrolled ? 'text-on-surface' : 'text-gray-100'}`}
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <span className="material-symbols-outlined">account_circle</span>
                Xin chào, {user.username}
                <span
                  className="material-symbols-outlined text-[1.2rem] transition-transform duration-300"
                  style={{ transform: showUserDropdown ? 'rotate(180deg)' : 'rotate(0)' }}
                >
                  keyboard_arrow_down
                </span>
              </span>

              {showUserDropdown && (
                <div className="absolute top-full right-0 mt-3 w-56 backdrop-blur-2xl bg-white/70 border border-white/60 shadow-xl rounded-2xl p-2 z-[100] font-sans flex flex-col gap-1">
                  <button
                    onClick={() => { navigate('/profile'); setShowUserDropdown(false); }}
                    className="bg-transparent border-none text-slate-700 py-3 px-4 rounded-xl cursor-pointer flex items-center gap-3 text-sm font-semibold text-left transition-colors duration-200 w-full hover:bg-teal-50/80 hover:text-teal-700"
                  >
                    <User size={16} />
                    Hồ sơ cá nhân
                  </button>
                  <button
                    onClick={() => { setIsChangePasswordOpen(true); setShowUserDropdown(false); }}
                    className="bg-transparent border-none text-slate-700 py-3 px-4 rounded-xl cursor-pointer flex items-center gap-3 text-sm font-semibold text-left transition-colors duration-200 w-full hover:bg-emerald-50/80 hover:text-emerald-700"
                  >
                    <Key size={16} />
                    Đổi mật khẩu
                  </button>
                  <div className="h-px bg-slate-200/50 my-1" />
                  <button
                    onClick={() => { onLogout(); setShowUserDropdown(false); }}
                    className="bg-transparent border-none text-slate-700 py-3 px-4 rounded-xl cursor-pointer flex items-center gap-3 text-sm font-semibold text-left transition-colors duration-200 w-full hover:bg-sky-50/80 hover:text-sky-700"
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                className={`hover:bg-white/10 px-5 py-2 rounded-xl transition-all backdrop-blur-md font-semibold text-sm bg-transparent border-none cursor-pointer ${scrolled ? 'text-primary' : 'text-gray-100'}`}
                onClick={() => navigate('/login')}
              >
                Đăng nhập
              </button>
              <button
                className="bg-teal-500/80 backdrop-blur-xl text-white px-6 py-2 rounded-xl border border-teal-400/50 shadow-[0_0_20px_rgba(13,148,136,0.4)] hover:scale-105 transition-transform font-semibold text-sm cursor-pointer"
                onClick={() => navigate('/login')}
              >
                Đăng ký
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn md:hidden p-2 bg-transparent border-none cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className={`material-symbols-outlined ${scrolled ? 'text-on-surface' : 'text-gray-100'}`}>
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </motion.nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="fixed top-[60px] left-0 right-0 z-40 bg-inverse-surface/95 backdrop-blur-[20px] border-b border-white/10 p-6 flex flex-col gap-4 md:hidden"
        >
          <a className="text-white/90 font-semibold text-sm py-2" href="#">Trang chủ</a>
          <a className="text-white/90 font-semibold text-sm py-2" href="#features">Tính năng AI</a>
          <a
            onClick={() => { handleBookFromHero(); setMobileMenuOpen(false); }}
            className="text-white/90 font-semibold text-sm py-2 cursor-pointer"
          >
            Đặt lịch khám
          </a>
          <a className="text-white/90 font-semibold text-sm py-2" href="#pricing">Bảng giá</a>
          <div className="h-px bg-white/[0.08] my-2" />
          {user ? (
            <>
              <span className="text-primary-fixed-dim font-semibold text-sm">Xin chào, {user.username}</span>
              <button
                onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                className="bg-transparent border-none text-white/90 py-2 cursor-pointer flex items-center gap-3 text-sm font-semibold"
              >
                <User size={16} />
                Hồ sơ cá nhân
              </button>
              <button
                onClick={() => { setIsChangePasswordOpen(true); setMobileMenuOpen(false); }}
                className="bg-transparent border-none text-white/90 py-2 cursor-pointer flex items-center gap-3 text-sm font-semibold"
              >
                <Key size={16} />
                Đổi mật khẩu
              </button>
              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="bg-transparent border-none text-red-300 py-2 cursor-pointer flex items-center gap-3 text-sm font-semibold"
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                className="text-white/90 hover:bg-white/10 px-5 py-2 rounded-xl transition-all font-semibold text-sm bg-transparent border-none cursor-pointer"
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
              >
                Đăng nhập
              </button>
              <button
                className="bg-teal-500/80 text-white px-6 py-2 rounded-xl border border-teal-400/50 shadow-[0_0_20px_rgba(13,148,136,0.4)] font-semibold text-sm cursor-pointer"
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hero Section */}
      <section className="w-full min-h-screen relative flex items-center justify-center bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuC7OT0v_iIuLuAj_638_No62Zj23gC1KQA7roRACzLjiLa5jYLAeKega8Dwb-SCFvAu5Wi76p09MdxZi4j754BX_lNLTfkZCLy5KVnCsbssI9kcKe7I1gyOu_UFP7ghIVcH8gTGb_kWawh0YavzsSvrhfktOTAUAg2pxD1M8u98KkgOAtzwFbpk4n96RScPsHIQbMA-3RuJ5zI46ePjON42HR0UcsNyVNnvLQ-x3ohlqvWYp2bCJhaXVe8-aGw1R2b7KpQ6Qj13ZEX8')] bg-cover bg-center bg-no-repeat bg-fixed overflow-hidden py-24 md:py-32">
        {/* Animated Background Mesh Gradients */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-200/40 blur-[100px] opacity-20 animate-[float_15s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-sky-200/40 blur-[100px] opacity-20 animate-[float-reverse_20s_ease-in-out_infinite]" />
          <div className="absolute top-[30%] left-[50%] w-[40vw] h-[40vw] rounded-full bg-emerald-100/30 blur-[100px] opacity-20 animate-[float_18s_ease-in-out_infinite_3s]" />
        </div>

        {/* Restored Massive Centered Glassmorphic Container */}
        <motion.div
          variants={heroContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
          className="relative z-10 w-[85vw] md:w-[80vw] max-w-6xl mx-auto bg-white/40 backdrop-blur-3xl border border-white/60 shadow-2xl rounded-[2.5rem] p-8 md:p-16 flex flex-col items-center text-center"
        >
          {/* Top Tag */}
          <motion.div
            variants={heroFadeInUp}
            className="bg-emerald-100/50 backdrop-blur-md rounded-full px-4 py-1.5 border border-emerald-200 text-emerald-800 text-sm font-semibold tracking-wide"
          >
            ✨ Ra mắt phiên bản AI 2.0
          </motion.div>

          {/* H1 */}
          <motion.h1
            variants={heroFadeInUp}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mt-8 mb-6"
          >
            Kỷ Nguyên Mới Của<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-sky-500">
              Chăm Sóc Da Liễu Tích Hợp AI
            </span>
          </motion.h1>

          {/* Paragraph */}
          <motion.p
            variants={heroFadeInUp}
            className="text-lg text-slate-500 font-medium leading-relaxed max-w-3xl mb-12"
          >
            Hợp nhất soi da AI, bệnh án điện tử và vận hành phòng khám trong một nền tảng tinh khiết, nhanh và chuẩn y khoa.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={heroFadeInUp}
            className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 w-full sm:w-auto items-center justify-center"
          >
            <button
              onClick={handleBookFromHero}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/25 px-8 py-4 rounded-2xl transition-all cursor-pointer border-none text-base"
            >
              Đặt lịch khám ngay
            </button>
            <button
              onClick={() => setIsAIScanOpen(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-sky-400 to-emerald-400 hover:from-sky-500 hover:to-emerald-500 text-white font-bold shadow-lg shadow-sky-500/25 px-8 py-4 rounded-2xl transition-all cursor-pointer border-none text-base flex items-center justify-center gap-2"
            >
              ✨ Soi da AI miễn phí
            </button>
            <button
              onClick={() => {
                const featuresEl = document.getElementById('features');
                if (featuresEl) featuresEl.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto border border-sky-300 hover:bg-white/50 text-sky-600 font-semibold px-8 py-4 rounded-2xl transition-all cursor-pointer bg-transparent text-base"
            >
              Xem tính năng AI
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Main Content Canvas */}
      <main className="flex-grow py-24 px-4 md:px-10 w-full max-w-[1280px] mx-auto flex flex-col gap-[120px]">

        {/* Doctors Showcase Section */}
        <section className="w-full flex flex-col gap-12 mb-12">
          <div className="text-center w-full max-w-2xl mx-auto flex flex-col gap-4">
            <h2 className="font-bold text-[32px] leading-[1.3] tracking-[-0.01em] text-on-surface">Đội ngũ chuyên gia hàng đầu</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {doctorsList.map((doc, index) => (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring" }}
                viewport={{ once: false, amount: 0.2 }}
                key={doc.id}
                className="glass-panel liquid-glass rounded-3xl overflow-hidden flex flex-col group hover:-translate-y-2 transition-transform duration-500"
              >
                <div className="w-full h-80 overflow-hidden relative">
                  <img
                    alt={doc.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                    src={doc.image}
                  />
                </div>
                <div className="bg-white p-6 flex flex-col gap-4 flex-grow relative z-10">
                  <div>
                    <h3 className="font-semibold text-[20px] text-primary">{doc.name}</h3>
                    <p className="text-on-surface-variant text-sm">{doc.title}</p>
                  </div>
                  <button
                    onClick={() => setSelectedDoctor(doc)}
                    className="mt-auto flex items-center justify-center gap-2 py-3 px-4 bg-primary/5 hover:bg-primary text-primary hover:text-white rounded-xl transition-all duration-300 font-semibold text-sm border-none cursor-pointer group/btn"
                  >
                    <span>Xem hồ sơ</span>
                    <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Section (Bento Box) */}
        <section id="features" className="flex flex-col gap-12 w-full">
          <div className="text-center w-full max-w-2xl mx-auto flex flex-col gap-4">
            <h2 className="font-bold text-[32px] leading-[1.3] tracking-[-0.01em] text-on-surface">Công Nghệ Đột Phá Cho Làn Da Hoàn Hảo</h2>
            <p className="text-on-surface-variant">Giải pháp toàn diện kết nối dữ liệu bệnh lý, phác đồ điều trị và quản trị vận hành trên cùng một nền tảng kính tương tác mượt mà.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large Feature */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              viewport={{ once: false, amount: 0.2 }}
              className="md:col-span-2 glass-panel liquid-glass rounded-2xl p-8 flex flex-col justify-between group hover:bg-surface/60 transition-colors relative overflow-hidden"
            >
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500 group-hover:scale-150" />
              <div className="z-10 flex flex-col gap-4 max-w-md">
                <div className="w-12 h-12 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-2 transition-transform duration-300 group-hover:-translate-y-1">
                  <span className="material-symbols-outlined text-[24px]">face_retouching_natural</span>
                </div>
                <h3 className="font-semibold text-[24px] text-on-surface">AI Skin Analytics Pro</h3>
                <p className="text-on-surface-variant">Phân tích đa tầng 14 chỉ số da chỉ trong 5 giây. Công nghệ quang phổ hẹp giúp phát hiện tổn thương biểu bì ẩn sâu.</p>
              </div>
              {/* Abstract geometric representation */}
              <div className="w-full h-32 mt-8 border border-white/30 rounded-xl relative overflow-hidden flex items-center justify-center bg-surface-container-low/50">
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent absolute" />
                <div className="w-8 h-8 rounded-full border border-primary absolute animate-ping opacity-20" />
                <div className="w-16 h-16 rounded-full border border-primary absolute animate-ping opacity-10" style={{ animationDelay: '0.5s' }} />
                <span className="material-symbols-outlined text-primary/30 text-[64px]">troubleshoot</span>
              </div>
            </motion.div>

            {/* Small Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              viewport={{ once: false, amount: 0.2 }}
              className="glass-panel liquid-glass rounded-2xl p-8 flex flex-col gap-4 group hover:bg-surface/60 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center mb-2 transition-transform duration-300 group-hover:-translate-y-1">
                <span className="material-symbols-outlined text-[24px]">receipt_long</span>
              </div>
              <h3 className="font-semibold text-[20px] text-on-surface">Smart EMR</h3>
              <p className="text-on-surface-variant text-sm">Hồ sơ bệnh án điện tử thông minh, tự động liên kết kết quả soi da với phác đồ cá nhân hóa.</p>
            </motion.div>

            {/* Small Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              viewport={{ once: false, amount: 0.2 }}
              className="glass-panel liquid-glass rounded-2xl p-8 flex flex-col gap-4 group hover:bg-surface/60 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-tertiary-container text-on-tertiary-container flex items-center justify-center mb-2 transition-transform duration-300 group-hover:-translate-y-1">
                <span className="material-symbols-outlined text-[24px]">inventory_2</span>
              </div>
              <h3 className="font-semibold text-[20px] text-on-surface">Real-time Inventory</h3>
              <p className="text-on-surface-variant text-sm">Quản lý kho dược phẩm theo thời gian thực, tự động cảnh báo tồn kho và HSD mỹ phẩm.</p>
            </motion.div>

            {/* Medium Feature */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              viewport={{ once: false, amount: 0.2 }}
              className="md:col-span-2 glass-panel liquid-glass rounded-2xl p-8 flex flex-row items-center gap-8 group hover:bg-surface/60 transition-colors"
            >
              <div className="flex-grow flex flex-col gap-4">
                <div className="w-12 h-12 rounded-lg bg-surface-variant text-on-surface flex items-center justify-center mb-2 transition-transform duration-300 group-hover:-translate-y-1">
                  <span className="material-symbols-outlined text-[24px]">compare</span>
                </div>
                <h3 className="font-semibold text-[20px] text-on-surface">Before &amp; After Tracking</h3>
                <p className="text-on-surface-variant text-sm">Theo dõi tiến trình điều trị trực quan. Hệ thống overlay hình ảnh giúp đánh giá hiệu quả vi điểm chính xác nhất.</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="flex flex-col gap-12 w-full mt-12">
          <div className="text-center w-full max-w-2xl mx-auto flex flex-col gap-4">
            <h2 className="font-bold text-[32px] leading-[1.3] tracking-[-0.01em] text-on-surface">Tại sao chọn DermaSmart?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Point 1 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              viewport={{ once: false, amount: 0.2 }}
              className="glass-panel liquid-glass rounded-2xl p-8 flex flex-col items-center text-center gap-4 group hover:bg-surface/60 transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110">
                <span className="material-symbols-outlined text-[32px]">verified</span>
              </div>
              <h3 className="font-semibold text-[20px] text-on-surface">Chẩn đoán chính xác 99%</h3>
              <p className="text-on-surface-variant text-sm">Hệ thống AI được huấn luyện trên hàng triệu dữ liệu lâm sàng.</p>
            </motion.div>
            {/* Point 2 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              viewport={{ once: false, amount: 0.2 }}
              className="glass-panel liquid-glass rounded-2xl p-8 flex flex-col items-center text-center gap-4 group hover:bg-surface/60 transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110">
                <span className="material-symbols-outlined text-[32px]">timer</span>
              </div>
              <h3 className="font-semibold text-[20px] text-on-surface">Tiết kiệm 50% thời gian</h3>
              <p className="text-on-surface-variant text-sm">Tự động hóa hồ sơ bệnh án và phân tích kết quả soi da.</p>
            </motion.div>
            {/* Point 3 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              viewport={{ once: false, amount: 0.2 }}
              className="glass-panel liquid-glass rounded-2xl p-8 flex flex-col items-center text-center gap-4 group hover:bg-surface/60 transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110">
                <span className="material-symbols-outlined text-[32px]">security</span>
              </div>
              <h3 className="font-semibold text-[20px] text-on-surface">Bảo mật dữ liệu y khoa</h3>
              <p className="text-on-surface-variant text-sm">Tuân thủ tiêu chuẩn bảo mật y tế quốc tế, an toàn tuyệt đối.</p>
            </motion.div>
          </div>
        </section>

        {/* Process Section */}
        <section className="flex flex-col gap-12 w-full mt-12">
          <div className="text-center w-full max-w-2xl mx-auto flex flex-col gap-4">
            <h2 className="font-bold text-[32px] leading-[1.3] tracking-[-0.01em] text-on-surface">Quy trình hiện đại</h2>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 relative">
            {/* Desktop connecting line */}
            <div className="hidden md:block absolute top-[32px] left-[10%] w-[80%] h-0.5 bg-outline-variant/30 -z-10" />

            {[
              { step: 1, label: 'Quét da AI', highlight: false },
              { step: 2, label: 'Bác sĩ tư vấn', highlight: false },
              { step: 3, label: 'Điều trị chuyên sâu', highlight: false },
              { step: 4, label: 'Theo dõi kết quả', highlight: true },
            ].map(({ step, label, highlight }) => (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring" }}
                viewport={{ once: false, amount: 0.2 }}
                key={step}
                className="flex flex-col items-center gap-4 z-10 w-full md:w-1/4"
              >
                <div className={`w-16 h-16 rounded-full border-4 border-surface shadow-md flex items-center justify-center font-bold text-xl ${
                  highlight
                    ? 'bg-primary text-on-primary shadow-primary/40'
                    : 'bg-surface-container-highest text-primary'
                }`}>
                  {step}
                </div>
                <h3 className={`font-semibold text-[18px] ${highlight ? 'text-primary' : 'text-on-surface'}`}>{label}</h3>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Frosted Glass Showcase */}
      <section
        className="w-full min-h-[600px] relative bg-fixed bg-center bg-cover flex items-center justify-center px-4 mt-12"
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuATpqIKoVRl7pbivP-KIqn3TPymxL55zcg2m9ulYRdNEVVWWHKWDgGrOirVUvNF6-bbY-Snh17jZaI1zxpJJFHn7kZ_zcWda-zVuOv8TtMrB3wb2RZZ19uNbhN7NwcpDFyNuoA91FjUSsSUd2c2wPjZcaPZxLaSY7Dn8MlIS4BHuiNdLzj1yCLDPaTpr24iUQkcehOjH72t20QJw1YaLpD8kgkbK8eSjyyCZOLZgHB7WY-LxS_NJ6c-OO0XHpyyAhDIhFheTmEhIRMq')" }}
      >
        <div className="absolute inset-0 bg-teal-900/20 backdrop-blur-2xl" />
        <div className="reveal-glass z-10 bg-white/10 backdrop-blur-[48px] border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-3xl p-8 md:p-16 max-w-4xl mx-auto text-center relative overflow-hidden bg-gradient-to-tr from-white/5 to-white/20">
          <h2 className="font-bold text-[32px] md:text-[48px] md:leading-[1.2] md:tracking-[-0.02em] text-white drop-shadow-md mb-6 leading-[1.3]">
            Tiêu Chuẩn Y Khoa - Tinh Hoa Công Nghệ
          </h2>
          <p className="text-lg text-white/90">
            Mọi điểm chạm trên hệ thống đều được thiết kế để tối ưu hóa thời gian của bác sĩ và nâng tầm trải nghiệm của bệnh nhân.
          </p>
        </div>
      </section>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        viewport={{ once: false, amount: 0.2 }}
        className="w-full px-10 py-12 mt-20 flex flex-col md:flex-row justify-between items-center gap-6 bg-surface-container-low/40 backdrop-blur-xl rounded-t-lg border-t border-white/50 glass-panel liquid-glass"
      >
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="font-bold text-[24px] text-primary">DermaSmart</span>
          <p className="text-on-surface-variant">© 2024 DermaSmart. Nền tảng y tế số thông minh.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <a className="text-on-surface-variant hover:text-secondary transition-colors duration-300 no-underline" href="#">Chính sách bảo mật</a>
          <a className="text-on-surface-variant hover:text-secondary transition-colors duration-300 no-underline" href="#">Điều khoản dịch vụ</a>
          <a className="text-on-surface-variant hover:text-secondary transition-colors duration-300 no-underline" href="#">Hỗ trợ kỹ thuật</a>
        </div>
      </motion.footer>

      <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />
      <FloatingChatbot onBookAppointment={() => setIsBookingOpen(true)} onAIScan={() => setIsAIScanOpen(true)} />
      <FreeSkinScanModal isOpen={isAIScanOpen} onClose={() => setIsAIScanOpen(false)} onBookAppointment={() => setIsBookingOpen(true)} />

      {/* Doctor Profile Modal (Liquid Glass) */}
      <AnimatePresence>
        {selectedDoctor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedDoctor(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-[70vw] h-[70vh] min-h-[500px] bg-white/60 backdrop-blur-3xl border border-white/80 shadow-2xl rounded-[2.5rem] relative overflow-hidden flex flex-col p-12"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors border-none cursor-pointer z-50 shadow-sm"
                onClick={() => setSelectedDoctor(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              {/* Modal Body */}
              <div className="flex flex-col md:flex-row gap-12 items-center md:items-stretch h-full overflow-y-auto pr-2">
                {/* Left Side: Avatar */}
                <div className="w-full md:w-2/5 min-h-[250px] md:min-h-full rounded-3xl overflow-hidden relative shadow-lg">
                  <img
                    alt={selectedDoctor.name}
                    className="w-full h-full object-cover object-top"
                    src={selectedDoctor.image}
                  />
                  {/* Premium overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Right Side: Details */}
                <div className="w-full md:w-3/5 flex flex-col justify-start text-left pt-4">
                  <span className="bg-emerald-100/70 text-emerald-800 rounded-full px-4 py-1.5 text-xs font-semibold self-start mb-4 border border-emerald-200/50">
                    Chuyên Gia Da Liễu
                  </span>
                  <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
                    {selectedDoctor.name}
                  </h2>
                  <h4 className="text-lg font-semibold text-sky-600 mb-4">
                    {selectedDoctor.title} ({selectedDoctor.experience})
                  </h4>
                  
                  <div className="h-px bg-slate-200/60 w-full mb-6" />

                  <p className="text-slate-600 leading-relaxed text-base font-medium mb-6">
                    {selectedDoctor.bio}
                  </p>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedDoctor.specialties?.map((spec, sIdx) => (
                      <span key={sIdx} className="bg-emerald-50/50 text-emerald-800 rounded-lg px-3 py-1.5 text-xs font-semibold border border-emerald-100/50">
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-auto">
                    <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm">
                      <span className="material-symbols-outlined text-emerald-500 mb-1">payments</span>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Phí khám</p>
                      <p className="text-sm font-bold text-slate-800">{selectedDoctor.consultationFee}</p>
                    </div>
                    <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm">
                      <span className="material-symbols-outlined text-sky-500 mb-1">star</span>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Đánh giá</p>
                      <p className="text-sm font-bold text-slate-800">{selectedDoctor.rating} ★</p>
                    </div>
                    <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm">
                      <span className="material-symbols-outlined text-teal-500 mb-1">calendar_month</span>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Lịch khám</p>
                      <p className="text-xs font-bold text-slate-800 leading-snug truncate">
                        {selectedDoctor.schedule?.[0]?.day || "Liên hệ"}
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Book CTA inside Modal */}
                  <button
                    onClick={handleBookFromModal}
                    className="mt-6 w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-sky-500 text-white font-bold text-sm shadow-md shadow-teal-500/20 hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5 border-none cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined">event_available</span>
                    Đặt lịch khám ngay
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedDoctorId={bookingDocId}
        onSuccess={() => navigate('/profile')}
      />
    </>
  );
}

export default LandingPage;
