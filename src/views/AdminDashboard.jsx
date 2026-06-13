import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Ticket,
  FileText,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  User,
} from 'lucide-react';
import AdminOverview from '../components/Admin/AdminOverview';
import EmployeeManagement from '../components/Admin/EmployeeManagement';
import FeedbackDashboard from '../components/Admin/FeedbackDashboard';
import ServiceManagement from '../components/Admin/ServiceManagement';
import DoctorScheduleManagement from '../components/Admin/DoctorScheduleManagement';
import ConsultationTimeManagement from '../components/Admin/ConsultationTimeManagement';
import RevenueStatistics from '../components/Admin/RevenueStatistics';
import VoucherManagement from '../components/Admin/VoucherManagement';
import ReportsPage from '../components/Admin/ReportsPage';
import LiquidSidebarMenu from '../components/ui/LiquidSidebarMenu';

// Placeholder components for other tabs
const PlaceholderTab = ({ title }) => (
  <div className="flex items-center justify-center h-full">
    <h2 className="text-2xl font-bold text-slate-400">{title} Component (Coming Soon)</h2>
  </div>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'employees', label: 'Quản lý Nhân sự', icon: Users },
    { id: 'services', label: 'Quản lý Dịch vụ', icon: Stethoscope },
    { id: 'doctorSchedule', label: 'Lịch bác sĩ', icon: Calendar },
    { id: 'consultationTime', label: 'Khung giờ khám', icon: Clock },
    { id: 'vouchers', label: 'Quản lý Voucher', icon: Ticket },
    { id: 'feedback', label: 'Đánh giá', icon: Star },
    { id: 'reports', label: 'Doanh thu & Báo cáo', icon: TrendingUp },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview />;
      case 'employees':
        return <EmployeeManagement />;
      case 'services':
        return <ServiceManagement />;
      case 'doctorSchedule':
        return <DoctorScheduleManagement />;
      case 'consultationTime':
        return <ConsultationTimeManagement />;
      case 'vouchers':
        return <VoucherManagement />;
      case 'feedback':
        return <FeedbackDashboard />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-slate-100 to-sky-200 relative overflow-hidden flex font-sans text-slate-800">
      {/* Ambient background glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-500/40 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[35rem] h-[35rem] bg-sky-500/40 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[35%] left-[35%] w-[30rem] h-[30rem] bg-blue-600/50 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '4s' }}></div>

      {/* Sidebar */}
      <aside className="w-72 backdrop-blur-2xl bg-white/70 border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col justify-between z-20">
        <div>
          <div className="p-8">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-500 tracking-tight">
              Pristine
            </h1>
            <p className="text-xs text-indigo-500/80 font-bold tracking-widest mt-1 uppercase">Quản trị hệ thống</p>
          </div>
          <nav className="mt-6 px-6 space-y-3">
            <LiquidSidebarMenu
              items={navItems}
              activeId={activeTab}
              onChange={setActiveTab}
              isSidebarExpanded={true}
            />
          </nav>
        </div>

        <div className="p-6 border-t border-slate-200/40">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-4 bg-white/50 border border-slate-200/60 rounded-2xl text-red-500 font-bold text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm group"
          >
            <LogOut className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden z-10 relative">
        
        {/* Global Glassmorphism Topbar */}
        <header className="px-10 py-5 bg-white/60 backdrop-blur-2xl border-b border-white/80 shadow-[0_4px_30px_rgba(0,0,0,0.03)] flex justify-between items-center z-30 sticky top-0">
          
          {/* Topbar: Search */}
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm kiếm thông tin, bệnh nhân, nhân viên..."
              className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-full focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none text-sm font-medium transition-all shadow-inner"
            />
          </div>

          {/* Topbar: Right Actions */}
          <div className="flex items-center space-x-6">
            <button className="relative p-3 bg-white/50 border border-slate-200 hover:bg-white rounded-full transition-all shadow-sm group">
              <Bell className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-[1px] bg-slate-200"></div>

            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 group cursor-pointer hover:bg-white/50 p-2 rounded-2xl transition-all hover:scale-105 active:scale-95 ring-2 ring-transparent hover:ring-emerald-500/50"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-white font-bold shadow-md border-2 border-white group-hover:scale-105 transition-transform">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-sm font-bold text-slate-800">{user?.name || 'Admin'}</div>
                  <div className="text-xs font-semibold text-indigo-600">{user?.role || 'Super Admin'}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <>
                    {/* Click-away backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-2 z-50 origin-top-right"
                    >
                      <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tài khoản</p>
                        <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{user?.name || 'Admin'}</p>
                        <p className="text-[11px] text-indigo-600 font-medium truncate">{user?.email || 'admin@dermasmart.com'}</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/profile');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors border-none bg-transparent cursor-pointer text-left"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        Xem hồ sơ cá nhân
                      </button>

                      <button
                        onClick={async () => {
                          setShowProfileMenu(false);
                          await logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50/50 transition-colors border-none bg-transparent cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        Đăng xuất
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full max-w-7xl mx-auto"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
