import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  TrendingUp, 
  HelpCircle, 
  LogOut, 
  Search, 
  Bell, 
  Settings, 
  Plus, 
  Flower2, 
  Ticket,
  User 
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = React.useState(false);

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
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-teal-50 text-teal-700 shadow-sm border border-teal-100/50 transition-all">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <span className="text-sm">Analytics</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50/40 transition-all">
              <LayoutDashboard className="w-5 h-5 text-slate-400 group-hover:text-teal-500" />
              <span className="text-sm">Dashboard</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50/40 transition-all">
              <Users className="w-5 h-5 text-slate-400" />
              <span className="text-sm">Patients</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50/40 transition-all">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span className="text-sm">Appointments</span>
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
                placeholder="Tìm kiếm..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="font-semibold text-xs text-teal-700 py-1 px-3 bg-teal-50 border border-teal-200/30 rounded-full">
              Admin Portal
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
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9h6wP00cRtNvctU80rPIyuE1rrzH1W6eylERZO9ShgDrqZ0UUInq8oWlLJjYDCkv9cQOgfpvq8McZaTPtuYgkz6sA5rdLEaXqrWdkEWjpKddObb-wWDYovDJ2bq_UMvPu5-sQ_yz7qNCoSL9c8tppqmqI4TsLaPajpu1I1vDDTtNTTkjhlUYM6GzVUJLCQMBzn2pwXYz40Zum7ekgMTFCQ9jMdgrGD7w4f2Fs2ZsSTHXgsXkVN4f7gOyv8RxyyP7uZrQhrjUEiDn5"
                />
              </button>
            </div>
          </div>
        </motion.header>

        {/* Dashboard Content */}
        <main className="p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Page Header */}
          <div>
            <h2 className="font-extrabold text-2xl md:text-3xl text-slate-900 mb-1 tracking-tight">
              Tổng quan Hệ thống
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Quản lý toàn diện dữ liệu nhân sự, dịch vụ và tài chính phòng khám.
            </p>
          </div>

          {/* Quick Stats (Bento Grid Style) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Revenue Chart Widget */}
            <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 col-span-1 md:col-span-2 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-all duration-500"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Doanh thu tháng (VND)</p>
                  <h3 className="font-black text-3xl text-slate-900">845,000,000</h3>
                </div>
                <div className="flex items-center gap-1 text-teal-600 bg-teal-50 px-2 py-1 rounded-full text-xs font-bold border border-teal-200/20">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+12.5%</span>
                </div>
              </div>
              
              {/* Mock Smooth Curve Chart */}
              <div className="h-32 w-full relative z-10 flex items-end">
                <svg className="w-full h-full preserve-aspect-ratio-none" viewBox="0 0 100 30">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25"></stop>
                      <stop offset="100%" stopColor="#0d9488" stopOpacity="0"></stop>
                    </linearGradient>
                  </defs>
                  <path d="M0,30 L0,20 Q10,25 20,15 T40,10 T60,18 T80,5 T100,2 L100,30 Z" fill="url(#chartGradient)"></path>
                  <path
                    d="M0,20 Q10,25 20,15 T40,10 T60,18 T80,5 T100,2"
                    fill="none"
                    stroke="#0d9488"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                  ></path>
                  <circle className="animate-pulse" cx="80" cy="5" fill="#ffffff" r="1.5" stroke="#0d9488" strokeWidth="0.5"></circle>
                  <circle className="animate-pulse" cx="100" cy="2" fill="#ffffff" r="1.5" stroke="#0d9488" strokeWidth="0.5"></circle>
                </svg>
              </div>
            </div>

            {/* Stats Stack */}
            <div className="flex flex-col gap-6">
              {/* Total Appointments */}
              <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100 shadow-inner">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tổng lịch hẹn</p>
                    <h4 className="font-extrabold text-2xl text-slate-900">1,240</h4>
                  </div>
                </div>
                <div className="w-full bg-slate-200/50 rounded-full h-1.5">
                  <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              {/* Active Vouchers */}
              <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shadow-inner">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Voucher hoạt động</p>
                    <h4 className="font-extrabold text-2xl text-slate-900">45</h4>
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-medium">Đang chạy 3 chiến dịch mùa hè</p>
              </div>
            </div>
          </section>

          {/* Main Content Area Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Khu vực 1: Quản lý nhân sự */}
            <section className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 flex flex-col h-[500px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-extrabold text-xl text-slate-900">Nhân sự &amp; Vai trò</h3>
              </div>
              
              <div className="overflow-y-auto pr-2 flex-1 space-y-3 custom-scrollbar">
                {/* Employee Item */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50 border border-slate-100 hover:border-teal-200/50 hover:bg-white/80 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <img
                      alt="Dr. Minh Tâm"
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200/40"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJpuqBrFhmfDbytZ48F_mzFshQkFCFw2FOVOqsu7XV24V7ZpNq3J6WMHxBog2HW5m-g0NYJmpvd2092nC2TgRNv0k2LvCbRwNUtr52GN8uFy6UnRpAPF9lZjZrjD_-Mk3TCqFZrNmPHXJrLy9AnTlEDtCB1Jhufm5P1IFnrGYd7mL4PC7kKB5jyXunQHeQ2RYRcukmxNfsIwmd0_z9caLufh5KjhUygRcdthYKEIA_QRaIb_Siu3MjkNilIbiVug6xRPE7aMO8XRrb"
                    />
                    <div>
                      <p className="font-bold text-sm text-slate-900">BS. Nguyễn Minh Tâm</p>
                      <p className="text-xs text-slate-500 font-medium">Bác sĩ Da liễu</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200/20">Active</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50 border border-slate-100 hover:border-teal-200/50 hover:bg-white/80 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <img
                      alt="Dr. Phương Lan"
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200/40"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuEvRyc8Di0JXPLCjvQnRI7B0HbTwYsepUL0u53QqvW9vbw0xLlOPlxNMbRVI693CcT4uvgIqU7q5q42KiJehmFvKseC6xwNX0NJS042V7ehgP0eP82MzXDVqWBKax4I_ezD6clqmqW6mw3eyK2IRPJrbbFID_OOVCS3VbvSGeRB6Stxv2s3zeAN7q8LZdzadY9jfGcOUvlRwVHtJtm03jmT9vmxbeYn5qvTUiIo16Wl8F_c2ZYqbMy1T2t-u6iuQlRE-IdXUFUn-1q"
                    />
                    <div>
                      <p className="font-bold text-sm text-slate-900">BS. Trần Phương Lan</p>
                      <p className="text-xs text-slate-500 font-medium">Trưởng khoa Laser</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200/20">Active</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50 border border-slate-100 hover:border-teal-200/50 hover:bg-white/80 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm border border-slate-200/40">
                      HT
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">Lê Hoàng Tuấn</p>
                      <p className="text-xs text-slate-500 font-medium">Quản lý Kho thuốc</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold text-[11px] border border-slate-200/20">On Leave</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50 border border-slate-100 hover:border-teal-200/50 hover:bg-white/80 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <img
                      alt="Nurse Hoa"
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200/40"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPkmndjmHJ7kwWB5q3VrOPMAomed1I3xlrxriyqhUqQuttv4vipKPtviiNomqUXxwBaRjcjGrRHijltcRt-0RWW6-o9ITT4o1AdcknlnqyCwr801pwqzkf26RMsGsjNpEhI0qGKXkERaqa5urqCD68ETiF7I2HWoxg_49ocW2N7AxhyemWTzGpl595o1Sd2y4uNcUoViGBtuJHaSa1jovv4dcppooUJvaaoEIiZ-WUpsk0G46_22oS9ntDO7SgBS940R_Zjohwrr4m"
                    />
                    <div>
                      <p className="font-bold text-sm text-slate-900">Phạm Thị Hoa</p>
                      <p className="text-xs text-slate-500 font-medium">Lễ tân &amp; CSKH</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200/20">Active</span>
                </div>
              </div>

              <button className="mt-4 w-full py-3 rounded-xl border border-teal-200/60 text-teal-600 font-bold hover:bg-teal-50/50 transition-colors flex items-center justify-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Thêm nhân sự mới
              </button>
            </section>

            {/* Khu vực 2: Cài đặt dịch vụ & Marketing */}
            <section className="flex flex-col gap-6">
              {/* Dịch vụ & Giá */}
              <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Flower2 className="w-5 h-5 text-teal-600" />
                    <h3 className="font-extrabold text-base text-slate-900">Dịch vụ &amp; Bảng giá</h3>
                  </div>
                  <button className="text-teal-600 text-xs font-bold hover:underline">Xem tất cả</button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-end border-b border-slate-200/40 pb-3">
                    <div>
                      <p className="font-bold text-sm text-slate-800">Điều trị Mụn Chuyên sâu</p>
                      <p className="text-[11px] text-slate-400 font-medium">Laser CO2 Fractional + Ánh sáng</p>
                    </div>
                    <p className="font-bold text-sm text-teal-600">1,500,000 đ</p>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-200/40 pb-3">
                    <div>
                      <p className="font-bold text-sm text-slate-800">Trẻ hóa da Thermage FLX</p>
                      <p className="text-[11px] text-slate-400 font-medium">Toàn mặt &amp; cổ</p>
                    </div>
                    <p className="font-bold text-sm text-teal-600">35,000,000 đ</p>
                  </div>
                </div>
              </div>

              {/* Quản lý Voucher */}
              <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 flex-1">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-amber-600" />
                    <h3 className="font-extrabold text-base text-slate-900">Chiến dịch Voucher</h3>
                  </div>
                  <button className="bg-amber-50 text-amber-600 p-1.5 rounded-lg border border-amber-100 hover:bg-amber-100/50 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white/60 border border-slate-200/40 rounded-2xl p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-mono font-bold text-[11px] border border-amber-200/20">
                        SUMMER20
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">Giảm 20% Dịch vụ Laser</p>
                        <p className="text-[10px] text-slate-400 font-medium">Hết hạn: 30/08/2026</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Đã dùng</p>
                      <p className="font-extrabold text-sm text-slate-800">128/200</p>
                    </div>
                  </div>

                  <div className="bg-white/40 border border-slate-200/40 rounded-2xl p-3 flex items-center justify-between shadow-sm opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono font-bold text-[11px] border border-slate-200/20">
                        NEWBIE50
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">Giảm 50k Khám lần đầu</p>
                        <p className="text-[10px] text-slate-400 font-medium">Đã kết thúc</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
