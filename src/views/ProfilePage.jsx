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
import { ArrowLeft, User, Settings, BarChart3, Calendar, FileText, Star } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useProfileData } from '../components/profile/useProfileData';
import ProfileSummaryCard from '../components/profile/ProfileSummaryCard';
import ProfileTabs from '../components/profile/ProfileTabs';
import PersonalInfoTab from '../components/profile/tabs/PersonalInfoTab';
import AccountSettingsTab from '../components/profile/tabs/AccountSettingsTab';
import StaffInsightsTab from '../components/profile/tabs/StaffInsightsTab';
import MedicalRecordTab from '../components/profile/tabs/MedicalRecordTab';
import AppointmentsTab from '../components/PatientPortal/AppointmentsTab';
import PatientFeedbackTab from '../components/PatientPortal/PatientFeedbackTab';

const tabContentVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.99 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 28, stiffness: 200 } },
  exit: { opacity: 0, y: -12, scale: 0.99, transition: { duration: 0.15 } },
};

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Local avatar override so the "change photo" hover affordance is reflected
  // immediately without needing a real upload endpoint.
  const [avatarOverride, setAvatarOverride] = useState(null);

  const profile = useProfileData(user);
  const viewProfile = avatarOverride ? { ...profile, avatar: avatarOverride } : profile;

  const tabs = useMemo(() => {
    const common = [
      { id: 'personal', label: 'Thông tin cá nhân', icon: User },
      { id: 'settings', label: 'Cài đặt tài khoản', icon: Settings },
    ];
    if (profile.kind === 'staff') {
      return [...common, { id: 'insights', label: 'Hồ sơ chuyên sâu', icon: BarChart3 }];
    }
    return [
      ...common,
      { id: 'appointments', label: 'Lịch hẹn của tôi', icon: Calendar },
      { id: 'records', label: 'Hồ sơ bệnh án', icon: FileText },
      { id: 'feedback', label: 'Đánh giá của tôi', icon: Star },
    ];
  }, [profile.kind]);

  const [activeTab, setActiveTab] = useState('personal');

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
          <ProfileSummaryCard profile={viewProfile} onAvatarChange={setAvatarOverride} />
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
                {activeTab === 'personal' && <PersonalInfoTab profile={viewProfile} />}
                {activeTab === 'settings' && <AccountSettingsTab />}
                {activeTab === 'insights' && <StaffInsightsTab profile={viewProfile} />}
                {activeTab === 'appointments' && <AppointmentsTab />}
                {activeTab === 'records' && <MedicalRecordTab profile={viewProfile} />}
                {activeTab === 'feedback' && <PatientFeedbackTab user={user} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
