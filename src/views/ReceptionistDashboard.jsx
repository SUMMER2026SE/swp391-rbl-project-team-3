import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useAppointmentController } from '../controllers/useAppointmentController';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Inbox, 
  TrendingUp, 
  HelpCircle, 
  LogOut, 
  Search, 
  Bell, 
  Settings, 
  Plus, 
  Hourglass, 
  CheckSquare, 
  DollarSign, 
  ChevronRight, 
  UserPlus,
  User 
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", damping: 25, stiffness: 100 } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function ReceptionistDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { appointments, approveAppointment, checkinAppointment } = useAppointmentController();

  const waitingPatients = appointments.filter(a => a.status === 'Paid');
  const todayAppointments = appointments.filter(a => a.status !== 'Cancelled');
  const pendingAppointments = appointments.filter(a => a.status === 'Pending');
  const activeQueue = appointments.filter(a => a.status === 'Paid' || a.status === 'Completed');

  const handleScroll = (e) => {
    if (e.target.scrollTop > 10) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

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
      <aside className="hidden md:flex backdrop-blur-2xl bg-white/60 border-r border-white/50 w-64 fixed h-full z-40 flex-col py-8 px-4 justify-between">
        <div>
          {/* Logo Brand */}
          <div className="px-4 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white font-bold shadow-md shadow-teal-500/10">
              DS
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 tracking-tight leading-none">DermaSmart</h1>
              <span className="text-[11px] text-slate-500 font-medium">Clinic Management</span>
            </div>
          </div>

          {/* New Appointment Button */}
          <div className="px-2 mb-6">
            <button className="w-full bg-gradient-to-r from-teal-600 to-sky-600 text-white py-3 px-4 rounded-xl font-semibold shadow-md shadow-teal-600/10 hover:shadow-lg hover:shadow-teal-600/20 active:scale-95 transition-all flex justify-center items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              New Appointment
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50/40 transition-all">
              <LayoutDashboard className="w-5 h-5 text-slate-400" />
              <span className="text-sm">Dashboard</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-teal-50 text-teal-700 shadow-sm border border-teal-100/50 transition-all">
              <Users className="w-5 h-5 text-teal-600" />
              <span className="text-sm">Hàng chờ (Patients)</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50/40 transition-all">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span className="text-sm">Appointments</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50/40 transition-all">
              <Inbox className="w-5 h-5 text-slate-400" />
              <span className="text-sm">Inventory</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50/40 transition-all">
              <TrendingUp className="w-5 h-5 text-slate-400" />
              <span className="text-sm">Analytics</span>
            </a>
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
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50/40 transition-all">
            <HelpCircle className="w-5 h-5 text-slate-400" />
            <span className="text-sm">Support</span>
          </a>
          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50/40 transition-all"
          >
            <LogOut className="w-5 h-5 text-slate-400" />
            <span className="text-sm">Sign Out</span>
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
                placeholder="Tìm kiếm bệnh nhân..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="font-semibold text-xs text-teal-700 py-1 px-3 bg-teal-50 border border-teal-200/30 rounded-full">
              Receptionist Portal
            </span>
            <div className="flex items-center gap-3 text-slate-500">
              <button className="hover:bg-slate-100 hover:text-teal-600 transition-all p-2 rounded-full relative active:scale-95">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>
              <button className="hover:bg-slate-100 hover:text-teal-600 transition-all p-2 rounded-full active:scale-95">
                <Settings className="w-5 h-5" />
              </button>
              <button className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 active:scale-95 transition-transform">
                <img
                  alt="User Profile"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-M2BqQXPDoBCWJkM6Fd79cimImp2GcimZMOlz2hyxwTH4bQ8vpMqVC_RIXoL2gAQqWt-OWMeEUU7YiJjTYdrKJ6XsjhktqmEjjycsJnakxWx_WlOKVxXcDhdC1jsooRwJbR1GBzC3hvEXnYhVvwZVOThox8jAo1EtiX6UhXkt9_AzZQuaNOIK89GbYNWX7HblAuBxdx77DsQ0O6pidqIO0QfLOZipt9s6XBnKNn_qc7Ii5Gu8kjJ1_lut2j9_FojRaUOzDBewe09P"
                />
              </button>
            </div>
          </div>
        </motion.header>

        {/* Dashboard Content */}
        <motion.main 
          className="p-8 space-y-8 max-w-7xl w-full mx-auto"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Desktop welcome header */}
          <motion.div className="flex flex-col gap-1" variants={fadeInUp}>
            <h2 className="font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight">
              Chào buổi sáng, {user?.name || 'Lễ tân'}
            </h2>
            <p className="text-sm text-slate-500 font-medium">Hôm nay là Thứ Ba, 24 Tháng 10, 2026</p>
          </motion.div>

          {/* Quick Stats Bento Grid (Diluted status colors) */}
          <motion.section className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={fadeInUp}>
            {/* Stat 1: Waiting - Sky Blue */}
            <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-sky-500/5 rounded-full blur-xl group-hover:bg-sky-500/10 transition-all"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-sky-50 rounded-xl text-sky-600 border border-sky-100 shadow-inner">
                  <Hourglass className="w-6 h-6" />
                </div>
                <span className="bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full text-xs font-bold border border-sky-200/20">
                  +{waitingPatients.length} new
                </span>
              </div>
              <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Bệnh nhân đang chờ</h3>
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-4xl text-slate-900">{waitingPatients.length}</span>
                <span className="text-xs text-slate-400 font-medium">người</span>
              </div>
            </div>

            {/* Stat 2: Today's Appointments - Emerald Green */}
            <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100 shadow-inner">
                  <CheckSquare className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Lịch hẹn hôm nay</h3>
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-4xl text-slate-900">{todayAppointments.length}</span>
                <span className="text-xs text-slate-400 font-medium">ca khám</span>
              </div>
              <div className="mt-4 w-full bg-slate-200/50 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (appointments.filter(a => a.status === 'Completed').length / (todayAppointments.length || 1)) * 100)}%` }}></div>
              </div>
            </div>

            {/* Stat 3: Pending Payments - Diluted Rose/Red */}
            <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-rose-50 rounded-xl text-rose-600 border border-rose-100 shadow-inner">
                  <DollarSign className="w-6 h-6" />
                </div>
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
              </div>
              <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Thanh toán chờ xử lý</h3>
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-4xl text-slate-900">{pendingAppointments.length}</span>
                <span className="text-xs text-slate-400 font-medium">hồ sơ</span>
              </div>
            </div>
          </motion.section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Area 1: Waiting List */}
            <motion.div className="lg:col-span-2 space-y-4" variants={fadeInUp}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-extrabold text-xl text-slate-900">Danh sách hàng chờ</h3>
                <button className="text-teal-600 text-xs font-bold hover:underline flex items-center gap-0.5">
                  Xem tất cả <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden flex flex-col">
                {activeQueue.map((apt, idx) => (
                  <div key={apt.appointment_id} className={`p-5 border-b border-slate-200/40 hover:bg-white/60 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${apt.status === 'Completed' ? 'opacity-75' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border relative ${apt.status === 'Completed' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-sky-50 text-sky-700 border-sky-100'}`}>
                        {(apt.patient_name || 'B').charAt(0).toUpperCase()}
                        {apt.status === 'Paid' && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] rounded-full flex items-center justify-center border border-white font-extrabold">
                            {idx + 1}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{apt.patient_name}</h4>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <Hourglass className="w-3.5 h-3.5 text-slate-400" /> {apt.start_time} - {apt.service_name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                      {apt.status === 'Paid' ? (
                        <>
                          <button className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer bg-white">
                            Tìm hồ sơ
                          </button>
                          <button
                            onClick={() => checkinAppointment(apt.appointment_id)}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 transition-colors shadow-sm shadow-sky-600/10 cursor-pointer border-none"
                          >
                            Check-in
                          </button>
                        </>
                      ) : (
                        <span className="px-4 py-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100/50 rounded-xl font-bold flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4" /> Đã khám xong
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {activeQueue.length === 0 && (
                  <div className="text-center py-8 text-slate-400 font-semibold text-sm">
                    Không có bệnh nhân trong hàng chờ.
                  </div>
                )}
              </div>
            </motion.div>

            {/* Area 2: Booking Requests */}
            <motion.div className="space-y-4" variants={fadeInUp}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-extrabold text-xl text-slate-900">Yêu cầu đặt lịch</h3>
                <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200/20">
                  {pendingAppointments.length} MỚI
                </span>
              </div>

              <div className="space-y-3">
                {pendingAppointments.map((apt) => (
                  <div key={apt.appointment_id} className="backdrop-blur-xl bg-white/50 border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-sky-500 relative animate-pulse">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800 text-xs">{apt.patient_name}</h4>
                      <span className="text-[10px] text-slate-400 font-medium">Vừa xong</span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium space-y-1.5">
                      <p className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {apt.appointment_date} - {apt.start_time}
                      </p>
                      <p className="flex items-center gap-2">
                        <Plus className="w-3.5 h-3.5 text-slate-400" />
                        {apt.service_name}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => approveAppointment(apt.appointment_id, 'rec-01')}
                        className="flex-1 py-2 rounded-xl bg-teal-50 text-teal-700 text-[11px] font-bold hover:bg-teal-100/50 border border-teal-200/10 transition-colors cursor-pointer border-none"
                      >
                        Phê duyệt
                      </button>
                      <button
                        onClick={() => alert(`Liên hệ bệnh nhân: ${apt.patient_name}`)}
                        className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-bold hover:bg-slate-200/60 border border-slate-200/10 transition-colors cursor-pointer border-none"
                      >
                        Liên hệ
                      </button>
                    </div>
                  </div>
                ))}
                {pendingAppointments.length === 0 && (
                  <div className="text-center py-8 text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl bg-white/60">
                    Không có yêu cầu đặt lịch mới.
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate('/profile')}
                className="w-full mt-4 py-3 rounded-2xl border border-dashed border-slate-300 text-slate-400 hover:bg-white/40 hover:text-teal-600 hover:border-teal-300 transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-white"
              >
                <UserPlus className="w-4 h-4" /> Tự thêm lịch hẹn
              </button>
            </motion.div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
