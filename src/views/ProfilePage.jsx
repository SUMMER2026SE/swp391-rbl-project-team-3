/**
 * ProfilePage.jsx
 * ───────────────────────────────────────────────────────────────────────────
 * Liquid-Glass Profile view for every actor (Admin / Doctor / Technician /
 * Receptionist / Patient).
 *
 * Bento split layout:
 *   • Left  — ProfileSummaryCard (avatar + identity + quick metrics)
 *   • Right — animated tabs (ProfileTabs) over a dynamic content area
 *
 * Tab set is assembled by role: staff get a "Hồ sơ chuyên sâu" insights tab;
 * patients additionally get appointments, the medical record, and feedback.
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, User, Settings, BarChart3, Calendar, FileText, Star, Loader2, ShieldCheck, Activity, CalendarDays } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useProfileData, normalizeProfileData } from '../components/profile/useProfileData';
import ProfileSummaryCard from '../components/profile/ProfileSummaryCard';
import ProfileTabs from '../components/profile/ProfileTabs';
import PersonalInfoTab from '../components/profile/tabs/PersonalInfoTab';
import AccountSettingsTab from '../components/profile/tabs/AccountSettingsTab';
import StaffInsightsTab from '../components/profile/tabs/StaffInsightsTab';
import MedicalRecordTab from '../components/profile/tabs/MedicalRecordTab';
import AppointmentsTab from '../components/PatientPortal/AppointmentsTab';
import PatientFeedbackTab from '../components/PatientPortal/PatientFeedbackTab';
import { ProfileModel } from '../models/ProfileModel';

const tabContentVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.99 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 28, stiffness: 200 } },
  exit: { opacity: 0, y: -12, scale: 0.99, transition: { duration: 0.15 } },
};

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');

  const { profile, isLoading, error, setProfile } = useProfileData(user);

  const tabs = useMemo(() => {
    if (!profile) return [];
    const common = [
      { id: 'personal', label: 'Thông tin cá nhân', icon: User },
      { id: 'settings', label: 'Cài đặt tài khoản', icon: Settings },
    ];
    if (profile.role === 'ADMIN') {
      return [
        ...common,
        { id: 'activity_log', label: 'Nhật ký hoạt động', icon: Activity },
        { id: 'permissions', label: 'Quyền hạn', icon: ShieldCheck },
      ];
    }
    if (profile.role === 'TECHNICIAN') {
      return [
        ...common,
        { id: 'work_schedule', label: 'Lịch làm việc / Ca trực', icon: CalendarDays },
      ];
    }
    if (profile.role === 'RECEPTIONIST') {
      return [...common];
    }
    if (profile.kind === 'staff') {
      return [...common, { id: 'insights', label: 'Hồ sơ chuyên sâu', icon: BarChart3 }];
    }
    return [
      ...common,
      { id: 'appointments', label: 'Lịch hẹn của tôi', icon: Calendar },
      { id: 'records', label: 'Hồ sơ bệnh án', icon: FileText },
      { id: 'feedback', label: 'Đánh giá của tôi', icon: Star },
    ];
  }, [profile?.kind, profile?.role]);

  const handleAvatarChange = async (file) => {
    if (!user?.id) return;
    try {
      const publicUrl = await ProfileModel.uploadAvatar(user.id, file);
      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          avatar: publicUrl,
        };
      });
    } catch (err) {
      console.error('Error uploading avatar:', err);
    }
  };

  const handleProfileSaved = (updatedRawProfile) => {
    const visitsCount = profile?.metrics?.visits || 0;
    const normalized = normalizeProfileData(updatedRawProfile, profile.role, visitsCount);
    setProfile(normalized);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen font-sans antialiased relative bg-[url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-fixed bg-center flex items-center justify-center">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-bold text-on-surface-variant/70">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen font-sans antialiased relative bg-[url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-fixed bg-center flex items-center justify-center">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl" />
        <div className="relative z-10 glass-3d rounded-2xl p-6 text-center max-w-md">
          <h2 className="text-xl font-bold text-rose-600 mb-2">Lỗi tải dữ liệu</h2>
          <p className="text-sm text-on-surface-variant/80 mb-4">{error?.message || 'Không thể lấy thông tin hồ sơ của bạn.'}</p>
          <button onClick={() => window.location.reload()} className="btn-primary px-4 py-2 rounded-xl text-sm font-bold">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans antialiased relative bg-[url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-fixed bg-center">
      {/* Premium glowing canvas: soften the photo into a frosted mesh */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-8%] w-[45vw] h-[45vw] rounded-full bg-emerald-300/20 blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-8%] w-[55vw] h-[55vw] rounded-full bg-sky-300/20 blur-[150px]" />
        <div className="absolute top-[30%] left-[45%] w-[35vw] h-[35vw] rounded-full bg-teal-200/20 blur-[120px]" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-5 sm:px-8 pt-6 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl glass-3d-soft text-on-surface-variant hover:text-primary transition-all
                     active:scale-95 cursor-pointer border-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-on-surface tracking-tight">Hồ sơ cá nhân</h1>
          <p className="text-xs text-on-surface-variant/70">Quản lý thông tin & hồ sơ của bạn</p>
        </div>
      </div>

      {/* Bento grid */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 110 }}
        className="relative z-10 max-w-[1400px] mx-auto px-5 sm:px-8 py-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start"
      >
        {/* Left — sticky identity card */}
        <div className="md:col-span-4 md:sticky md:top-6">
          <ProfileSummaryCard profile={profile} onAvatarChange={handleAvatarChange} />
        </div>

        {/* Right — tabs + dynamic content */}
        <div className="md:col-span-8 space-y-5">
          <ProfileTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="glass-3d rounded-[2rem] p-6 sm:p-8 min-h-[460px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {activeTab === 'personal' && <PersonalInfoTab profile={profile} onSaved={handleProfileSaved} />}
                {activeTab === 'settings' && <AccountSettingsTab />}
                {activeTab === 'insights' && <StaffInsightsTab profile={profile} />}
                {activeTab === 'appointments' && <AppointmentsTab />}
                {activeTab === 'records' && <MedicalRecordTab profile={profile} />}
                {activeTab === 'feedback' && <PatientFeedbackTab user={user} />}
                {activeTab === 'activity_log' && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white/40 backdrop-blur-sm">
                    <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Nhật ký hoạt động hệ thống đang được cập nhật.</p>
                  </div>
                )}
                {activeTab === 'permissions' && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white/40 backdrop-blur-sm">
                    <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Bảng điều khiển phân quyền sẽ xuất hiện tại đây.</p>
                  </div>
                )}
                {activeTab === 'work_schedule' && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white/40 backdrop-blur-sm">
                    <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Lịch làm việc và ca trực đang được đồng bộ.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
