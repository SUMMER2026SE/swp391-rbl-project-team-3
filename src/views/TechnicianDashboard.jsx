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
  Camera, 
  Sliders, 
  ClipboardList, 
  CheckCircle2, 
  FileText, 
  PlayCircle, 
  Clock, 
  User, 
  ChevronRight, 
  X 
} from 'lucide-react';

export default function TechnicianDashboard() {
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
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-teal-50 text-teal-700 shadow-sm border border-teal-100/50 transition-all">
              <LayoutDashboard className="w-5 h-5 text-teal-600" />
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
                placeholder="Tìm kiếm bệnh nhân, mã hồ sơ..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="font-semibold text-xs text-teal-700 py-1 px-3 bg-teal-50 border border-teal-200/30 rounded-full">
              Technician Portal
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
                <div className="w-full h-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        </motion.header>

        {/* Dashboard Content */}
        <main className="p-8 space-y-8 max-w-7xl w-full mx-auto flex flex-col lg:flex-row gap-8">
          {/* Section 1: Assigned Tasks (Left Column) */}
          <section className="lg:w-1/3 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-extrabold text-xl text-slate-900 tracking-tight">Nhiệm vụ được giao</h2>
              <span className="bg-teal-50 text-teal-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-teal-200/20">
                4 Chờ xử lý
              </span>
            </div>

            {/* Task List (Glass Cards) */}
            <div className="space-y-4">
              {/* Active Task Card */}
              <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-5 border-l-4 border-l-teal-500 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-all"></div>
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <div>
                    <span className="inline-block bg-sky-50 text-sky-700 font-bold text-[10px] px-2.5 py-0.5 rounded-full mb-2 border border-sky-200/20">
                      Laser CO2
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm">Nguyễn Văn A</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Phòng Điều Trị 1 • 10:30 AM</p>
                  </div>
                  <PlayCircle className="w-6 h-6 text-teal-600" />
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/40">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    T
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold">Chỉ định: Bs. Trần</p>
                </div>
              </div>

              {/* Pending Task Card 1 */}
              <div className="backdrop-blur-xl bg-white/30 border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[2rem] p-5 border-l-4 border-l-slate-300 hover:border-l-teal-400 hover:opacity-100 transition-all cursor-pointer opacity-80">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-block bg-amber-50 text-amber-700 font-bold text-[10px] px-2.5 py-0.5 rounded-full mb-2 border border-amber-200/20">
                      Chemical Peel
                    </span>
                    <h3 className="font-bold text-slate-700 text-sm">Trần Thị B</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Phòng Điều Trị 2 • 11:15 AM</p>
                  </div>
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
              </div>

              {/* Pending Task Card 2 */}
              <div className="backdrop-blur-xl bg-white/30 border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[2rem] p-5 border-l-4 border-l-slate-300 hover:border-l-teal-400 hover:opacity-100 transition-all cursor-pointer opacity-80">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-block bg-teal-50 text-teal-700 font-bold text-[10px] px-2.5 py-0.5 rounded-full mb-2 border border-teal-200/20">
                      Nặn mụn y khoa
                    </span>
                    <h3 className="font-bold text-slate-700 text-sm">Lê Văn C</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Phòng Điều Trị 1 • 13:00 PM</p>
                  </div>
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Procedure Result Form (Right Column) */}
          <section className="lg:w-2/3 flex flex-col">
            <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 lg:p-8 h-full relative overflow-hidden flex flex-col justify-between">
              
              {/* Form Header */}
              <div className="flex items-start justify-between border-b border-slate-200/40 pb-6 mb-6">
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-2">
                    <h2 className="font-extrabold text-xl text-slate-900 tracking-tight">Cập nhật kết quả: Nguyễn Văn A</h2>
                    <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-teal-200/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                      Đang thực hiện
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Thủ thuật: <strong className="text-slate-700">Laser CO2 Fractional</strong> • Vùng: Mặt
                  </p>
                </div>
                <button className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all p-2 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <div className="flex-1 space-y-6">
                {/* Clinical Images Grid */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-1.5 uppercase tracking-wider">
                    <Camera className="w-4 h-4 text-teal-600" />
                    Hình ảnh lâm sàng
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Before Image Upload */}
                    <div className="bg-white/50 border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-white/80 hover:border-teal-400 transition-all cursor-pointer group">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-teal-600 border border-teal-100/50">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-xs text-slate-800">Tải ảnh Trước (Before)</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">
                        Hỗ trợ JPG, PNG (Max 5MB)
                      </p>
                    </div>

                    {/* After Image Upload */}
                    <div className="bg-white/50 border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-white/80 hover:border-teal-400 transition-all cursor-pointer group">
                      <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-sky-600 border border-sky-100/50">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-xs text-slate-800">Tải ảnh Sau (After)</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">
                        Chụp ngay hoặc tải lên
                      </p>
                    </div>
                  </div>
                </div>

                {/* Procedure Metrics */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sliders className="w-4 h-4 text-teal-600" />
                    Thông số kỹ thuật
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Energy Level */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 block">
                        Mức năng lượng (mJ)
                      </label>
                      <div className="relative">
                        <input
                          className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-all form-input-focus"
                          placeholder="Nhập mức..."
                          type="number"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                          mJ
                        </span>
                      </div>
                    </div>

                    {/* Pass Count */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 block">
                        Số pass thực hiện
                      </label>
                      <select defaultValue="2" className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-all cursor-pointer form-input-focus">
                        <option value="1">1 Pass</option>
                        <option value="2">2 Passes</option>
                        <option value="3">3 Passes</option>
                        <option value="4">4 Passes</option>
                      </select>
                    </div>

                    {/* Patient Tolerance */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-slate-600 block">
                        Mức độ chịu đựng của bệnh nhân (VAS)
                      </label>
                      <input
                        className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-teal-600"
                        max="10"
                        min="0"
                        type="range"
                        defaultValue="3"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1 uppercase">
                        <span>0 (Không đau)</span>
                        <span>5 (Đau vừa)</span>
                        <span>10 (Đau dữ dội)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                    <ClipboardList className="w-4 h-4 text-teal-600" />
                    Ghi chú lâm sàng
                  </h3>
                  <textarea
                    className="w-full bg-white/70 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none transition-all resize-none placeholder-slate-400 form-input-focus"
                    placeholder="Nhập ghi chú về tình trạng da sau thủ thuật, phản ứng bất thường..."
                    rows="3"
                  ></textarea>
                </div>
              </div>

              {/* Form Actions */}
              <div className="mt-8 pt-6 border-t border-slate-200/40 flex justify-end gap-3">
                <button className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-100 transition-all">
                  Lưu nháp
                </button>
                <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 text-white font-semibold shadow-md shadow-teal-600/10 hover:shadow-lg hover:shadow-teal-600/20 active:scale-95 transition-all flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  Hoàn thành &amp; Gửi kết quả
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
