import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roles = [
  {
    role: 'ADMIN',
    label: 'Admin',
    labelVi: 'Quản trị viên',
    icon: 'admin_panel_settings',
    desc: 'Quản lý toàn bộ hệ thống, nhân sự, dịch vụ & tài chính',
    gradient: 'from-primary to-primary-container',
  },
  {
    role: 'DOCTOR',
    label: 'Doctor',
    labelVi: 'Bác sĩ',
    icon: 'stethoscope',
    desc: 'Khám bệnh, chẩn đoán AI, kê đơn & theo dõi điều trị',
    gradient: 'from-secondary to-secondary-container',
  },
  {
    role: 'RECEPTIONIST',
    label: 'Receptionist',
    labelVi: 'Lễ tân',
    icon: 'support_agent',
    desc: 'Tiếp đón, check-in & quản lý lịch hẹn bệnh nhân',
    gradient: 'from-tertiary to-tertiary-container',
  },
  {
    role: 'TECHNICIAN',
    label: 'Technician',
    labelVi: 'Kỹ thuật viên',
    icon: 'biotech',
    desc: 'Thực hiện thủ thuật, cập nhật kết quả & hình ảnh lâm sàng',
    gradient: 'from-primary-container to-secondary',
  },
  {
    role: 'PATIENT',
    label: 'Patient',
    labelVi: 'Bệnh nhân',
    icon: 'person',
    desc: 'Xem lịch hẹn, tra cứu dịch vụ & đặt lịch khám',
    gradient: 'from-outline to-on-surface-variant',
  },
];

export default function MockLoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to their dashboard
  if (user) {
    return <Navigate to={user.role === 'PATIENT' ? '/' : `/dashboard/${user.role.toLowerCase()}`} replace />;
  }

  const handleLogin = (role) => {
    const path = login(role);
    navigate(path, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-secondary/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-primary-fixed-dim/10 rounded-full blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-label-sm text-label-sm mb-6 border border-primary/20">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
            DermaSmart Clinic
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-3">
            Chọn vai trò đăng nhập
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
            Chọn vai trò để trải nghiệm giao diện quản lý tương ứng trong hệ thống DermaSmart.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(({ role, label, labelVi, icon, desc, gradient }) => (
            <button
              key={role}
              onClick={() => handleLogin(role)}
              className="group relative bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-6 text-left hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] cursor-pointer"
            >
              {/* Glow */}
              <div className={`absolute -right-6 -top-6 w-20 h-20 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-xl group-hover:opacity-25 transition-opacity duration-300`} />

              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              </div>

              {/* Text */}
              <h3 className="font-label-sm text-label-sm text-on-surface mb-1">{labelVi}</h3>
              <p className="text-xs text-outline font-mono uppercase tracking-wider mb-2">{label}</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">{desc}</p>

              {/* Arrow */}
              <div className="mt-4 flex items-center gap-1 text-primary font-label-sm text-sm opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all duration-300">
                <span>Đăng nhập</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </button>
          ))}
        </div>

        {/* Back to home */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-on-surface-variant hover:text-primary font-label-sm text-label-sm transition-colors inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Quay lại trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
