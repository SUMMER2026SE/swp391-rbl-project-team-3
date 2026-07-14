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
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, User, Settings, BarChart3, Calendar, FileText, Star, Loader2, ShieldCheck, Activity, CalendarDays, Brain, X } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { useProfileData, normalizeProfileData } from '../components/profile/useProfileData';
import ProfileSummaryCard from '../components/profile/ProfileSummaryCard';
import ProfileTabs from '../components/profile/ProfileTabs';
import PersonalInfoTab from '../components/profile/tabs/PersonalInfoTab';
import AccountSettingsTab from '../components/profile/tabs/AccountSettingsTab';
import StaffInsightsTab from '../components/profile/tabs/StaffInsightsTab';
import MedicalLoader from '../components/common/MedicalLoader';
import MedicalRecordTab from '../components/profile/tabs/MedicalRecordTab';
import AppointmentsTab from '../components/PatientPortal/AppointmentsTab';
import PatientFeedbackTab from '../components/PatientPortal/PatientFeedbackTab';
import { ProfileModel } from '../models/ProfileModel';
import { GLASS_BASE } from '../components/common/GlassCard';

import doctorBg from '../assets/doctor.png';
import patientBg from '../assets/patient.png';
import techBg from '../assets/tech.png';
import adminBg from '../assets/admin.png';
import receptionBg from '../assets/reception.png';

const getProfileBackground = (role) => {
  if (!role) return patientBg;
  const normalizedRole = role.toLowerCase();
  if (normalizedRole.includes('doctor')) return doctorBg;
  if (normalizedRole.includes('tech')) return techBg;
  if (normalizedRole.includes('admin')) return adminBg;
  if (normalizedRole.includes('reception')) return receptionBg;
  return patientBg;
};

const tabContentVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.99 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 28, stiffness: 200 } },
  exit: { opacity: 0, y: -12, scale: 0.99, transition: { duration: 0.15 } },
};

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [feedbackAptId, setFeedbackAptId] = useState(null);

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
      { id: 'aiscans', label: 'Lịch sử soi da AI', icon: Brain },
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

  const profileBgImage = getProfileBackground(user?.role);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#9ea5b0]">
        <MedicalLoader />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen font-sans antialiased relative bg-[url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-fixed bg-center flex items-center justify-center">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl" />
        <div className={`relative z-10 ${GLASS_BASE} p-6 text-center max-w-md`}>
          <h2 className="text-xl font-bold text-rose-600 mb-2">Lỗi tải dữ liệu</h2>
          <p className="text-sm text-on-surface-variant/80 mb-4">{error?.message || 'Không thể lấy thông tin hồ sơ của bạn.'}</p>
          <button onClick={() => window.location.reload()} className="btn-primary px-4 py-2 rounded-xl text-sm font-bold">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // profileBgImage already defined above

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Layer 1 (Image — fixed so it never shifts on tab/scroll changes) */}
      <div 
        className="fixed inset-0 bg-cover bg-center z-0" 
        style={{ backgroundImage: profileBgImage ? `url("${profileBgImage}")` : 'none', backgroundColor: '#f8fafc' }} 
      />

      {/* Layer 2 (Dark legibility tint — dims the busy photo so the translucent
          glass cards refract against depth; dark (not white) keeps the background
          vibrant. NO backdrop-blur so empty areas stay crisp) */}
      <div className="fixed inset-0 bg-slate-900/40 z-10" />

      {/* Layer 3: Content Wrapper */}
      <div className="relative z-20 w-full max-w-7xl mx-auto p-4 md:p-8">
        {/* Top bar */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className={`p-2.5 rounded-xl ${GLASS_BASE} text-on-surface-variant hover:text-primary transition-all
                       active:scale-95 cursor-pointer border-none`}
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
          className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start"
        >
          {/* Left — sticky identity card */}
          <div className="md:col-span-4 md:sticky md:top-6">
            <ProfileSummaryCard profile={profile} onAvatarChange={handleAvatarChange} />
          </div>

          {/* Right — tabs + dynamic content */}
          <div className="md:col-span-8 space-y-5">
            <ProfileTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            <div className="relative flex-1 w-full bg-white/20 backdrop-blur-3xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] rounded-[2.5rem] p-8 overflow-y-auto custom-scrollbar min-h-[460px]">
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
                  {activeTab === 'appointments' && <AppointmentsTab setActiveTab={setActiveTab} setFeedbackAptId={setFeedbackAptId} />}
                  {activeTab === 'records' && <MedicalRecordTab profile={profile} />}
                  {activeTab === 'feedback' && <PatientFeedbackTab user={user} feedbackAptId={feedbackAptId} setFeedbackAptId={setFeedbackAptId} />}
                  {activeTab === 'aiscans' && <AIScansTab user={user} />}
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
    </div>
  );
}

// ─── AI Face Scan History Sub-components ──────────────────────────────────────

const translateLabel = (label) => {
  if (!label) return '';
  const cleanLabel = label.trim().toLowerCase();
  const translationMap = {
    'acne': 'Mụn trứng cá',
    'pustule': 'Mụn mủ',
    'pustules': 'Mụn mủ',
    'papule': 'Mụn sẩn',
    'papules': 'Mụn sẩn',
    'nodule': 'Mụn bọc',
    'nodules': 'Mụn bọc',
    'cyst': 'Mụn nang',
    'cysts': 'Mụn nang',
    'blackhead': 'Mụn đầu đen',
    'blackheads': 'Mụn đầu đen',
    'whitehead': 'Mụn đầu trắng',
    'whiteheads': 'Mụn đầu trắng',
    'dark spot': 'Thâm & Nám',
    'dark spots': 'Thâm & Nám',
    'dark_spots': 'Thâm & Nám',
    'darkspot': 'Thâm & Nám',
    'darkspots': 'Thâm & Nám',
    'pore': 'Lỗ chân lông',
    'pores': 'Lỗ chân lông',
    'wrinkle': 'Nếp nhăn',
    'wrinkles': 'Nếp nhăn',
    'scar': 'Sẹo mụn',
    'scars': 'Sẹo mụn',
    'normal_skin': 'Da thường',
    'normal skin': 'Da thường',
    'normal': 'Da thường'
  };
  return translationMap[cleanLabel] || label;
};

const getLabelStyle = (label) => {
  if (!label) return { stroke: 'rgba(99, 102, 241, 0.8)', fill: 'rgba(99, 102, 241, 0.12)', text: 'rgba(99, 102, 241, 1)' };
  const cleanLabel = label.trim().toLowerCase();

  if (['acne', 'pustule', 'pustules', 'papule', 'papules', 'nodule', 'nodules', 'cyst', 'cysts'].includes(cleanLabel)) {
    return { stroke: 'rgba(239, 68, 68, 0.8)',  fill: 'rgba(239, 68, 68, 0.12)', text: 'rgba(239, 68, 68, 1)' };
  }
  if (['dark spot', 'dark spots', 'dark_spots', 'darkspot', 'darkspots', 'scar', 'scars'].includes(cleanLabel)) {
    return { stroke: 'rgba(245, 158, 11, 0.8)', fill: 'rgba(245, 158, 11, 0.12)', text: 'rgba(245, 158, 11, 1)' };
  }
  if (['blackhead', 'blackheads', 'whitehead', 'whiteheads'].includes(cleanLabel)) {
    return { stroke: 'rgba(249, 115, 22, 0.8)', fill: 'rgba(249, 115, 22, 0.12)', text: 'rgba(249, 115, 22, 1)' };
  }
  if (['pore', 'pores'].includes(cleanLabel)) {
    return { stroke: 'rgba(14, 165, 233, 0.8)', fill: 'rgba(14, 165, 233, 0.12)', text: 'rgba(14, 165, 233, 1)' };
  }
  if (['wrinkle', 'wrinkles'].includes(cleanLabel)) {
    return { stroke: 'rgba(168, 85, 247, 0.8)', fill: 'rgba(168, 85, 247, 0.12)', text: 'rgba(168, 85, 247, 1)' };
  }
  if (['normal', 'normal_skin', 'normal skin'].includes(cleanLabel)) {
    return { stroke: 'rgba(16, 185, 129, 0.8)', fill: 'rgba(16, 185, 129, 0.12)', text: 'rgba(16, 185, 129, 1)' };
  }
  return { stroke: 'rgba(99, 102, 241, 0.8)', fill: 'rgba(99, 102, 241, 0.12)', text: 'rgba(99, 102, 241, 1)' };
};

function AIScansTab({ user }) {
  const [scans, setScans] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);

  const fetchScans = useCallback(async () => {
    // 1. Try fetching from Supabase Database
    if (user?.id) {
      try {
        const { data, error } = await supabase
          .from('ai_skin_analyses')
          .select(`
            analysis_id,
            created_at,
            detected_condition,
            confidence_score,
            recommendation,
            result_summary,
            image_id,
            skin_images (
              image_url
            )
          `)
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        
        if (data && data.length > 0) {
          // Map DB columns to fit UI
          const dbScans = data.map((row) => {
            let parsedResults = [];
            try {
              parsedResults = typeof row.result_summary === 'string'
                ? JSON.parse(row.result_summary)
                : (row.result_summary || []);
            } catch (pErr) {
              parsedResults = [{ label: row.detected_condition, confidence: Number(row.confidence_score) || 0.95 }];
            }

            return {
              id: row.analysis_id,
              imageId: row.image_id,
              date: new Date(row.created_at).toLocaleString('vi-VN'),
              image: row.skin_images?.image_url || '',
              results: parsedResults,
              isFromDb: true
            };
          });
          setScans(dbScans);
          return; // Success!
        }
      } catch (dbErr) {
        console.warn('Failed to load scans from database, falling back to localStorage:', dbErr);
      }
    }

    // 2. LocalStorage fallback
    const key = `dermasmart_ai_scans_${user?.id || 'guest'}`;
    try {
      const stored = localStorage.getItem(key);
      setScans(stored ? JSON.parse(stored) : []);
    } catch (e) {
      console.error('Failed to load AI scans from localStorage:', e);
    }
  }, [user]);

  useEffect(() => {
    fetchScans();
    window.addEventListener('ai-scans-updated', fetchScans);
    return () => window.removeEventListener('ai-scans-updated', fetchScans);
  }, [fetchScans]);

  const handleDeleteScan = async (scan, e) => {
    e.stopPropagation();
    
    // 1. Try to delete from Supabase if stored in DB
    if (user?.id && scan.isFromDb) {
      try {
        // Delete analysis record first
        const { error: delAnalysisErr } = await supabase
          .from('ai_skin_analyses')
          .delete()
          .eq('analysis_id', scan.id);
        
        if (delAnalysisErr) throw delAnalysisErr;

        // Delete related image record next
        if (scan.imageId) {
          await supabase
            .from('skin_images')
            .delete()
            .eq('image_id', scan.imageId);
        }
        console.log('Deleted scan and image from Supabase database.');
      } catch (dbErr) {
        console.warn('Failed to delete scan from database:', dbErr);
      }
    }

    // 2. Delete from localStorage
    const key = `dermasmart_ai_scans_${user?.id || 'guest'}`;
    const updated = scans.filter(s => s.id !== scan.id);
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update localStorage after deletion:', e);
    }
    setScans(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100 animate-pulse">
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Lịch sử soi da AI</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {scans.length > 0 ? `Lưu trữ ${scans.length}/5 lần phân tích gần nhất` : 'Lưu trữ tối đa 5 kết quả phân tích gần nhất'}
          </p>
        </div>
      </div>

      {scans.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {scans.map((scan) => {
            const results = scan.results || [];
            const hasIssues = results.length > 0;

            // Find top prediction
            const topPred = hasIssues
              ? results.reduce((best, p) => p.confidence > best.confidence ? p : best, results[0])
              : null;

            const predictedClass = topPred ? topPred.label : 'normal_skin';
            const confidence = topPred ? topPred.confidence : 0.95;
            const confidencePercent = (confidence * 100).toFixed(0);

            const style = getLabelStyle(predictedClass);
            const translatedName = translateLabel(predictedClass);

            return (
              <div 
                key={scan.id} 
                className="bg-white/85 border border-slate-200/60 shadow-sm rounded-2xl p-4 flex flex-col hover:shadow-md hover:border-teal-300 transition-all group"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 mb-3 border border-slate-100">
                  <img src={scan.image} alt="Face Scan" className="w-full h-full object-cover animate-fade-in" />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {scan.date}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between space-y-4">
                  {/* Diagnosis Result */}
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Chẩn đoán:</span>
                    <div 
                      className="flex items-center justify-between p-2.5 rounded-xl border mt-1"
                      style={{ backgroundColor: style.fill, borderColor: style.stroke }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.stroke }} />
                        <span className="text-xs font-bold" style={{ color: style.text }}>
                          {translatedName}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-white rounded-md border border-slate-100" style={{ color: style.text }}>
                        {confidencePercent}%
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedScan(scan)}
                      className="flex-1 py-2 bg-gradient-to-r from-teal-500/10 to-sky-500/10 hover:from-teal-500/20 hover:to-sky-500/20 text-teal-700 text-xs font-bold rounded-xl border border-teal-500/10 hover:border-teal-500/20 transition-all cursor-pointer text-center"
                    >
                      Xem chi tiết soi da
                    </button>
                    <button
                      onClick={(e) => handleDeleteScan(scan, e)}
                      className="p-2 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-100"
                      title="Xóa kết quả"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white/40 backdrop-blur-sm">
          <Brain className="w-10 h-10 text-slate-300 mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-slate-500 font-semibold">Chưa có lịch sử soi da.</p>
          <p className="text-xs text-slate-400 mt-1">Hãy sử dụng tính năng soi da AI trên hệ thống để lưu kết quả.</p>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedScan && (
          <ScanDetailModal scan={selectedScan} onClose={() => setSelectedScan(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Skin recommendations matching Landing Page ────────────────────────────────
const SKIN_RECOMMENDATIONS = {
  acne: "Khuyến nghị làm sạch sâu bằng sữa rửa mặt chứa Acid Salicylic (BHA) 2%, kết hợp gel chấm mụn chứa Benzoyl Peroxide hoặc Adapalene. Hãy uống đủ nước và hạn chế thức khuya.",
  blackheads: "Khuyến nghị sử dụng tẩy tế bào chết hóa học chứa BHA 2% từ 2-3 lần/tuần, kết hợp mặt nạ đất sét để hút bã nhờn dư thừa. Dưỡng ẩm nhẹ dịu dạng gel.",
  dark_spots: "Khuyến nghị bổ sung Serum Vitamin C, Niacinamide hoặc Arbutin vào chu trình dưỡng da buổi sáng. Bắt buộc sử dụng kem chống nắng quang phổ rộng SPF 50+ hàng ngày.",
  pores: "Khuyến nghị tập trung làm sạch sâu, sử dụng serum chứa Niacinamide (Vitamin B3) 10% giúp điều tiết dầu và thu nhỏ lỗ chân lông. Tránh bít tắc.",
  wrinkles: "Khuyến nghị bắt đầu sử dụng Retinol 0.5% hoặc Peptide vào ban đêm để kích thích sản sinh collagen. Chú trọng dưỡng ẩm sâu với Hyaluronic Acid.",
  normal_skin: "Làn da của bạn rất khỏe mạnh và có độ ẩm tốt. Hãy duy trì chu trình chăm sóc cơ bản gồm: Làm sạch - Dưỡng ẩm nhẹ nhàng - Chống nắng đầy đủ hàng ngày.",
  pustules: "Khuyến nghị vệ sinh da sạch sẽ, tránh tự ý nặn mụn gây thâm và lan rộng ổ viêm. Có thể sử dụng các sản phẩm chứa Benzoyl Peroxide hoặc Acid Salicylic để chấm mụn.",
  pustule: "Khuyến nghị vệ sinh da sạch sẽ, tránh tự ý nặn mụn gây thâm và lan rộng ổ viêm. Có thể sử dụng các sản phẩm chứa Benzoyl Peroxide hoặc Acid Salicylic để chấm mụn.",
  papules: "Khuyến nghị sử dụng các chất giảm viêm dịu nhẹ như Niacinamide, BHA hoặc Benzoyl Peroxide nồng độ thấp để giảm viêm sưng. Hạn chế sờ tay lên mặt.",
  papule: "Khuyến nghị sử dụng các chất giảm viêm dịu nhẹ như Niacinamide, BHA hoặc Benzoyl Peroxide nồng độ thấp để giảm viêm sưng. Hạn chế sờ tay lên mặt.",
  nodules: "Khuyến nghị không nặn hoặc tự ý tác động mạnh lên nốt mụn. Bạn nên đến gặp bác sĩ da liễu sớm để được điều trị bằng các phương pháp chuyên khoa.",
  nodule: "Khuyến nghị không nặn hoặc tự ý tác động mạnh lên nốt mụn. Bạn nên đến gặp bác sĩ da liễu sớm để được điều trị bằng các phương pháp chuyên khoa.",
  cysts: "Mụn nang là tổn thương sâu dễ để lại sẹo lõm nghiêm trọng. Khuyến nghị thăm khám bác sĩ da liễu sớm để được kê toa và hướng dẫn điều trị y khoa phù hợp.",
  cyst: "Mụn nang là tổn thương sâu dễ để lại sẹo lõm nghiêm trọng. Khuyến nghị thăm khám bác sĩ da liễu sớm để được kê toa và hướng dẫn điều trị y khoa phù hợp.",
  whiteheads: "Khuyến nghị làm sạch da đều đặn, tẩy tế bào chết hóa học AHA/BHA nhẹ nhàng để giải phóng lỗ chân lông bị bít tắc.",
  whitehead: "Khuyến nghị làm sạch da đều đặn, tẩy tế bào chết hóa học AHA/BHA nhẹ nhàng để giải phóng lỗ chân lông bị bít tắc.",
  dark_spot: "Khuyến nghị bổ sung Serum Vitamin C, Niacinamide hoặc Arbutin vào chu trình dưỡng da buổi sáng. Bắt buộc sử dụng kem chống nắng quang phổ rộng SPF 50+ hàng ngày.",
  scar: "Khuyến nghị sử dụng các hoạt chất phục hồi da như Vitamin B5, Niacinamide hoặc các liệu trình công nghệ cao như laser, phi kim tại phòng khám da liễu.",
  scars: "Khuyến nghị sử dụng các hoạt chất phục hồi da như Vitamin B5, Niacinamide hoặc các liệu trình công nghệ cao như laser, phi kim tại phòng khám da liễu.",
  pore: "Khuyến nghị tập trung làm sạch sâu, sử dụng serum chứa Niacinamide (Vitamin B3) 10% giúp điều tiết dầu và thu nhỏ lỗ chân lông. Tránh bít tắc.",
  wrinkle: "Khuyến nghị bắt đầu sử dụng Retinol 0.5% hoặc Peptide vào ban đêm để kích thích sản sinh collagen. Chú trọng dưỡng ẩm sâu với Hyaluronic Acid."
};

function ScanDetailModal({ scan, onClose }) {
  const results = scan.results || [];
  const hasIssues = results.length > 0;

  // Find top prediction
  const topPred = hasIssues
    ? results.reduce((best, p) => p.confidence > best.confidence ? p : best, results[0])
    : null;

  const predictedClass = topPred ? topPred.label : 'normal_skin';
  const confidence = topPred ? topPred.confidence : 0.95;
  const confidencePercent = (confidence * 100).toFixed(0);

  const style = getLabelStyle(predictedClass);
  const translatedName = translateLabel(predictedClass);

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6" 
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl relative border border-slate-100 flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 p-2 bg-slate-100/80 hover:bg-slate-200 backdrop-blur-sm rounded-full text-slate-500 hover:text-slate-700 transition-all cursor-pointer border-none flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Face Image (No overlays, raw, clean) */}
        <div className="w-full md:w-1/2 bg-slate-950 flex items-center justify-center aspect-[4/3] md:aspect-auto min-h-[300px] md:min-h-0 relative">
          <img src={scan.image} alt="Scan Detail" className="w-full h-full object-cover block" />
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full font-bold">
            Quét lúc: {scan.date}
          </div>
        </div>

        {/* Right Column: Results Display */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto bg-slate-50/50">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Lịch sử soi da</span>
              <h3 className="text-lg font-black text-slate-950 mt-1 uppercase">KẾT QUẢ PHÂN TÍCH DA</h3>
            </div>

            {/* Diagnosis display */}
            <div className="space-y-4">
              <div 
                className="flex items-center justify-between p-4 rounded-2xl border transition-all"
                style={{ backgroundColor: style.fill, borderColor: style.stroke }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: style.stroke }} />
                  <span className="text-sm font-black" style={{ color: style.text }}>
                    {translatedName}
                  </span>
                </div>
                <span className="text-xs font-extrabold px-3 py-1 bg-white rounded-full shadow-sm border border-slate-100" style={{ color: style.text }}>
                  {confidencePercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Độ tin cậy của AI:</span>
                  <span className="font-bold text-slate-800">{confidencePercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${confidencePercent}%`, 
                      backgroundColor: style.stroke 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-4 rounded-2xl bg-white border border-slate-150 shadow-sm space-y-1.5">
              <span className="text-[9px] font-extrabold text-teal-600 tracking-wider uppercase">Lời khuyên y khoa:</span>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {SKIN_RECOMMENDATIONS[predictedClass.toLowerCase().replace(/\s+/g, '_')] || "Vui lòng tham khảo ý kiến bác sĩ da liễu để được khám chuyên sâu."}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100">
            <button 
              onClick={onClose} 
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-sky-500 text-white text-sm font-bold rounded-xl shadow-md shadow-teal-500/20 hover:shadow-lg transition-all cursor-pointer border-none text-center"
            >
              Đóng báo cáo
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
