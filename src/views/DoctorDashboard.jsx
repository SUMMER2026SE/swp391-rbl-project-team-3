import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationModel } from '../models/NotificationModel';
import { DoctorModel } from '../models/DoctorModel';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionTemplate,
} from 'framer-motion';
import {
  LayoutDashboard, 
  Users, 
  Calendar, 
  LogOut, 
  Search, 
  Bell, 
  Settings, 
  User,
  Star,
} from 'lucide-react';

// Import Tab Components
import DashboardOverview from '../components/Doctor/DashboardOverview';
import ScheduleWaitingList from '../components/Doctor/ScheduleWaitingList';
import WorkSchedule from '../components/Doctor/WorkSchedule';
import VirtualClinicWorkspace from '../components/Doctor/VirtualClinic/VirtualClinicWorkspace';
import DoctorFeedbackView from '../components/Doctor/DoctorFeedbackView';

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State-based routing
  const [activeTab, setActiveTab] = useState('overview');
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [notifications, setNotifications] = useState(() => NotificationModel.getAll());
  const [showNotifications, setShowNotifications] = useState(false);

  const doctorId = DoctorModel.getDoctorById(user?.id) ? user.id : 'doc-01';

  useEffect(() => {
    const handleUpdate = () => {
      setNotifications(NotificationModel.getAll());
    };

    window.addEventListener('notifications-updated', handleUpdate);
    return () => window.removeEventListener('notifications-updated', handleUpdate);
  }, []);

  const myNotifications = notifications.filter(
    (n) => n.recipientRole === 'DOCTOR' && (n.recipientId === doctorId || n.recipientId === 'all')
  );
  const unreadCount = myNotifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    NotificationModel.markAllAsRead('DOCTOR', doctorId);
  };

  /* --------------------------------------------------------------
     Continuous scroll-linked navbar morph (Part 2).
     We track the scroll position of the inner content container and
     interpolate every geometric property smoothly. Each value is wrapped
     in a spring so the bar "breathes" into its pill shape instead of
     snapping between two discrete states.
     -------------------------------------------------------------- */
  const scrollRef = useRef(null);
  const { scrollY } = useScroll({ container: scrollRef });

  const spring = { stiffness: 220, damping: 32, mass: 0.9 };
  // raw interpolations across the first 120px of scroll
  const widthRaw = useTransform(scrollY, [0, 120], [100, 90]);
  const maxWRaw = useTransform(scrollY, [0, 120], [1600, 1140]);
  const radiusRaw = useTransform(scrollY, [0, 120], [0, 32]);
  const topRaw = useTransform(scrollY, [0, 120], [0, 16]);
  const padXRaw = useTransform(scrollY, [0, 120], [32, 30]);
  const bgRaw = useTransform(scrollY, [0, 120], [0, 0.72]);
  const shadowRaw = useTransform(scrollY, [0, 120], [0, 0.12]);
  const ringRaw = useTransform(scrollY, [0, 120], [0, 0.7]);

  // springy motion values
  const widthMV = useSpring(widthRaw, spring);
  const maxWMV = useSpring(maxWRaw, spring);
  const radiusMV = useSpring(radiusRaw, spring);
  const topMV = useSpring(topRaw, spring);
  const padXMV = useSpring(padXRaw, spring);
  const bgMV = useSpring(bgRaw, spring);
  const shadowMV = useSpring(shadowRaw, spring);
  const ringMV = useSpring(ringRaw, spring);

  // composed CSS strings
  const navWidth = useMotionTemplate`${widthMV}%`;
  const navMaxWidth = useMotionTemplate`${maxWMV}px`;
  const navRadius = useMotionTemplate`${radiusMV}px`;
  const navTop = useMotionTemplate`${topMV}px`;
  const navPadX = useMotionTemplate`${padXMV}px`;
  const navBg = useMotionTemplate`rgba(255, 255, 255, ${bgMV})`;
  const navShadow = useMotionTemplate`0 14px 40px rgba(2, 32, 29, ${shadowMV}), inset 0 1px 2px rgba(255,255,255,0.9), inset 0 0 0 1px rgba(255,255,255,${ringMV})`;

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'waiting_list', label: 'Hàng chờ & Lịch khám', icon: Users },
    { id: 'schedule', label: 'Lịch làm việc', icon: Calendar },
    { id: 'feedback', label: 'Đánh giá bệnh nhân', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden flex w-full font-sans antialiased text-slate-800">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(20px) translateX(-10px); }
        }
        .bg-mesh-blob-1 {
          animation: float 15s ease-in-out infinite;
        }
        .bg-mesh-blob-2 {
          animation: float-reverse 20s ease-in-out infinite;
        }
      `}</style>

      {/* Pristine Medical Mesh Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-300/15 blur-[120px] bg-mesh-blob-1"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-sky-300/15 blur-[120px] bg-mesh-blob-2"></div>
      </div>

      {/* Unified Glass Sidebar */}
      <aside className="hidden md:flex backdrop-blur-2xl bg-white/60 border-r border-white/60 w-64 fixed h-full z-40 flex-col py-8 px-4 justify-between shadow-[4px_0_24px_rgba(0,0,0,0.03),inset_-1px_0_2px_rgba(255,255,255,0.7)]">
        <div>
          {/* Logo Brand */}
          <div className="px-4 mb-8 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-teal-500/25">
              DS
            </div>
            <div>
              <h1 className="font-black text-xl text-gradient-emerald tracking-tight leading-none">DermaSmart</h1>
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Doctor Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all active:scale-[0.98] ${
                    isActive
                      ? 'font-extrabold bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                      : 'font-semibold text-slate-600 hover:text-teal-700 hover:bg-teal-50/60'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="text-[15px]">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 pt-4 space-y-1">
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50/40 transition-all"
          >
            <User className="w-5 h-5 text-slate-400" />
            <span className="text-sm">Hồ sơ cá nhân</span>
          </button>
          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50/40 transition-all"
          >
            <LogOut className="w-5 h-5 text-slate-400" />
            <span className="text-sm">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        ref={scrollRef}
        className="flex-1 md:ml-64 flex flex-col h-screen overflow-y-auto z-10"
      >
        {/* Continuous Morphing Pill Topbar (scroll-linked, no snapping) */}
        <motion.header
          style={{
            position: 'sticky',
            top: navTop,
            zIndex: 50,
            margin: '0 auto',
            left: 0,
            right: 0,
            width: navWidth,
            maxWidth: navMaxWidth,
            borderRadius: navRadius,
            paddingLeft: navPadX,
            paddingRight: navPadX,
            backgroundColor: navBg,
            boxShadow: navShadow,
          }}
          className="backdrop-blur-2xl flex justify-between items-center h-20"
        >
          <div className="flex items-center gap-4">
            <span className="font-black text-2xl text-gradient-emerald md:hidden tracking-tight">DermaSmart</span>
            <div className="hidden md:flex items-center glass-inner rounded-full pl-4 pr-5 py-2.5 focus-within:ring-2 focus-within:ring-teal-500/30 focus-within:border-teal-400 transition-all">
              <Search className="w-[18px] h-[18px] text-slate-400 mr-2.5" />
              <input
                className="bg-transparent border-none outline-none text-[15px] font-medium text-slate-700 placeholder-slate-400 w-72 p-0 focus:ring-0"
                placeholder="Tìm kiếm bệnh nhân, hồ sơ..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right hidden md:block">
              <p className="font-extrabold text-[15px] text-slate-900 leading-tight tracking-tight">{user?.name || 'BS. CKII. Trần Văn A'}</p>
              <span className="text-[11px] text-teal-600 font-bold uppercase tracking-wider">Doctor Portal</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-500">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="hover:bg-white/70 hover:text-teal-600 transition-all p-2.5 rounded-full relative active:scale-95 border-none cursor-pointer bg-transparent flex items-center justify-center"
                >
                  <Bell className="w-[22px] h-[22px]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white"></span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 z-50 max-h-[350px] overflow-y-auto"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                        <span className="text-sm font-extrabold text-slate-800">Thông báo của bạn</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] text-teal-600 hover:text-teal-700 font-bold border-none bg-transparent cursor-pointer"
                          >
                            Đọc tất cả
                          </button>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        {myNotifications.length === 0 ? (
                          <p className="text-xs text-slate-400 italic text-center py-4">Chưa có thông báo nào.</p>
                        ) : (
                          myNotifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                NotificationModel.markAsRead(notif.id);
                              }}
                              className={`p-2.5 rounded-xl transition-all border cursor-pointer text-left ${
                                notif.isRead
                                  ? 'bg-transparent border-slate-100 hover:bg-slate-50'
                                  : 'bg-teal-50/50 border-teal-100/50 hover:bg-teal-50'
                              }`}
                            >
                              <p className="text-xs font-bold text-slate-800">{notif.title}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{notif.content}</p>
                              <span className="text-[8px] text-slate-400 block mt-1.5">
                                {new Date(notif.timestamp).toLocaleString('vi-VN')}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button className="hover:bg-white/70 hover:text-teal-600 transition-all p-2.5 rounded-full active:scale-95">
                <Settings className="w-[22px] h-[22px]" />
              </button>
              <button className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-white shadow-md shadow-teal-500/10 active:scale-95 transition-transform">
                <div className="w-full h-full bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center text-white">
                  <User className="w-5 h-5" />
                </div>
              </button>
            </div>
          </div>
        </motion.header>

        {/* Dashboard Content Container */}
        <main className="p-8 max-w-7xl w-full mx-auto">
          {activeAppointment ? (
            <VirtualClinicWorkspace 
              appointment={activeAppointment} 
              onBack={() => setActiveAppointment(null)} 
            />
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && <DashboardOverview doctorId={doctorId} />}
              {activeTab === 'waiting_list' && <ScheduleWaitingList doctorId={doctorId} onStartExam={setActiveAppointment} />}
              {activeTab === 'schedule' && <WorkSchedule doctorId={doctorId} />}
              {activeTab === 'feedback' && <DoctorFeedbackView doctorId={doctorId} />}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
