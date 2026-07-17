import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassSelect from '../components/common/GlassSelect';
import { NotificationModel } from '../models/NotificationModel';
import { DoctorModel } from '../models/DoctorModel';
import { AppointmentModel } from '../models/AppointmentModel';
import { MedicalRecordModel } from '../models/MedicalRecordModel';
import { PrescriptionModel } from '../models/PrescriptionModel';
import { ServiceTicketModel } from '../models/ServiceTicketModel';
import { supabase } from '../supabaseClient';
import ClinicEmailService from '../services/EmailService';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Calendar, Star, History, Bell, CheckCircle2 } from 'lucide-react';
import DashboardShell from '../components/ui/DashboardShell';
import DashboardOverview from '../components/Doctor/DashboardOverview';
import ScheduleWaitingList from '../components/Doctor/ScheduleWaitingList';
import WorkSchedule from '../components/Doctor/WorkSchedule';
import VirtualClinicWorkspace from '../components/Doctor/VirtualClinic/VirtualClinicWorkspace';
import MedicalRecordHistory from '../components/Doctor/MedicalRecordHistory';
import DoctorFeedbackView from '../components/Doctor/DoctorFeedbackView';

export default function DoctorDashboard() {
  const { user } = useAuth();

  // State-based routing
  const [currentDoctorId, setCurrentDoctorId] = useState(user?.id || '');
  const doctorId = currentDoctorId;
  const [activeTab, setActiveTab] = useState('overview');
  const [globalSearch, setGlobalSearch] = useState('');
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
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
      // updateStatus swallows DB/RLS errors and returns null, so a dropped write
      // would otherwise still reach the success toast while the front desk never
      // sees the patient move to "Chờ thanh toán". Fail loudly instead.
      const statusUpdated = await AppointmentModel.updateStatus(appointmentId, 'Đã khám');
      if (!statusUpdated) {
        throw new Error(`Không thể cập nhật trạng thái lịch hẹn #${appointmentId} sang 'Đã khám'.`);
      }

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
      // Draft is preserved in localStorage so the doctor can resume the exam when the patient returns
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

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'waiting_list', label: 'Hàng chờ & Lịch khám', icon: Users },
    { id: 'schedule', label: 'Lịch làm việc', icon: Calendar },
    { id: 'history', label: 'Lịch sử khám', icon: History },
    { id: 'feedback', label: 'Đánh giá', icon: Star },
  ];

  const headerExtras = (
    <>
      {!user?.isSupabase && (
        <div className="hidden md:flex flex-col items-end gap-0.5 mr-1">
          <GlassSelect
            value={String(currentDoctorId ?? '')}
            onChange={(v) => setCurrentDoctorId(v)}
            options={(Array.isArray(doctorsList) ? doctorsList : []).map((d) => ({ value: String(d.id), label: d.name }))}
            buttonClassName="px-3 py-1.5 text-sm font-bold"
            className="min-w-[200px]"
          />
          <span className="text-[9px] text-emerald-600/70 font-bold uppercase tracking-widest">Doctor Portal — Demo</span>
        </div>
      )}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="hover:bg-white/70 hover:text-teal-600 transition-all p-2.5 rounded-full relative active:scale-95 border-none cursor-pointer bg-transparent flex items-center justify-center text-slate-500"
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
              className="absolute right-0 mt-2 w-80 bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07),inset_0_0_20px_rgba(255,255,255,0.5)] rounded-2xl p-4 z-50 max-h-[350px] overflow-y-auto"
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
                      onClick={() => { NotificationModel.markAsRead(notif.id); }}
                      className={"p-2.5 rounded-xl transition-all border cursor-pointer text-left " + (notif.isRead ? 'bg-transparent border-slate-100 hover:bg-slate-50' : 'bg-teal-50/50 border-teal-100/50 hover:bg-teal-50')}
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
    </>
  );

  return (
    <>
      <DashboardShell
        portalName="Doctor Portal"
        navItems={navItems}
        activeTab={activeAppointment ? '' : activeTab}
        customKey={activeAppointment ? `exam-${activeAppointment.id}` : `tab-${activeTab}`}
        onTabChange={(id) => { setActiveTab(id); setActiveAppointment(null); }}
        pageTitle={getPageTitle()}
        showSearch={false}
        headerExtras={headerExtras}
      >
        {activeAppointment ? (
          <VirtualClinicWorkspace
            appointment={activeAppointment}
            onBack={() => setActiveAppointment(null)}
            handleCompleteExamination={handleCompleteExamination}
            handleSendIndications={handleSendIndications}
          />
        ) : (
          <>
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
                onReviewRecord={(apt) => { setActiveAppointment(apt); }}
              />
            )}
            {activeTab === 'feedback' && <DoctorFeedbackView doctorId={currentDoctorId} />}
          </>
        )}
      </DashboardShell>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={"fixed bottom-8 right-8 z-50 flex items-center gap-3 backdrop-blur-2xl text-white px-6 py-4 rounded-2xl shadow-lg border " + (toast.type === 'error' ? 'bg-rose-500/90 shadow-rose-500/20 border-rose-400/50' : 'bg-emerald-500/90 shadow-emerald-500/20 border-emerald-400/50')}
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span className="font-bold text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
