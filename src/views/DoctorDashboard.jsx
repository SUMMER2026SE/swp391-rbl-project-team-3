import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
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
  Stethoscope, 
  CheckCircle2, 
  ChevronRight, 
  Activity, 
  FileText, 
  Brain, 
  Sliders, 
  User 
} from 'lucide-react';

export default function DoctorDashboard() {
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
        .form-input-focus:focus {
          background: #ffffff !important;
          border-color: #14b8a6 !important;
          box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.1) !important;
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
              <Activity className="w-5 h-5 text-teal-600" />
              <span className="text-sm">Hàng chờ khám</span>
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
                placeholder="Tìm kiếm bệnh nhân, hồ sơ..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <p className="font-bold text-sm text-slate-900 leading-none">{user?.name || 'Bác sĩ Trần Văn A'}</p>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Doctor Portal</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500">
              <button className="hover:bg-slate-100 hover:text-teal-600 transition-all p-2 rounded-full relative active:scale-95">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>
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

        {/* Dashboard Content */}
        <main className="p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Quick Stats Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight mb-1">
                Đang khám: Nguyễn Thị Lan
              </h1>
              <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Phòng khám số 3 • Đã chờ 15 phút
              </p>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-2xl px-6 py-3 flex items-center gap-4 flex-1 md:flex-none">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100/50 shadow-inner">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Bệnh nhân còn lại</p>
                  <p className="font-extrabold text-xl text-slate-800">12</p>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-2xl px-6 py-3 flex items-center gap-4 flex-1 md:flex-none">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50 shadow-inner">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Ca hoàn thành</p>
                  <p className="font-extrabold text-xl text-slate-800">08</p>
                </div>
              </div>
            </div>
          </div>

          {/* Split View Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Patient Profile & Analysis (Bento Grid Style) */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              {/* Patient Profile Card (Diluted Red/Rose tag for allergies) */}
              <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-bl-full -z-10 group-hover:bg-teal-500/10 transition-all duration-500"></div>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <img
                    alt="Ảnh hồ sơ bệnh nhân Nguyễn Thị Lan"
                    className="w-24 h-24 rounded-2xl border-2 border-white shadow-md object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQTTYhWuIogqCXc_9uJkEQG7hEpfWz_IumR4SbjVMFWWWhm1o31IqiCvW-kUfkLsgYAt-zFgZVh_wYkQnY0egxs1F3BW6w04KuTm0IB3ut-14kbMONYJE6kUPGYLLNgNyTx2Cd8JwnmioAcuw-bIPAJNN80NV8TxWqhJDuhNIxrq5n62qioHaVRD92GbKqTXMmeXlBBN07-JP4aFlh7UrYgHj339tYjes1IsjT4GX8f-wJ_1I8wTZhL77hElS_XbKv_S6eXV5T-Mrs"
                  />
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div>
                        <h2 className="font-extrabold text-xl text-slate-900">Nguyễn Thị Lan, 28 tuổi</h2>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                          Nữ • ID: PT-2023-891
                        </p>
                      </div>
                      {/* Sky Blue badge for normal medical status */}
                      <span className="bg-sky-50 text-sky-700 px-3 py-1 rounded-full font-bold text-xs border border-sky-200/20">
                        Viêm da cơ địa
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-200/40">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Lần khám trước</p>
                        <p className="font-bold text-sm text-slate-800">12/09/2026</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Dị ứng</p>
                        {/* Diluted Red/Rose alert text for critical safety */}
                        <p className="font-extrabold text-sm text-rose-600 bg-rose-50 border border-rose-200/30 px-2 py-0.5 rounded-lg inline-block">
                          Penicillin
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Huyết áp</p>
                        <p className="font-bold text-sm text-slate-800">120/80</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Skin Analysis Results */}
              <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 flex-1">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-teal-600" />
                    Phân tích da AI
                  </h3>
                  <button className="text-teal-600 text-xs font-bold hover:underline">Xem lịch sử</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-square flex items-center justify-center border border-slate-200/40">
                    <img
                      alt="Ảnh chụp cận cảnh da mặt với phân tích AI"
                      className="absolute inset-0 w-full h-full object-cover opacity-90"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjYqW6i9SSrSV4gryuCdmYiq1r6HBH9rGtdrh8aE_bRlbWxjFGN4d5EvXEGC6CskumD3go75H6Idt11t5HUb5xDX1f-ZcnvhssKr6fwnhU23L_ppFE0GVvsgTKuv3b7GTx9U0TUfQyZPDooFrzHBUMPreY5nAHLbRB2fedyLRYttaoQ4sLfxiNgNWnSitYCi_IPdVORRDGDKvP5wolSsSifgHh7kUdX7mbo-HiLhqYCxGGOAAoyHWtGtq_GZzn4-dKTUWEMqv_s10N"
                    />
                    {/* AI Overlay Markers */}
                    <div className="absolute top-[30%] left-[40%] w-4 h-4 rounded-full border-2 border-teal-500 bg-teal-500/20 animate-pulse"></div>
                    <div className="absolute top-[60%] left-[20%] w-4 h-4 rounded-full border-2 border-sky-500 bg-sky-500/20"></div>
                  </div>

                  <div className="flex flex-col justify-center gap-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700">Độ ẩm</span>
                        {/* Diluted Rose/Red tag for low moisture */}
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200/30 px-2 py-0.5 rounded-lg">Thấp (32%)</span>
                      </div>
                      <div className="w-full bg-slate-200/50 rounded-full h-2">
                        <div className="bg-rose-500 h-2 rounded-full" style={{ width: '32%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700">Sắc tố (Melanin)</span>
                        <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/30 px-2 py-0.5 rounded-lg">Bình thường (65%)</span>
                      </div>
                      <div className="w-full bg-slate-200/50 rounded-full h-2">
                        <div className="bg-teal-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700">Độ nhạy cảm</span>
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/30 px-2 py-0.5 rounded-lg">Cao (88%)</span>
                      </div>
                      <div className="w-full bg-slate-200/50 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                      </div>
                    </div>

                    <div className="mt-2 p-4 rounded-2xl bg-teal-50/50 border border-teal-200/30">
                      <p className="font-bold text-xs text-teal-800 mb-1 flex items-center gap-1">
                        <Brain className="w-3.5 h-3.5" />
                        Kết luận AI:
                      </p>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        Dấu hiệu viêm da cấp tính tại vùng má. Hàng rào bảo vệ da suy yếu nghiêm trọng. Cần ưu tiên phục hồi độ ẩm.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Treatment & Prescription Form */}
            <div className="lg:col-span-5">
              <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 h-full flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 mb-6 pb-4 border-b border-slate-200/40 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-600" />
                    Kế hoạch Điều trị
                  </h3>

                  <form className="space-y-5">
                    {/* Chẩn đoán */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Chẩn đoán xác định</label>
                      <input
                        className="w-full bg-white/70 border border-slate-200/80 rounded-xl py-2.5 px-4 text-sm outline-none transition-all form-input-focus"
                        type="text"
                        defaultValue="Viêm da cơ địa cấp tính (L20.9)"
                      />
                    </div>

                    {/* Chỉ định liệu trình */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Chỉ định Liệu trình tại phòng khám
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200/60 bg-white/50 cursor-pointer hover:bg-teal-50/30 transition-all text-xs font-semibold text-slate-700">
                          <input
                            defaultChecked
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500/30 border-slate-300"
                            type="checkbox"
                          />
                          <span>Chiếu đèn sinh học</span>
                        </label>
                        <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200/60 bg-white/50 cursor-pointer hover:bg-teal-50/30 transition-all text-xs font-semibold text-slate-700">
                          <input
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500/30 border-slate-300"
                            type="checkbox"
                          />
                          <span>Peel da hóa học</span>
                        </label>
                        <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200/60 bg-white/50 cursor-pointer hover:bg-teal-50/30 transition-all text-xs font-semibold text-slate-700">
                          <input
                            defaultChecked
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500/30 border-slate-300"
                            type="checkbox"
                          />
                          <span>Điện di tinh chất</span>
                        </label>
                        <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200/60 bg-white/50 cursor-pointer hover:bg-teal-50/30 transition-all text-xs font-semibold text-slate-700">
                          <input
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500/30 border-slate-300"
                            type="checkbox"
                          />
                          <span>Lấy nhân mụn</span>
                        </label>
                      </div>
                    </div>

                    {/* Kê đơn thuốc */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold text-slate-700">Đơn thuốc (Toa thuốc)</label>
                        <button
                          className="text-teal-600 text-xs font-bold flex items-center gap-1 hover:underline"
                          type="button"
                        >
                          <Plus className="w-3.5 h-3.5" /> Thêm thuốc
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {/* Thuốc 1 */}
                        <div className="p-3.5 rounded-xl border border-slate-200/60 bg-white/60 relative group shadow-sm">
                          <div className="font-bold text-xs text-teal-700 mb-1">Fucidin H 15g (Kem bôi)</div>
                          <div className="text-[11px] text-slate-500 font-medium flex gap-4">
                            <span>SL: 1 tuýp</span>
                            <span>Bôi lớp mỏng vùng da bệnh 2 lần/ngày</span>
                          </div>
                        </div>
                        {/* Thuốc 2 */}
                        <div className="p-3.5 rounded-xl border border-slate-200/60 bg-white/60 relative group shadow-sm">
                          <div className="font-bold text-xs text-teal-700 mb-1">Cetirizin 10mg (Viên nén)</div>
                          <div className="text-[11px] text-slate-500 font-medium flex gap-4">
                            <span>SL: 14 viên</span>
                            <span>Uống 1 viên vào buổi tối</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lời dặn */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Lời dặn của Bác sĩ</label>
                      <textarea
                        className="w-full bg-white/70 border border-slate-200/80 rounded-xl py-2.5 px-4 text-xs font-semibold outline-none transition-all resize-none placeholder-slate-400 form-input-focus"
                        placeholder="Nhập lời dặn dò, kiêng cữ cho bệnh nhân..."
                        rows="2"
                      ></textarea>
                    </div>

                    {/* Hẹn tái khám */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Hẹn tái khám</label>
                      <select className="w-full bg-white/70 border border-slate-200/80 rounded-xl py-2.5 px-4 text-xs font-semibold outline-none transition-all cursor-pointer form-input-focus">
                        <option>Sau 1 tuần (Ngày 24/10/2026)</option>
                        <option>Sau 2 tuần</option>
                        <option>Sau 1 tháng</option>
                        <option>Không hẹn lại</option>
                      </select>
                    </div>
                  </form>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200/40 flex gap-3">
                  <button className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-100 transition-all">
                    Lưu nháp
                  </button>
                  <button className="flex-[2] bg-gradient-to-r from-teal-600 to-sky-600 text-white py-3 px-4 rounded-xl font-semibold shadow-md shadow-teal-600/10 hover:shadow-lg hover:shadow-teal-600/20 active:scale-95 transition-all flex justify-center items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    Hoàn thành khám &amp; In toa
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
