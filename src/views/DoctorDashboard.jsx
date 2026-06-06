import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationModel } from '../models/NotificationModel';
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifications, setNotifications] = useState(() => NotificationModel.getAll());
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setNotifications(NotificationModel.getAll());
    };
    window.addEventListener('notifications-updated', handleUpdate);
    return () => window.removeEventListener('notifications-updated', handleUpdate);
  }, []);

  const doctorId = user?.id || 'doc-01'; // Fallback to mock doctor 1

  const myNotifications = notifications.filter(n => 
    n.recipientRole === 'DOCTOR' && (n.recipientId === doctorId || n.recipientId === 'all')
  );
  const unreadCount = myNotifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    NotificationModel.markAllAsRead('DOCTOR', doctorId);
  };

  // State-based routing
  const [activeTab, setActiveTab] = useState('overview');
  const [activeAppointment, setActiveAppointment] = useState(null);

  const handleScroll = (e) => {
    if (e.target.scrollTop > 10) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

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
      <aside className="hidden md:flex backdrop-blur-2xl bg-white/60 border-r border-white/50 w-64 fixed h-full z-40 flex-col py-8 px-4 justify-between shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div>
          {/* Logo Brand */}
          <div className="px-4 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white font-bold shadow-md shadow-teal-500/10">
              DS
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 tracking-tight leading-none">DermaSmart</h1>
              <span className="text-[11px] text-slate-500 font-medium">Doctor Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'font-bold bg-teal-50 text-teal-700 shadow-sm border border-teal-100/50' 
                      : 'font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50/40'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span className="text-sm">{item.label}</span>
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
      <div className="flex-1 md:ml-64 flex flex-col h-screen overflow-y-auto z-10" onScroll={handleScroll}>
        {/* Dynamic Morphing Pill Topbar */}
        <motion.header
          animate={{
            width: isScrolled ? "92%" : "100%",
            maxWidth: isScrolled ? "1100px" : "100%",
            top: isScrolled ? "16px" : "0px",
            borderRadius: isScrolled ? "9999px" : "0px",
            backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.75)" : "transparent",
            boxShadow: isScrolled ? "0 10px 30px rgba(0,0,0,0.06)" : "none",
            borderBottom: isScrolled ? "none" : "1px solid rgba(226, 232, 240, 0.8)",
            border: isScrolled ? "1px solid rgba(255, 255, 255, 0.8)" : "none",
          }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          style={{ position: 'sticky', zIndex: 50, margin: '0 auto', left: 0, right: 0 }}
          className="backdrop-blur-xl flex justify-between items-center w-full px-8 h-20"
        >
          <div className="flex items-center gap-4">
            <span className="font-extrabold text-xl text-teal-600 md:hidden tracking-tight">DermaSmart</span>
            <div className="hidden md:flex items-center bg-white/60 border border-slate-200/50 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all shadow-sm">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                className="bg-transparent border-none outline-none text-sm placeholder-slate-400 w-64 p-0 focus:ring-0"
                placeholder="Tìm kiếm bệnh nhân, hồ sơ..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <p className="font-bold text-sm text-slate-900 leading-none">{user?.name || 'BS. CKII. Trần Văn A'}</p>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Doctor Portal</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="hover:bg-slate-100 hover:text-teal-600 transition-all p-2 rounded-full relative active:scale-95 border-none cursor-pointer bg-transparent flex items-center justify-center"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
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
                              <span className="text-[8px] text-slate-400 block mt-1.5">{new Date(notif.timestamp).toLocaleString('vi-VN')}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button className="hover:bg-slate-100 hover:text-teal-600 transition-all p-2 rounded-full active:scale-95">
                <Settings className="w-5 h-5" />
              </button>
              <button className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 active:scale-95 transition-transform">
                <div className="w-full h-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xs">
                  <User className="w-4 h-4" />
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
