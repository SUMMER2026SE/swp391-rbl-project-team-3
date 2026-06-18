import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { VoucherModel } from '../models/VoucherModel';
import { useDoctors } from '../hooks/useDoctors';
import ChangePasswordModal from './ChangePasswordModal';
import FreeSkinScanModal from '../components/FreeSkinScanModal';
import FloatingChatbot from '../components/PatientPortal/FloatingChatbot';
import BookAppointmentForm from '../components/PatientPortal/BookAppointmentForm';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionTemplate,
} from 'framer-motion';
import { Key, LogOut, User, Ticket, Tag, Calendar, ArrowRight, ChevronDown } from 'lucide-react';
import logo from '../assets/logo.png';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useFeedbackController } from '../controllers/useFeedbackController';

import '../index.css';

// Component for fetching and displaying doctor reviews
function DoctorReviewsList({ doctorId }) {
  const { feedbacks, isLoading } = useFeedbackController({ doctorId });
  
  if (isLoading) return <div className="text-slate-500 text-sm mt-6 animate-pulse">Đang tải đánh giá...</div>;
  if (!feedbacks || feedbacks.length === 0) return <div className="text-slate-500 text-sm mt-6 bg-slate-50/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100">Chưa có đánh giá nào cho bác sĩ này.</div>;

  return (
    <div className="mt-6 flex flex-col gap-3 relative">
      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-sky-500">forum</span>
        Đánh giá từ bệnh nhân ({feedbacks.length})
      </h4>
      <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
        {feedbacks.map((fb, idx) => (
          <div key={idx} className="bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-[10px] font-bold uppercase">
                  {(fb.patient?.full_name || fb.patient?.name || 'A').charAt(0)}
                </div>
                {fb.patient?.full_name || fb.patient?.name || 'Bệnh nhân ẩn danh'}
              </span>
              <span className="text-amber-500 text-[11px] font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 flex items-center gap-1">
                {fb.overallRating || fb.rating || 5} <span className="material-symbols-outlined text-[12px] leading-none">star</span>
              </span>
            </div>
            {fb.comment && <p className="text-slate-600 text-[13px] leading-relaxed italic pl-8">"{fb.comment}"</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// Component for displaying all doctors grid
function AllDoctorsModal({ isOpen, onClose, doctors, onSelectDoctor }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="w-[90vw] h-[90vh] bg-white/90 backdrop-blur-3xl border border-white/80 shadow-2xl rounded-[2.5rem] relative overflow-hidden flex flex-col p-6 md:p-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/50">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Đội ngũ Bác sĩ</h2>
          <button
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors border-none cursor-pointer"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 md:pr-4 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {doctors.map((doc, idx) => (
              <div
                key={idx}
                className="bg-white/80 rounded-[20px] shadow-sm border border-slate-200/60 flex flex-col overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
                onClick={() => {
                  onClose();
                  onSelectDoctor(doc);
                }}
              >
                <div className="relative w-full h-[220px] bg-slate-100 overflow-hidden">
                  <img
                    src={doc.image}
                    alt={doc.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 flex flex-col gap-1.5">
                  <h3 className="text-[16px] font-extrabold text-slate-800 tracking-tight leading-tight">{doc.name}</h3>
                  <p className="text-[12px] text-slate-500 font-medium">{doc.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded-md">{doc.experience || 'Chưa cập nhật'}</span>
                    <span className="text-[11px] font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-md flex items-center gap-0.5">
                      {doc.rating ? `${doc.rating} ⭐ (${doc.reviewsCount || 0})` : 'Chưa có đánh giá'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

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

const ROLE_MAP = {
  1: 'Quản trị viên',
  2: 'Bác sĩ',
  3: 'Kỹ thuật viên',
  4: 'Lễ tân',
  5: 'Bệnh nhân'
};

// String-keyed role display map (used when role is already resolved to a name)
const ROLE_DISPLAY = {
  ADMIN: 'Quản trị viên',
  DOCTOR: 'Bác sĩ',
  TECHNICIAN: 'Kỹ thuật viên',
  RECEPTIONIST: 'Lễ tân',
  PATIENT: 'Bệnh nhân',
};

// Maps numeric role_id → string role name (same mapping as AuthContext ROLE_BY_ID)
const ROLE_ID_TO_NAME = { 1: 'ADMIN', 2: 'DOCTOR', 3: 'TECHNICIAN', 4: 'RECEPTIONIST', 5: 'PATIENT' };

// Maps string role name → dashboard path
const ROLE_DASHBOARD = {
  ADMIN: '/dashboard/admin',
  DOCTOR: '/dashboard/doctor',
  TECHNICIAN: '/dashboard/technician',
  RECEPTIONIST: '/dashboard/receptionist',
};

// ──────────────────────────────────────────────────────────────────────────────
// LOCAL FALLBACK DATA (public Landing Page only)
// The Landing Page is public-facing and must always look complete, even before
// the Supabase tables are seeded. Real data from DoctorModel/VoucherModel still
// takes priority — these arrays are only used when the live fetch returns empty
// or fails, so the marketing page never renders blank for visitors.
// ──────────────────────────────────────────────────────────────────────────────
const LOCAL_MOCK_DOCTORS = [
  {
    id: 'mock-doc-01',
    name: 'BS. CKII. Trần Hải Yến',
    title: 'Trưởng khoa Da liễu Thẩm mỹ',
    image: 'https://i.pravatar.cc/600?img=47',
    experience: '15 năm kinh nghiệm',
    bio: 'Chuyên gia đầu ngành về điều trị nám, trẻ hóa da công nghệ cao và laser thẩm mỹ. Từng tu nghiệp tại Hàn Quốc và Singapore.',
    specialties: ['Trị nám & tàn nhang', 'Trẻ hóa da', 'Laser thẩm mỹ'],
    consultationFee: '500,000 VNĐ',
    rating: 4.9,
    reviewsCount: 312,
    schedule: [
      { day: 'Thứ Hai', hours: '08:00 - 17:00' },
      { day: 'Thứ Tư', hours: '08:00 - 17:00' },
      { day: 'Thứ Sáu', hours: '08:00 - 17:00' },
    ],
  },
  {
    id: 'mock-doc-02',
    name: 'ThS. BS. Nguyễn Minh Khoa',
    title: 'Bác sĩ Da liễu lâm sàng',
    image: 'https://i.pravatar.cc/600?img=12',
    experience: '10 năm kinh nghiệm',
    bio: 'Tận tâm trong điều trị mụn trứng cá, sẹo rỗ và các bệnh lý viêm da mạn tính bằng phác đồ cá nhân hóa kết hợp AI.',
    specialties: ['Điều trị mụn', 'Sẹo rỗ', 'Viêm da cơ địa'],
    consultationFee: '350,000 VNĐ',
    rating: 4.8,
    reviewsCount: 248,
    schedule: [
      { day: 'Thứ Ba', hours: '08:00 - 17:00' },
      { day: 'Thứ Năm', hours: '08:00 - 17:00' },
      { day: 'Thứ Bảy', hours: '08:00 - 12:00' },
    ],
  },
  {
    id: 'mock-doc-03',
    name: 'BS. CKI. Lê Thị Phương Anh',
    title: 'Bác sĩ Da liễu & Chăm sóc da',
    image: 'https://i.pravatar.cc/600?img=45',
    experience: '8 năm kinh nghiệm',
    bio: 'Chuyên sâu về soi da AI, tư vấn chăm sóc da khoa học và điều trị các vấn đề sắc tố, lão hóa sớm cho mọi loại da.',
    specialties: ['Soi da AI', 'Chăm sóc da chuyên sâu', 'Chống lão hóa'],
    consultationFee: '300,000 VNĐ',
    rating: 4.9,
    reviewsCount: 196,
    schedule: [
      { day: 'Thứ Hai', hours: '13:00 - 20:00' },
      { day: 'Thứ Tư', hours: '13:00 - 20:00' },
      { day: 'Thứ Sáu', hours: '13:00 - 20:00' },
    ],
  },
];

const LOCAL_MOCK_VOUCHERS = [
  {
    id: 'mock-v-01',
    name: 'Ưu đãi Khám lần đầu',
    description: 'Giảm ngay 20% phí khám cho khách hàng đặt lịch lần đầu tại DermaSmart.',
    discountType: 'Percentage',
    discountValue: 20,
    validTo: '2026-12-31',
    minOrderAmount: 0,
    applicableServices: [],
    maxUsage: 200,
    usageCount: 74,
    eventTag: '',
    eventEmoji: '',
  },
  {
    id: 'mock-v-02',
    name: 'Combo Trẻ Hóa Mùa Hè',
    description: 'Giảm 500.000đ cho liệu trình trẻ hóa & trị nám công nghệ cao.',
    discountType: 'Amount',
    discountValue: 500000,
    validTo: '2026-08-31',
    minOrderAmount: 2000000,
    applicableServices: [],
    maxUsage: 100,
    usageCount: 88,
    eventTag: 'Hè Rực Rỡ',
    eventEmoji: '☀️',
  },
  {
    id: 'mock-v-03',
    name: 'Soi Da AI Miễn Phí',
    description: 'Tặng lượt soi da AI 14 chỉ số khi đặt lịch khám da liễu tổng quát.',
    discountType: 'Percentage',
    discountValue: 100,
    validTo: '2026-12-31',
    minOrderAmount: 0,
    applicableServices: [],
    maxUsage: 500,
    usageCount: 210,
    eventTag: 'AI 2.0',
    eventEmoji: '✨',
  },
];

function LandingPage({ onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAIScanOpen, setIsAIScanOpen] = useState(false);
  const [isAllDoctorsOpen, setIsAllDoctorsOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDocId, setBookingDocId] = useState(null);

  // Carousel State
  const [carouselItems, setCarouselItems] = useState([]);
  const [isCarouselAnimating, setIsCarouselAnimating] = useState(false);

  // Consume global authentication state from AuthContext
  const { user, loading: isLoadingAuth, logout } = useAuth();
  const isLoggedIn = !!user;
  const userFullName = user?.name || '';
  const userRoleName = user?.role || null;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const navigate = useNavigate();
  // Doctors come from the shared, normalized hook (same source the dashboards
  // use) so the showcase renders correct fields when real data is available.
  const { doctors: doctorsList } = useDoctors();
  const [activeVouchers, setActiveVouchers] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Initialize Carousel Items (load all doctors)
  useEffect(() => {
    const list = doctorsList.length > 0 ? doctorsList : LOCAL_MOCK_DOCTORS;
    setCarouselItems(list);
  }, [doctorsList]);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoadingData(true);
        const allVouchers = await VoucherModel.getAllVouchers();
        const today = new Date().toISOString().split('T')[0];
        const active = allVouchers?.filter?.(v =>
          v.status === 'Hoạt động' &&
          (v.validFrom ? v.validFrom <= today : true) &&
          (v.validTo ? v.validTo >= today : true) &&
          (v.usageCount || 0) < (v.maxUsage || 999));
        setActiveVouchers(active);
      } catch (err) {
        console.error('Error loading landing page data:', err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, []);

  // Carousel Auto-play (Seamless Infinite Loop)
  useEffect(() => {
    if (carouselItems.length === 0) return;
    const timer = setInterval(() => {
      setIsCarouselAnimating(true);
      setTimeout(() => {
        setIsCarouselAnimating(false);
        setCarouselItems((prev) => {
          const next = [...prev];
          next.push(next.shift());
          return next;
        });
      }, 600); // Wait for transition to finish
    }, 3000);
    return () => clearInterval(timer);
  }, [carouselItems.length]);

  const mobileMenuRef = useRef(null);

  // Dynamic routing helper using the resolved string role name
  const getDashboardRoute = (roleName) => {
    return ROLE_DASHBOARD[roleName] || '/profile';
  };

  const handleSupabaseLogout = async () => {
    try {
      if (onLogout) {
        await onLogout();
      } else {
        await logout();
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };



  /* --------------------------------------------------------------
     Continuous scroll-linked navbar morph (Part 2).
     `scrolled` (set in the effect below) only drives discrete text-color
     swaps; ALL geometry is interpolated smoothly from these springs so
     the bar gradually breathes into a floating pill — never snapping.
     -------------------------------------------------------------- */
  const { scrollY } = useScroll();
  const navSpring = { stiffness: 220, damping: 32, mass: 0.9 };
  const navWidthMV = useSpring(useTransform(scrollY, [0, 120], [100, 82]), navSpring);
  const navMaxWMV = useSpring(useTransform(scrollY, [0, 120], [2200, 1080]), navSpring);
  const navRadiusMV = useSpring(useTransform(scrollY, [0, 120], [0, 34]), navSpring);
  const navTopMV = useSpring(useTransform(scrollY, [0, 120], [0, 16]), navSpring);
  const navHeightMV = useSpring(useTransform(scrollY, [0, 120], [110, 90]), navSpring);
  const navPadMV = useSpring(useTransform(scrollY, [0, 120], [24, 34]), navSpring);
  const navBgMV = useSpring(useTransform(scrollY, [0, 120], [0.04, 0.72]), navSpring);
  const navShadowMV = useSpring(useTransform(scrollY, [0, 120], [0, 0.1]), navSpring);
  const navRingMV = useSpring(useTransform(scrollY, [0, 120], [0.1, 0.65]), navSpring);

  const navWidth = useMotionTemplate`${navWidthMV}%`;
  const navMaxWidth = useMotionTemplate`${navMaxWMV}px`;
  const navRadius = useMotionTemplate`${navRadiusMV}px`;
  const navTop = useMotionTemplate`${navTopMV}px`;
  const navHeight = useMotionTemplate`${navHeightMV}px`;
  const navPad = useMotionTemplate`${navPadMV}px`;
  const navBg = useMotionTemplate`rgba(255, 255, 255, ${navBgMV})`;
  const navShadow = useMotionTemplate`0 14px 40px rgba(2, 32, 29, ${navShadowMV}), inset 0 1px 2px rgba(255,255,255,0.85), inset 0 0 0 1px rgba(255,255,255,${navRingMV})`;

  const handleBookFromHero = () => {
    if (!isLoggedIn && !user) {
      navigate('/login');
    } else {
      setBookingDocId(null);
      setIsBookingOpen(true);
    }
  };

  const handleBookFromModal = () => {
    if (!isLoggedIn && !user) {
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
    if (!isDropdownOpen) return;
    const closeDropdown = (e) => {
      if (!e.target.closest('.user-profile-dropdown')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, [isDropdownOpen]);

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

  // Real Supabase data takes priority; fall back to local mock so the public
  // page is always visually complete even before the DB is seeded.
  const displayVouchers = activeVouchers.length > 0 ? activeVouchers : LOCAL_MOCK_VOUCHERS;

  // Render exactly the items needed for a seamless shift.
  // We append the first few items so the animation sliding left has content to reveal.
  const extendedCarouselItems = carouselItems.length > 0 ? [...carouselItems, ...carouselItems.slice(0, 4)] : [];

  return (
    <>
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/20 blur-[120px] animate-[float_15s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-secondary/10 blur-[150px] animate-[float-reverse_20s_ease-in-out_infinite]" />
        <div className="absolute top-[30%] left-[50%] w-[40vw] h-[40vw] rounded-full bg-primary-fixed-dim/20 blur-[100px] animate-[float_18s_ease-in-out_infinite_3s]" />
      </div>
      {/* TopNavBar — continuous scroll-linked morph (no snapping) */}
      <motion.nav
        className="fixed left-1/2 -translate-x-1/2 z-[100] overflow-visible flex items-center justify-between backdrop-blur-2xl border border-white/30"
        style={{
          top: navTop,
          width: navWidth,
          maxWidth: navMaxWidth,
          height: navHeight,
          borderRadius: navRadius,
          paddingLeft: navPad,
          paddingRight: navPad,
          backgroundColor: navBg,
          boxShadow: navShadow,
        }}
      >
        <a
          className="flex items-center gap-2 transition-transform hover:scale-105"
          href="#"
        >
          <img src={logo} alt="DermaSmart Logo" className={`w-auto object-contain transition-all duration-300 ${scrolled ? 'h-14' : 'h-20'}`} />
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
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
          {isLoadingAuth ? (
            <div className={`text-sm font-semibold ${scrolled ? 'text-on-surface' : 'text-gray-100'}`}>
              Đang tải...
            </div>
          ) : isLoggedIn ? (
            <div className="user-profile-dropdown relative">
              {/* Menu Trigger */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2 font-semibold text-sm bg-transparent border-none cursor-pointer select-none transition-colors duration-300 hover:opacity-80 ${
                  scrolled ? 'text-slate-800' : 'text-white'
                }`}
              >
                <span>Xin chào, {userFullName}</span>
                <ChevronDown 
                  size={16} 
                  className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} 
                />
              </button>

              {/* Liquid Glass Drop Menu Container */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-3 w-64 z-[9999] backdrop-filter backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl overflow-hidden ring-1 ring-black/5 p-2 transition-all duration-300 origin-top-right flex flex-col gap-2 font-sans"
                  >
                    {/* Header Block (Non-clickable) */}
                    <div className="flex flex-col text-left px-3 py-2 select-none">
                      <span className="text-slate-800 font-bold text-sm leading-tight">
                        {userFullName}
                      </span>
                      <span className="text-slate-500 font-bold text-[10px] tracking-wider uppercase mt-1">
                        {ROLE_DISPLAY[userRoleName] || ''}
                      </span>
                    </div>

                    {/* Glass Separator line */}
                    <div className="h-px bg-white/20 my-1 mx-2" />

                    {/* Menu Item: Hồ sơ cá nhân */}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/profile');
                      }}
                      className="hover:bg-white/20 hover:shadow-sm text-slate-800 border-none bg-transparent py-2.5 px-4 rounded-xl cursor-pointer flex items-center gap-3 text-sm font-semibold text-left transition-all duration-300 w-full hover:scale-[1.02] active:scale-95"
                    >
                      <User size={16} className="text-slate-700" />
                      Hồ sơ cá nhân
                    </button>

                    {/* Menu Item: Không gian làm việc — renders for all non-PATIENT staff */}
                    {user && user.role && user.role !== 'PATIENT' && (
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate(`/dashboard/${user.role.toLowerCase()}`);
                        }}
                        className="hover:bg-white/20 hover:shadow-sm text-slate-800 border-none bg-transparent py-2.5 px-4 rounded-xl cursor-pointer flex items-center gap-3 text-sm font-semibold text-left transition-all duration-300 w-full hover:scale-[1.02] active:scale-95"
                      >
                        <Key size={16} className="text-slate-700" />
                        Không gian làm việc
                      </button>
                    )}

                    {/* Menu Item: Đăng xuất */}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleSupabaseLogout();
                      }}
                      className="bg-red-500/10 hover:bg-red-500/25 text-red-700 border border-red-500/20 py-2.5 px-4 rounded-xl cursor-pointer flex items-center gap-3 text-sm font-bold text-left transition-all duration-300 w-full hover:scale-[1.02] active:scale-95"
                    >
                      <LogOut size={16} className="text-red-600" />
                      Đăng xuất
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
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
                onClick={() => navigate('/login', { state: { isRegistering: true } })}
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
          {isLoadingAuth ? (
            <div className="text-white/50 text-sm py-2">Đang tải...</div>
          ) : isLoggedIn ? (
            <div className="flex flex-col gap-3">
              {/* Mobile User Badge */}
              <div className="flex flex-col items-center justify-center pb-3 border-b border-white/10 text-center">
                <span className="text-white font-semibold text-base">{userFullName}</span>
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider mt-1">{ROLE_DISPLAY[userRoleName] || ''}</span>
              </div>

              <button
                onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                className="w-full bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/20 py-3 px-4 rounded-xl transition-all font-semibold text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                Hồ sơ cá nhân
              </button>

              {user && user.role && user.role !== 'PATIENT' && (
                <button
                  onClick={() => { navigate(`/dashboard/${user.role.toLowerCase()}`); setMobileMenuOpen(false); }}
                  className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 py-3 px-4 rounded-xl transition-all font-semibold text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  Không gian làm việc
                </button>
              )}
              <button
                onClick={() => { handleSupabaseLogout(); setMobileMenuOpen(false); }}
                className="w-full bg-transparent border-none text-red-300 py-3 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-sm font-semibold hover:bg-white/5"
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                className="text-white/90 hover:bg-white/10 px-5 py-2 rounded-xl transition-all font-semibold text-sm bg-transparent border-none cursor-pointer text-center"
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
              >
                Đăng nhập
              </button>
              <button
                className="bg-teal-500/80 text-white px-6 py-2 rounded-xl border border-teal-400/50 shadow-[0_0_20px_rgba(13,148,136,0.4)] font-semibold text-sm cursor-pointer text-center"
                onClick={() => { navigate('/login', { state: { isRegistering: true } }); setMobileMenuOpen(false); }}
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      )}
      {/* Landing content stage — moved as one unit when the AI is summoned */}
      <div id="lp-stage">
      {/* Hero Section */}
      <section className="w-full min-h-screen relative flex items-center justify-center overflow-hidden py-24 md:py-32">
        <motion.div 
          className="absolute inset-[-5%] z-[-2] bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuC7OT0v_iIuLuAj_638_No62Zj23gC1KQA7roRACzLjiLa5jYLAeKega8Dwb-SCFvAu5Wi76p09MdxZi4j754BX_lNLTfkZCLy5KVnCsbssI9kcKe7I1gyOu_UFP7ghIVcH8gTGb_kWawh0YavzsSvrhfktOTAUAg2pxD1M8u98KkgOAtzwFbpk4n96RScPsHIQbMA-3RuJ5zI46ePjON42HR0UcsNyVNnvLQ-x3ohlqvWYp2bCJhaXVe8-aGw1R2b7KpQ6Qj13ZEX8')] bg-cover bg-center bg-no-repeat"
          animate={{ y: [0, -25, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        />
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
          className="relative z-10 w-[85vw] md:w-[80vw] max-w-6xl mx-auto bg-white/40 backdrop-blur-md border border-white/60 shadow-2xl rounded-[2.5rem] p-8 md:p-16 flex flex-col items-center text-center"
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

        {/* Doctors Showcase Section - Carousel */}
        <section className="w-full flex flex-col gap-12 mb-12 overflow-hidden relative">
          <div className="text-center w-full max-w-2xl mx-auto flex flex-col gap-4">
            <h2 className="font-bold text-[32px] leading-[1.3] tracking-[-0.01em] text-on-surface">Đội ngũ chuyên gia hàng đầu</h2>
            <p className="text-on-surface-variant">Hãy thả tim để lưu lại nhé!</p>
          </div>
          
          <div className="w-full max-w-[1008px] mx-auto overflow-hidden relative py-4">
            <div 
              className="flex gap-6 w-max"
              style={{
                transform: isCarouselAnimating ? 'translateX(calc(-320px - 24px))' : 'translateX(0)',
                transition: isCarouselAnimating ? 'transform 0.6s ease-in-out' : 'none'
              }}
            >
              {extendedCarouselItems.map((doc, index) => (
                <div
                  key={`${doc.id}-${index}`}
                  className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col overflow-hidden w-[320px] shrink-0"
                >
                  {/* Top Image Box */}
                  <div className="relative w-full h-[320px] bg-slate-100">
                    <img
                      src={doc.image}
                      alt={doc.name}
                      className="w-full h-full object-cover object-top"
                    />
                    {/* Badge */}
                    <div className="absolute top-4 left-4 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm border border-emerald-100">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      UY TÍN 100%
                    </div>
                    {/* Heart Button */}
                    <button className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 shadow-sm border-none cursor-pointer transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col gap-4">
                    {/* Header */}
                    <div>
                      <h3 className="text-[18px] font-extrabold text-slate-800 tracking-tight leading-tight mb-1">{doc.name}</h3>
                      <p className="text-[13px] text-slate-500 font-medium">{doc.title} • Chuyên khoa Da liễu</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 rounded p-3 flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kinh nghiệm</span>
                        <span className="text-[13px] font-bold text-slate-700">{doc.experience || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="bg-slate-50 rounded p-3 flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đánh giá</span>
                        <span className="text-[13px] font-bold text-slate-700">
                          {doc.rating ? `${doc.rating} ⭐ (${doc.reviewsCount || 0})` : 'Chưa có đánh giá'}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded p-3 flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phí khám</span>
                        <span className="text-[13px] font-bold text-sky-600">{doc.consultationFee || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="bg-slate-50 rounded p-3 flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loại hình</span>
                        <span className="text-[13px] font-bold text-slate-700">Khám trực tiếp</span>
                      </div>
                    </div>

                    {/* Footer Action */}
                    <div className="flex items-center justify-end mt-1">
                      <button 
                        onClick={() => setSelectedDoctor(doc)}
                        className="bg-transparent border-none text-sky-600 font-bold text-[13px] cursor-pointer hover:text-sky-700 transition-colors flex items-center gap-1"
                      >
                        Xem hồ sơ
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* View All Doctors Button */}
          <div className="w-full flex justify-center mt-2 relative z-10">
            <button 
              onClick={() => setIsAllDoctorsOpen(true)}
              className="bg-white/80 backdrop-blur-md border border-slate-200 text-slate-700 font-bold px-8 py-3.5 rounded-full hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-all shadow-sm flex items-center gap-2 cursor-pointer group"
            >
              Xem tất cả bác sĩ
              <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
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
            ]?.map?.(({ step, label, highlight }) => (
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
      {/* ── Promotions / Active Vouchers Section ── */}
      {displayVouchers.length > 0 && (
        <section id="pricing" className="w-full max-w-[1280px] mx-auto px-4 md:px-10 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: 'spring' }}
            viewport={{ once: false, amount: 0.15 }}
          >
            {/* Section header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-amber-100/60 backdrop-blur-md rounded-full px-4 py-1.5 border border-amber-200 text-amber-800 text-sm font-semibold mb-4">
                <Ticket className="w-4 h-4" />
                Ưu đãi đang áp dụng
              </div>
              <h2 className="font-bold text-[32px] leading-[1.3] tracking-[-0.01em] text-on-surface">
                Khuyến Mãi Hôm Nay
              </h2>
              <p className="text-on-surface-variant mt-2 max-w-xl mx-auto">
                Các ưu đãi bên dưới được tự động áp dụng khi bạn đặt lịch — không cần nhập mã.
              </p>
            </div>

            {/* Voucher grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayVouchers?.map?.((v, i) => {
                const pct = Math.round((v.usageCount / v.maxUsage) * 100);
                const isEvent = !!v.eventTag;
                return (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, type: 'spring' }}
                    viewport={{ once: false, amount: 0.2 }}
                    className="glass-panel liquid-glass rounded-2xl overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
                  >
                    {/* Gradient top bar */}
                    <div className={`h-1.5 ${isEvent ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400' : 'bg-gradient-to-r from-emerald-400 to-sky-400'}`} />

                    <div className="p-5">
                      {/* Event badge */}
                      {v.eventTag && (
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100/80 text-amber-800 border border-amber-200/60 mb-3">
                          <span>{v.eventEmoji || '🎉'}</span> {v.eventTag}
                        </div>
                      )}

                      {/* Discount badge + name */}
                      <div className="flex items-start justify-between gap-3 mb-3">                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-on-surface leading-snug">{v.name}</p>
                          {v.description && (
                            <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">{v.description}</p>
                          )}
                        </div>
                        <span className={`shrink-0 text-xl font-black px-3 py-1.5 rounded-xl ${
                          isEvent
                            ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                            : 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                        }`}>
                          {v.discountType === 'Percentage' ? `-${v.discountValue}%` : `-${Number(v.discountValue).toLocaleString('vi-VN')}đ`}
                        </span>
                      </div>

                      {/* Info pills */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="flex items-center gap-1 text-[10px] font-semibold bg-surface-container/60 text-on-surface-variant rounded-full px-2.5 py-1 border border-white/40">
                          <Calendar className="w-3 h-3" />
                          HSD: {v.validTo}
                        </span>
                        {v.minOrderAmount > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold bg-surface-container/60 text-on-surface-variant rounded-full px-2.5 py-1 border border-white/40">
                            <Tag className="w-3 h-3" />
                            Từ {Number(v.minOrderAmount).toLocaleString('vi-VN')}đ
                          </span>
                        )}
                        {v.applicableServices.length === 0 && (
                          <span className="text-[10px] font-semibold bg-emerald-100/60 text-emerald-700 rounded-full px-2.5 py-1 border border-emerald-200/60">
                            Tất cả dịch vụ
                          </span>
                        )}
                      </div>

                      {/* Usage bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-[10px] text-on-surface-variant font-medium mb-1">
                          <span>Còn lại: {v.maxUsage - v.usageCount} lượt</span>
                          <span className={pct > 80 ? 'text-rose-500 font-bold' : ''}>{pct}% đã dùng</span>
                        </div>
                        <div className="h-1.5 bg-surface-container/40 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-rose-400' : isEvent ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-gradient-to-r from-emerald-400 to-sky-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* CTA */}
                      <button
                        onClick={() => setIsBookingOpen(true)}
                        className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border-none cursor-pointer transition-all group-hover:gap-3 ${
                          isEvent
                            ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md shadow-amber-400/25 hover:shadow-lg'
                            : 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg'
                        }`}
                      >
                        Đặt lịch ngay <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom note */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-center text-xs text-on-surface-variant mt-6 flex items-center justify-center gap-1.5"
            >
              <Ticket className="w-3.5 h-3.5 text-emerald-500" />
              Ưu đãi tự động áp dụng khi đặt lịch — bạn không cần nhập bất kỳ mã nào.
            </motion.p>
          </motion.div>
        </section>
      )}
      {/* Frosted Glass Showcase */}
      <section
        className="w-full min-h-[600px] relative flex items-center justify-center px-4 mt-12 overflow-hidden"
      >
        <motion.div 
          className="absolute inset-[-5%] z-[-2] bg-center bg-cover"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuATpqIKoVRl7pbivP-KIqn3TPymxL55zcg2m9ulYRdNEVVWWHKWDgGrOirVUvNF6-bbY-Snh17jZaI1zxpJJFHn7kZ_zcWda-zVuOv8TtMrB3wb2RZZ19uNbhN7NwcpDFyNuoA91FjUSsSUd2c2wPjZcaPZxLaSY7Dn8MlIS4BHuiNdLzj1yCLDPaTpr24iUQkcehOjH72t20QJw1YaLpD8kgkbK8eSjyyCZOLZgHB7WY-LxS_NJ6c-OO0XHpyyAhDIhFheTmEhIRMq')" }}
          animate={{ y: [0, -25, 0] }}
          transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }}
        />
        <div className="absolute inset-0 bg-teal-900/20 backdrop-blur-2xl z-[-1]" />
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
          <img src={logo} alt="DermaSmart Logo" className="h-16 w-auto object-contain" />
          <p className="text-on-surface-variant">© 2024 DermaSmart. Nền tảng y tế số thông minh.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <a className="text-on-surface-variant hover:text-secondary transition-colors duration-300 no-underline" href="#">Chính sách bảo mật</a>
          <a className="text-on-surface-variant hover:text-secondary transition-colors duration-300 no-underline" href="#">Điều khoản dịch vụ</a>
          <a className="text-on-surface-variant hover:text-secondary transition-colors duration-300 no-underline" href="#">Hỗ trợ kỹ thuật</a>
        </div>
      </motion.footer>
      </div>
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
              className="w-[70vw] h-[90vh] min-h-[500px] bg-white/60 backdrop-blur-3xl border border-white/80 shadow-2xl rounded-[2.5rem] relative overflow-hidden flex flex-col p-12"
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

                  {/* Doctor Reviews */}
                  <DoctorReviewsList doctorId={selectedDoctor.id} />

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
      <BookAppointmentForm
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedDoctorId={bookingDocId}
      />
      <AnimatePresence>
        {isAllDoctorsOpen && (
          <AllDoctorsModal 
            isOpen={isAllDoctorsOpen} 
            onClose={() => setIsAllDoctorsOpen(false)} 
            doctors={doctorsList.length > 0 ? doctorsList : LOCAL_MOCK_DOCTORS} 
            onSelectDoctor={(doc) => setSelectedDoctor(doc)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default LandingPage;
