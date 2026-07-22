// Receptionist portal — refactored to the shared "Liquid Glass" baseline.
// Scope is strictly front-desk: dispatch queue, cashier desk, and patient live
// chat. Clinical surfaces (medical records, vitals, diagnoses, prescriptions)
// have been pruned — receptionists do not practice medicine.
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ClipboardList, CreditCard, MessageSquare, Star, Bell, Plus, CheckSquare, Sparkles, AlertCircle } from 'lucide-react';
import { useAppointmentController } from '../controllers/useAppointmentController';
import { useMedicalRecordController } from '../controllers/useMedicalRecordController';
import { useVoucherController } from '../controllers/useVoucherController';
import { useDoctors } from '../hooks/useDoctors';
import { AppointmentModel } from '../models/AppointmentModel';
import { NotificationModel } from '../models/NotificationModel';
import { DoctorScheduleModel } from '../models/DoctorScheduleModel';
import { supabase } from '../supabaseClient';
import { ReceptionistChatModel, subscribeToMessages, unsubscribe } from '../models/ChatModel';
import LiveChatDrawer from '../components/Receptionist/LiveChatDrawer';
import ReceptionistChatTab from '../components/Receptionist/ReceptionistChatTab';
import ReceptionistFeedbackView from '../components/Receptionist/ReceptionistFeedbackView';
import TodayQueueBoard from '../components/Receptionist/TodayQueueBoard';
import BillingCheckout from '../components/Receptionist/BillingCheckout';
import CheckInPatientModal from '../components/Receptionist/CheckInPatientModal';
import { normalizeApt, APT_STATUS, TODAY_STR } from '../components/Receptionist/receptionistData';
import DashboardShell from '../components/ui/DashboardShell';
import OverviewTab from '../components/Receptionist/Tabs/OverviewTab';
import WalkInBookingModal from '../components/Receptionist/Tabs/WalkInBookingModal';
import { useWalkInBooking } from '../hooks/useWalkInBooking';

const navItems = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'queue', label: 'Bàn Điều Phối', icon: ClipboardList },
  { id: 'billing', label: 'Quầy Thu Ngân', icon: CreditCard },
  { id: 'chat', label: 'Chăm Sóc Khách Hàng', icon: MessageSquare },
  { id: 'feedback', label: 'Đánh giá', icon: Star },
];

const PAGE_TITLES = {
  overview: 'Tổng quan',
  queue: 'Bàn Điều Phối',
  billing: 'Quầy Thu Ngân',
  chat: 'Chăm Sóc Khách Hàng',
  feedback: 'Đánh giá bệnh nhân',
};


export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const { doctors } = useDoctors();

  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [selectedCheckInApt, setSelectedCheckInApt] = useState(null);

  const {
    appointments,
    payments,
    bookAppointment,
    getAvailableSlots,
    isSlotBooked,
    lockSlot,
    holdSlot,
    validateBooking,
    refreshState,
  } = useAppointmentController();

  // Patient registry is front-desk (names/contact only); clinical records are gone.
  const { patients, addPatient } = useMedicalRecordController();

  const {
    vouchers,
    getAutoApplicable,
    incrementUsage,
  } = useVoucherController();

  const receptionistId = user?.id || 'staff-01';

  // ─── Realtime: keep the dispatch queue / KPIs live ────────────────────────
  // Replaces event-driven-only refreshes. Any INSERT (new booking), UPDATE
  // (check-in, approve, examine, pay) or DELETE on `appointments` re-pulls state
  // so the Kanban reflects another actor's action the instant it happens.
  useEffect(() => {
    const channel = supabase
      .channel('receptionist-appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => { refreshState(); }
      )
      .subscribe();
    // CRITICAL: drop the channel on unmount to avoid leaking subscriptions.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshState]);

  // ─── Toast ──────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ─── Notifications ────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const myNotifications = useMemo(
    () =>
      (notifications || []).filter(
        (n) =>
          n.recipientRole === 'RECEPTIONIST' &&
          (n.recipientId === receptionistId || n.recipientId === 'all')
      ),
    [notifications, receptionistId]
  );
  const unreadCount = myNotifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await NotificationModel.getAll();
        setNotifications(Array.isArray(res) ? res : []);
      } catch {
        setNotifications([]);
      }
    };
    fetchNotifications();
    window.addEventListener('notifications-updated', fetchNotifications);
    return () => window.removeEventListener('notifications-updated', fetchNotifications);
  }, []);

  // ─── Live chat drawer + messages ──────────────────────────────────────────
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatPatient, setActiveChatPatient] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);

  useEffect(() => {
    if (activeTab === 'chat' || isChatOpen) {
      setHasUnreadChat(false);
    }
  }, [activeTab, isChatOpen]);

  // Soft "ting" for incoming patient messages while the receptionist is on
  // another tab — pure Web Audio (no asset), throttled so a burst of messages
  // doesn't machine-gun. Fails silently if the browser blocks audio before
  // the first user gesture.
  const beepCtxRef = useRef(null);
  const lastBeepRef = useRef(0);
  const playChatBeep = useCallback(() => {
    const now = Date.now();
    if (now - lastBeepRef.current < 3000) return;
    lastBeepRef.current = now;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = beepCtxRef.current || (beepCtxRef.current = new Ctx());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch { /* autoplay policy — stay silent */ }
  }, []);

  useEffect(() => {
    let active = true;
    const fetchMsgs = async () => {
      try {
        const msgs = await ReceptionistChatModel.getAllMessages();
        if (active) setChatMessages(msgs || []);
      } catch (err) {
        console.error('Error fetching receptionist messages:', err);
      }
    };
    fetchMsgs();

    // Realtime: surface the unread badge the instant a patient message lands
    // while the receptionist is on another tab / drawer closed.
    const channel = subscribeToMessages({
      onEvent: (type, msg) => {
        if (!active) return;
        if (type === 'INSERT') {
          setChatMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          if (msg.senderRole === 'PATIENT' && activeTab !== 'chat' && !isChatOpen) {
            setHasUnreadChat(true);
            playChatBeep();
          }
        } else {
          setChatMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
        }
      },
    });

    // Safety net for the localStorage-fallback path.
    const interval = setInterval(fetchMsgs, 5000);
    return () => {
      active = false;
      clearInterval(interval);
      unsubscribe(channel);
    };
  }, [activeTab, isChatOpen]);

  const handleOpenChat = (patientId, patientName) => {
    const found = (patients || []).find((p) => p.id === patientId);
    setActiveChatPatient(
      found || {
        id: patientId,
        fullName: patientName || 'Bệnh nhân',
        phone: 'Chưa có',
        email: 'Chưa có',
        avatar: `https://i.pravatar.cc/150?u=${patientId}`,
        medicalHistory: [],
      }
    );
    setIsChatOpen(true);
  };

  const handleSendMessage = async (patientId, text) => {
    try {
      const newMsg = await ReceptionistChatModel.addMessage({
        senderId: receptionistId,
        senderName: user?.name || 'Lễ tân',
        senderRole: 'RECEPTIONIST',
        text,
        mode: 'Live',
        patientId,
      });
      if (newMsg) setChatMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error('Failed to send message:', err);
      showToast('Không gửi được tin nhắn.', 'error');
    }
  };

  // ─── Queue / appointment actions (awaited → reliable refresh) ─────────────
  const handleQueueStatusChange = async (aptId, status, extraFields = {}) => {
    await AppointmentModel.updateAppointment(aptId, { status, ...extraFields });
    await refreshState();
  };

  const handleCheckInSuccess = async (aptId, patientId, patientName, patientPhone) => {
    await handleQueueStatusChange(aptId, APT_STATUS.CHECKED_IN, {
      patient_id: patientId,
      patient_name: patientName,
      patient_phone: patientPhone
    });
  };

  // Cross-module jump: Queue "Thu ngân" → Billing pre-selected to that patient.
  const [billingFocusPatientId, setBillingFocusPatientId] = useState(null);
  const goBilling = async (apt) => {
    // Mark examined-but-unpaid so it lands in the cashier "Chờ thu" list, then jump.
    if (apt?.status !== APT_STATUS.EXAMINED && apt?.status !== APT_STATUS.PAID) {
      await handleQueueStatusChange(apt.aptId, APT_STATUS.EXAMINED);
    }
    setBillingFocusPatientId(apt?.patientId || null);
    setActiveTab('billing');
  };

  // ─── Manual walk-in booking — full state machine lives in useWalkInBooking ─
  const walkInBooking = useWalkInBooking({
    doctors,
    currentAnchorId: '18504773-0f51-405a-aa32-70cae403be6e',
    getAvailableSlots,
    isSlotBooked,
    validateBooking,
    bookAppointment,
    addPatient,
    showToast,
  });

  // ─── Derived KPI counts ───────────────────────────────────────────────────
  const todays = useMemo(
    () => (appointments || []).map((a, i) => normalizeApt(a, i)).filter((a) => a.date === TODAY_STR),
    [appointments]
  );
  const kpi = useMemo(
    () => ({
      checkedIn: todays.filter((a) => a.status === APT_STATUS.CHECKED_IN).length,
      todayTotal: todays.filter((a) => a.status !== APT_STATUS.CANCELLED).length,
      toCollect: todays.filter((a) => a.status === APT_STATUS.EXAMINED).length,
      // Booked for today but not yet through the door — who the desk is still expecting.
      toReceive: todays.filter((a) => a.status === APT_STATUS.BOOKED).length,
    }),
    [todays]
  );

  const headerExtras = (
    <>
      <span className="hidden sm:inline-block font-semibold text-xs text-teal-700 py-1 px-3 bg-teal-50 border border-teal-200/40 rounded-full">
        Cổng lễ tân
      </span>

      {/* Walk-in quick action — was a sidebar button; the shared shell sidebar
          only hosts nav, so it lives in the header now (still 1-click). */}
      <motion.button
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        onClick={() => walkInBooking.setIsAddOpen(true)}
        title="Đặt lịch hẹn trực tiếp"
        className="w-10 h-10 rounded-2xl bg-gradient-to-r from-teal-600 to-sky-600 text-white flex items-center justify-center shadow-md shadow-teal-600/10 hover:shadow-lg transition-all"
      >
        <Plus size={18} />
      </motion.button>

      {/* Live chat shortcut */}
      <motion.button
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        onClick={() => setActiveTab('chat')}
        className="relative w-10 h-10 rounded-2xl bg-white/50 border border-white/60 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-emerald-600 shadow-sm transition-colors"
        title="Chăm sóc khách hàng"
      >
        <MessageSquare size={18} />
        {hasUnreadChat && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white animate-pulse" />}
      </motion.button>

      {/* Notifications */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowNotifications((v) => !v)}
          className="relative w-10 h-10 rounded-2xl bg-white/50 border border-white/60 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-emerald-600 shadow-sm transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white" />}
        </motion.button>
        <AnimatePresence>
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 z-50 max-h-[350px] overflow-y-auto"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                  <span className="text-sm font-extrabold text-slate-800">Thông báo</span>
                  {unreadCount > 0 && (
                    <button onClick={() => NotificationModel.markAllAsRead('RECEPTIONIST', receptionistId)} className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold border-none bg-transparent cursor-pointer">
                      Đọc tất cả
                    </button>
                  )}
                </div>
                <div className="space-y-2.5">
                  {myNotifications.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">Chưa có thông báo nào.</p>
                  ) : (
                    myNotifications.map((notif, i) => (
                      <div
                        key={notif.id ?? ('notif-' + i)}
                        onClick={() => NotificationModel.markAsRead(notif.id)}
                        className={'p-2.5 rounded-xl transition-all border cursor-pointer text-left ' + (notif.isRead ? 'bg-transparent border-slate-100 hover:bg-slate-50' : 'bg-emerald-50/50 border-emerald-100/50 hover:bg-emerald-50')}
                      >
                        <p className="text-xs font-bold text-slate-800">{notif.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{notif.content}</p>
                        <span className="text-[8px] text-slate-400 block mt-1.5">{notif.timestamp ? new Date(notif.timestamp).toLocaleString('vi-VN') : ''}</span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );

  return (
    <>
      <DashboardShell
        portalName="Reception Portal"
        navItems={navItems}
        activeTab={activeTab}
        customKey={activeTab + (billingFocusPatientId ? ':pt-' + billingFocusPatientId : '')}
        onTabChange={setActiveTab}
        pageTitle={PAGE_TITLES[activeTab] || 'Tổng quan'}
        headerExtras={headerExtras}
        showSearch={false}
      >
        {activeTab === 'overview' && (
          <OverviewTab
            user={user}
            kpi={kpi}
            todays={todays}
            onGoTab={setActiveTab}
            onArrive={(apt) => setSelectedCheckInApt(apt)}
            onAdd={() => walkInBooking.setIsAddOpen(true)}
          />
        )}

        {activeTab === 'queue' && (
          <TodayQueueBoard
            appointments={appointments}
            doctors={doctors}
            onChangeStatus={handleQueueStatusChange}
            onOpenChat={handleOpenChat}
            onGoBilling={goBilling}
            onArrive={(apt) => setSelectedCheckInApt(apt)}
            showToast={showToast}
          />
        )}

        {activeTab === 'billing' && (
          <BillingCheckout
            appointments={appointments}
            payments={payments}
            doctors={doctors}
            vouchers={vouchers}
            getAutoApplicable={getAutoApplicable}
            incrementUsage={incrementUsage}
            receptionistId={receptionistId}
            onRefresh={refreshState}
            showToast={showToast}
            focusPatientId={billingFocusPatientId}
            onConsumeFocus={() => setBillingFocusPatientId(null)}
          />
        )}

        {activeTab === 'chat' && <ReceptionistChatTab />}

        {activeTab === 'feedback' && <ReceptionistFeedbackView />}
      </DashboardShell>

      {/* Live chat drawer (quick per-patient chat from queue/overview) */}
      <LiveChatDrawer
        patient={activeChatPatient}
        isOpen={isChatOpen}
        onClose={() => { setIsChatOpen(false); setActiveChatPatient(null); }}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
      />

      {/* Check-in Lookup & Medical Record Modal */}
      <CheckInPatientModal
        isOpen={!!selectedCheckInApt}
        onClose={() => setSelectedCheckInApt(null)}
        appointment={selectedCheckInApt}
        onCheckInSuccess={handleCheckInSuccess}
        showToast={showToast}
      />

      {/* Walk-in booking + patient record modal (extracted — M1 Phase 1) */}
      <WalkInBookingModal {...walkInBooking} />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={'fixed bottom-6 left-1/2 z-[110] p-4 rounded-2xl shadow-xl backdrop-blur-xl flex items-center gap-3 border ' + (toast.type === 'success' ? 'bg-emerald-600/90 border-emerald-500 text-white' : toast.type === 'info' ? 'bg-sky-600/90 border-sky-500 text-white' : 'bg-rose-600/90 border-rose-500 text-white')}
            style={{ transform: 'translateX(-50%)' }}
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              {toast.type === 'success' ? <CheckSquare className="w-3.5 h-3.5" /> : toast.type === 'info' ? <Sparkles className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            </div>
            <p className="text-xs font-bold whitespace-nowrap">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
