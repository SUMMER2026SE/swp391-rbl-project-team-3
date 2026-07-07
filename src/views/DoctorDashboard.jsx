import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassSelect from '../components/common/GlassSelect';
import { GLASS_INPUT } from '../components/common/GlassCard';
import { NotificationModel } from '../models/NotificationModel';
import { DoctorModel } from '../models/DoctorModel';
import { AppointmentModel } from '../models/AppointmentModel';
import { MedicalRecordModel } from '../models/MedicalRecordModel';
import { PrescriptionModel } from '../models/PrescriptionModel';
import { ServiceTicketModel } from '../models/ServiceTicketModel';
import { supabase } from '../supabaseClient';
import ClinicEmailService from '../services/EmailService';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionTemplate,
} from 'framer-motion';
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
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
  MessageSquare,
  History,
} from 'lucide-react';

// Import Mock Data

import logo from '../assets/logo.png';

// Import Tab Components
import DashboardOverview from '../components/Doctor/DashboardOverview';
import ScheduleWaitingList from '../components/Doctor/ScheduleWaitingList';
import WorkSchedule from '../components/Doctor/WorkSchedule';
import VirtualClinicWorkspace from '../components/Doctor/VirtualClinic/VirtualClinicWorkspace';
import MedicalRecordHistory from '../components/Doctor/MedicalRecordHistory';
import DoctorFeedbackView from '../components/Doctor/DoctorFeedbackView';

import LiquidSidebarMenu from '../components/ui/LiquidSidebarMenu';


export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State-based routing
  const [currentDoctorId, setCurrentDoctorId] = useState(user?.id || '');
  const doctorId = currentDoctorId;
  const [activeTab, setActiveTab] = useState('overview');
  const [globalSearch, setGlobalSearch] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [appointments, setAppointments] = useState([]);
  // Toast supports both success and error feedback for the EMR write flow.
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }
  const [isSaving, setIsSaving] = useState(false);
  const [doctorsList, setDoctorsList] = useState([]);
  const [activeDoctor, setActiveDoctor] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  // Centralized loader so both the initial fetch and the Realtime listener can
  // refresh the doctor's queue from Supabase.
  const loadApts = useCallback(async () => {
    if (!currentDoctorId) return;
    try {
      const data = await AppointmentModel.getByDoctorId(currentDoctorId);
      if (Array.isArray(data) && data.length > 0) {
        const aptIds = data.map((a) => a.id);
        const { data: ticketsData, error: ticketsErr } = await supabase
          .from('service_tickets')
          .select('appointment_id, status')
          .in('appointment_id', aptIds);

        if (ticketsErr) throw ticketsErr;

        const populated = data.map((apt) => {
          const aptTickets = (ticketsData || []).filter((t) => t.appointment_id === apt.id);
          return {
            ...apt,
            serviceTickets: aptTickets,
          };
        });
        setAppointments(populated);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error('[DoctorDashboard] Error loading appointments with tickets:', err);
      setAppointments([]);
    }
  }, [currentDoctorId]);

  useEffect(() => {
    loadApts();
  }, [loadApts]);

  // PHASE 4 — Realtime Receptionist → Doctor queue. Subscribe to changes on the
  // appointments rows for THIS doctor, and also to service_tickets changes so we
  // update the waiting state when a technician updates ticket statuses.
  useEffect(() => {
    if (!currentDoctorId) return;
    const aptChannel = supabase
      .channel(`doctor-appointments-${currentDoctorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `doctor_id=eq.${currentDoctorId}` },
        () => { loadApts(); }
      )
      .subscribe();

    const ticketChannel = supabase
      .channel(`doctor-tickets-${currentDoctorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_tickets' },
        () => { loadApts(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(aptChannel);
      supabase.removeChannel(ticketChannel);
    };
  }, [currentDoctorId, loadApts]);

  useEffect(() => {
    const loadDoctors = async () => {
      const docs = await DoctorModel.getAllDoctors();
      setDoctorsList(docs);
      const matched = docs.find(d => d.id === currentDoctorId) || docs[0];
      setActiveDoctor(matched);
    };
    loadDoctors();
  }, [currentDoctorId]);

  // Dynamic Page Title
  const getPageTitle = () => {
    if (activeAppointment) {
      return `Hồ sơ Khám bệnh: ${activeAppointment?.patientName || 'Bệnh nhân'}`;
    }
    const tabNames = {
      overview: 'Tổng quan',
      waiting_list: 'Hàng chờ & Lịch khám',
      schedule: 'Lịch làm việc',
      history: 'Lịch sử khám',
      feedback: 'Đánh giá',
    };
    return tabNames[activeTab] || 'Tổng quan';
  };

  // PHASE 1 & 3 — EMR WRITE PATH (no longer a stub).
  // Persists the exam to Supabase: flips the appointment to 'Đã khám' (EXAMINED),
  // upserts the medical_records row, saves the prescription (header + details),
  // and routes any selected indications to the Technician via service_tickets.
  const handleCompleteExamination = async (appointmentId, selectedServices = [], clinicalData = null) => {
    if (isSaving) return;

    // Resolve the patient/doctor ids from the appointment being examined (raw
    // row carries snake_case; fall back to the camelCase aliases just in case).
    const apt =
      (appointments || []).find((a) => String(a.id) === String(appointmentId)) ||
      activeAppointment ||
      {};
    const patientId = apt.patient_id || apt.patientId || null;
    const doctorId = apt.doctor_id || apt.doctorId || currentDoctorId || null;

    setIsSaving(true);
    try {
      // 1. Lifecycle: appointment → 'Đã khám' (EXAMINED). Leaves billing untouched.
      await AppointmentModel.updateStatus(appointmentId, 'Đã khám');

      // 2. Medical record (1:1 with the appointment → upsert).
      const record = await MedicalRecordModel.upsertExam({
        appointment_id: appointmentId,
        patient_id: patientId,
        doctor_id: doctorId,
        diagnosis: clinicalData?.diagnosis || '',
        symptoms: clinicalData?.symptoms || apt.reason || apt.symptoms || '',
        doctor_note: clinicalData?.doctorNotes || clinicalData?.generalInstructions || '',
      });

      // 3. Prescription (only if the doctor actually kê đơn).
      const meds = (clinicalData?.medications || []).filter((m) => (m?.name || '').trim());
      if (record?.record_id && meds.length > 0) {
        await PrescriptionModel.savePrescriptionForRecord({
          record_id: record.record_id,
          doctor_id: doctorId,
          patient_id: patientId,
          note: clinicalData?.generalInstructions || '',
          medications: meds,
        });
      }

      // 4. Doctor → Technician: one service_ticket per selected indication.
      const services = Array.isArray(selectedServices) ? selectedServices : [];
      const noteToSave = clinicalData?.indicationNote || '';
      for (const svc of services) {
        const serviceName = typeof svc === 'string' ? svc : svc?.name;
        if (!serviceName) continue;

        // Double check if ticket already exists to avoid duplicates
        const { data: existing } = await supabase
          .from('service_tickets')
          .select('id')
          .eq('appointment_id', appointmentId)
          .eq('service_name', serviceName)
          .maybeSingle();

        if (existing) continue;

        await ServiceTicketModel.create({
          appointment_id: appointmentId,
          service_name: serviceName,
          status: 'PENDING',
          doctor_note: noteToSave,
          technician_id: svc?.technician_id || null,
          // Doctor-specified metrics → drives the technician's lab-metric grid.
          procedure_details:
            Array.isArray(svc?.requestedMetrics) && svc.requestedMetrics.length > 0
              ? { type: 'LabTest', metrics: svc.requestedMetrics }
              : null,
        });
      }

      // 5. Send Medical Record Summary Email to Patient (if registered)
      if (patientId && patientId !== '18504773-0f51-405a-aa32-70cae403be6e') {
        supabase
          .from('users')
          .select('email, full_name')
          .eq('user_id', patientId)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.email) {
              const pName = data.full_name || patientName;
              const meds = (clinicalData?.medications || []).filter((m) => (m?.name || '').trim()).map(m => ({
                name: m.name,
                dosage: m.dosage,
                frequency: m.frequency,
                instructions: m.instructions || m.instruction,
                quantity: m.quantity
              }));
              
              ClinicEmailService.sendMedicalRecordEmail(data.email, pName, {
                diagnosis: clinicalData?.diagnosis || '',
                symptoms: clinicalData?.symptoms || apt.reason || apt.symptoms || '',
                doctorNotes: clinicalData?.doctorNotes || clinicalData?.generalInstructions || '',
                medications: meds,
                followUpDate: clinicalData?.followUpDate || ''
              }).then(res => {
                if (res.ok) {
                  console.info('EMR summary email sent successfully to', data.email);
                } else {
                  console.warn('Failed to send EMR summary email:', res.error);
                }
              }).catch(err => {
                console.error('Error sending EMR summary email:', err);
              });
            }
          })
          .catch(err => {
            console.error('Error fetching patient email for EMR:', err);
          });
      }

      // 6. Refresh from the DB (also drives the Realtime-backed queue) & close.
      await loadApts();
      localStorage.removeItem(`appointment_draft_${appointmentId}`);
      setActiveAppointment(null);
      showToast('Hồ sơ bệnh án đã được lưu và đồng bộ thành công!', 'success');
    } catch (err) {
      console.error('Failed to complete examination (EMR write):', err);
      showToast('Lưu hồ sơ thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendIndications = async (appointmentId, selectedServices = [], doctorNote = '') => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const services = Array.isArray(selectedServices) ? selectedServices : [];
      for (const svc of services) {
        const serviceName = typeof svc === 'string' ? svc : svc?.name;
        if (!serviceName) continue;

        // Double check if ticket already exists to avoid duplicates
        const { data: existing } = await supabase
          .from('service_tickets')
          .select('id')
          .eq('appointment_id', appointmentId)
          .eq('service_name', serviceName)
          .maybeSingle();

        if (existing) continue;

        await ServiceTicketModel.create({
          appointment_id: appointmentId,
          service_name: serviceName,
          status: 'PENDING',
          doctor_note: doctorNote,
          technician_id: svc?.technician_id || null,
          // Doctor-specified metrics → drives the technician's lab-metric grid.
          procedure_details:
            Array.isArray(svc?.requestedMetrics) && svc.requestedMetrics.length > 0
              ? { type: 'LabTest', metrics: svc.requestedMetrics }
              : null,
        });
      }

      showToast('Đã gửi chỉ định cho Kỹ thuật viên!', 'success');
      localStorage.removeItem(`appointment_draft_${appointmentId}`);
      setActiveAppointment(null);
      await loadApts();
    } catch (err) {
      console.error('Failed to send indications:', err);
      showToast('Gửi chỉ định thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setIsSaving(false);
    }
  };


  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await NotificationModel.getAll();
        setNotifications(Array.isArray(res) ? res : []);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
        setNotifications([]);
      }
    };
    fetchNotifications();

    const handleUpdate = () => {
      fetchNotifications();
    };

    window.addEventListener('notifications-updated', handleUpdate);
    return () => window.removeEventListener('notifications-updated', handleUpdate);
  }, [currentDoctorId]);

  const myNotifications = notifications?.filter?.(
    (n) => n.recipientRole === 'DOCTOR' && (n.recipientId === doctorId || n.recipientId === 'all')
  );
  const unreadCount = myNotifications?.filter?.((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    NotificationModel.markAllAsRead('DOCTOR', doctorId);
  };

  /* --------------------------------------------------------------
     Continuous scroll-linked navbar morph (Part 2).
     -------------------------------------------------------------- */
  const scrollRef = useRef(null);
  const { scrollY } = useScroll({ container: scrollRef });

  const spring = { stiffness: 220, damping: 32, mass: 0.9 };
  const widthRaw = useTransform(scrollY, [0, 120], [100, 90]);
  const maxWRaw = useTransform(scrollY, [0, 120], [1600, 1140]);
  const radiusRaw = useTransform(scrollY, [0, 120], [0, 32]);
  const topRaw = useTransform(scrollY, [0, 120], [0, 16]);
  const padXRaw = useTransform(scrollY, [0, 120], [32, 30]);
  const bgRaw = useTransform(scrollY, [0, 120], [0, 0.72]);
  const shadowRaw = useTransform(scrollY, [0, 120], [0, 0.12]);
  const ringRaw = useTransform(scrollY, [0, 120], [0, 0.7]);

  const widthMV = useSpring(widthRaw, spring);
  const maxWMV = useSpring(maxWRaw, spring);
  const radiusMV = useSpring(radiusRaw, spring);
  const topMV = useSpring(topRaw, spring);
  const padXMV = useSpring(padXRaw, spring);
  const bgMV = useSpring(bgRaw, spring);
  const shadowMV = useSpring(shadowRaw, spring);
  const ringMV = useSpring(ringRaw, spring);

  const navWidth = useMotionTemplate`${widthMV}%`;
  const navMaxWidth = useMotionTemplate`${maxWMV}px`;
  const navRadius = useMotionTemplate`${radiusMV}px`;
  const navTop = useMotionTemplate`${topMV}px`;
  const navPadX = useMotionTemplate`${padXMV}px`;
  const navBg = useMotionTemplate`rgba(255, 255, 255, ${bgMV})`;
  const navShadow = useMotionTemplate`0 14px 40px rgba(2, 32, 29, ${shadowMV}), inset 0 1px 2px rgba(255,255,255,0.9), inset 0 0 0 1px rgba(255,255,255,${ringMV})`;

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'waiting_list', label: 'Hàng chờ & Lịch khám', icon: Users },
    { id: 'schedule', label: 'Lịch làm việc', icon: Calendar },
    { id: 'history', label: 'Lịch sử khám', icon: History },
    { id: 'feedback', label: 'Đánh giá', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-100 to-cyan-50 relative overflow-x-hidden flex w-full font-sans antialiased text-slate-800">
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
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-400/30 blur-3xl bg-mesh-blob-1"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-400/30 blur-3xl bg-mesh-blob-2"></div>
      </div>
      {/* Compact Glass Sidebar — icon-only by default, expands on hover */}
      <motion.aside
        animate={{ width: isSidebarExpanded ? 256 : 80 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex bg-teal-900/10 backdrop-blur-2xl border-r border-teal-900/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07),inset_0_0_20px_rgba(255,255,255,0.5)] dark:bg-slate-900/40 dark:border-slate-700/50 fixed h-full z-40 flex-col py-8 px-3 justify-between overflow-hidden transition-all duration-500 ease-out"
      >
        <div className="flex flex-col gap-6">
          {/* Logo & Toggle Header */}
          <div className={`flex items-center ${isSidebarExpanded ? 'justify-between px-1' : 'justify-center'} min-h-[80px]`}>
            {isSidebarExpanded ? (
              <>
                <div className="flex flex-col items-start gap-1">
                  <img src={logo} alt="DermaSmart Logo" className="h-16 w-auto object-contain" />
                  <span className="text-[10px] text-gray-500 whitespace-nowrap animate-fadeIn">
                    Doctor Portal
                  </span>
                </div>
                <button
                  onClick={() => setIsSidebarExpanded(false)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors cursor-pointer"
                  title="Thu gọn"
                >
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsSidebarExpanded(true)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors cursor-pointer"
                title="Mở rộng"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <LiquidSidebarMenu
            items={navItems}
            activeId={activeTab}
            onChange={(id) => {
              setActiveTab(id);
              setActiveAppointment(null);
            }}
            isSidebarExpanded={isSidebarExpanded}
          />
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100/60 pt-4 space-y-1">
          <div className="relative group">
            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className={`w-full flex items-center gap-3 rounded-xl font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50/40 transition-all ${
                isSidebarExpanded ? 'px-4 py-3' : 'px-0 py-3 justify-center'
              }`}
            >
              <LogOut className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <AnimatePresence>
                {isSidebarExpanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm whitespace-nowrap"
                  >
                    Đăng xuất
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            {!isSidebarExpanded && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Đăng xuất
              </div>
            )}
          </div>
        </div>
      </motion.aside>
      {/* Main Content Area — margin adapts to compact sidebar */}
      <div
        ref={scrollRef}
        className={`flex-1 flex flex-col h-screen overflow-y-auto z-10 transition-all duration-300 ${
          isSidebarExpanded ? 'md:ml-64' : 'md:ml-20'
        }`}
      >
        {/* Continuous Morphing Pill Topbar */}
        <motion.header
          style={{
            position: 'sticky',
            top: navTop,
            zIndex: 50,
            margin: '0 auto',
            left: 0,
            right: 0,
            width: navWidth,
            maxWidth: navMaxWidth,
            borderRadius: navRadius,
            paddingLeft: navPadX,
            paddingRight: navPadX,
            backgroundColor: navBg,
            boxShadow: navShadow,
          }}
          className="relative backdrop-blur-2xl flex justify-between items-center h-20 transition-all duration-500 ease-out"
        >
          <div className="flex items-center gap-4">
            <span className="font-black text-2xl text-gradient-emerald md:hidden tracking-tight">DermaSmart</span>
            <div className={`hidden md:flex items-center ${GLASS_INPUT} rounded-full pl-4 pr-5 py-2.5 focus-within:border-teal-400`}>
              <Search className="w-[18px] h-[18px] text-slate-400 mr-2.5" />
              <input
                className="bg-transparent border-none outline-none text-[15px] font-medium text-gray-800 placeholder-gray-500 w-72 p-0 focus:ring-0"
                placeholder="Tìm kiếm bệnh nhân, hồ sơ..."
                type="text"
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  // Auto-switch to history tab when typing from non-history tabs
                  if (e.target.value.trim() && activeTab !== 'history' && activeTab !== 'waiting_list') {
                    setActiveTab('history');
                    setActiveAppointment(null);
                  }
                }}
              />
            </div>
          </div>
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-800 to-emerald-700 tracking-tight whitespace-nowrap pointer-events-none">
            {getPageTitle()}
          </h1>

          <div className="flex items-center gap-5">
            <div className="text-right hidden md:block">
              {!user?.isSupabase ? (
                <div className="flex flex-col items-end">
                  <GlassSelect
                    value={String(currentDoctorId ?? '')}
                    onChange={(v) => setCurrentDoctorId(v)}
                    options={(Array.isArray(doctorsList) ? doctorsList : []).map(d => ({ value: String(d.id), label: d.name }))}
                    buttonClassName="px-3 py-1.5 text-sm font-bold"
                    className="min-w-[190px]"
                  />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Doctor Portal (Demo)</span>
                </div>
              ) : (
                <>
                  <p className="font-bold text-sm text-gray-900 leading-none">{user?.name || 'BS. CKII. Trần Văn A'}</p>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Doctor Portal</span>
                </>
              )}

            </div>
            <div className="flex items-center gap-2.5 text-slate-500">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="hover:bg-white/70 hover:text-teal-600 transition-all p-2.5 rounded-full relative active:scale-95 border-none cursor-pointer bg-transparent flex items-center justify-center"
                >
                  <Bell className="w-[22px] h-[22px]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white"></span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07),inset_0_0_20px_rgba(255,255,255,0.5)] dark:bg-slate-900/40 dark:border-slate-700/50 rounded-2xl p-4 z-50 max-h-[350px] overflow-y-auto transition-all duration-500 ease-out"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                        <span className="text-sm font-bold text-slate-800">Thông báo của bạn</span>
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
                          (Array.isArray(myNotifications) ? myNotifications : []).map((notif) => (
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
                              <span className="text-[8px] text-slate-400 block mt-1.5">
                                {new Date(notif.timestamp).toLocaleString('vi-VN')}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button className="hover:bg-white/70 hover:text-teal-600 transition-all p-2.5 rounded-full active:scale-95">
                <Settings className="w-[22px] h-[22px]" />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 cursor-pointer transition-transform hover:scale-105 active:scale-95 ring-2 ring-transparent hover:ring-emerald-500/50 flex items-center justify-center"
                >
                  {activeDoctor?.image ? (
                    <img src={activeDoctor.image} alt={activeDoctor.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
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
                          <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{user?.name || activeDoctor?.name || 'Bác sĩ'}</p>
                          <p className="text-[11px] text-teal-600 font-medium truncate">{user?.email || 'doctor@dermasmart.com'}</p>
                        </div>
                        
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            navigate('/profile');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-teal-600 hover:bg-teal-50/50 transition-colors border-none bg-transparent cursor-pointer text-left"
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
          </div>
        </motion.header>

        {/* Dashboard Content Container */}
        <main className="p-8 max-w-7xl w-full mx-auto">
          {activeAppointment ? (
            <VirtualClinicWorkspace 
              appointment={activeAppointment} 
              onBack={() => setActiveAppointment(null)} 
              handleCompleteExamination={handleCompleteExamination}
              handleSendIndications={handleSendIndications}
            />
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && <DashboardOverview doctorId={currentDoctorId} />}
              {activeTab === 'waiting_list' && (
                <ScheduleWaitingList 
                  doctorId={currentDoctorId} 
                  onStartExam={setActiveAppointment} 
                  appointments={appointments}
                  searchQuery={globalSearch}
                />
              )}
              {activeTab === 'schedule' && <WorkSchedule doctorId={currentDoctorId} />}
              {activeTab === 'history' && (
                <MedicalRecordHistory
                  doctorId={currentDoctorId}
                  searchQuery={globalSearch}
                  onReviewRecord={(apt) => {
                    setActiveAppointment(apt);
                  }}
                />
              )}
              {activeTab === 'feedback' && <DoctorFeedbackView doctorId={currentDoctorId} />}
            </motion.div>
          )}
        </main>
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 backdrop-blur-2xl text-white px-6 py-4 rounded-2xl shadow-lg border ${
              toast.type === 'error'
                ? 'bg-rose-500/90 shadow-rose-500/20 border-rose-400/50'
                : 'bg-emerald-500/90 shadow-emerald-500/20 border-emerald-400/50'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span className="font-bold text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
