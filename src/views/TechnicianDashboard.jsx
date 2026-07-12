import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ServiceTicketModel } from '../models/ServiceTicketModel';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ClipboardList, Calendar, Star, CheckCircle2, AlertTriangle } from 'lucide-react';
import DashboardShell from '../components/ui/DashboardShell';
import TechnicianOverview from '../components/Technician/Overview/TechnicianOverview';
import AssignedTasksList from '../components/Technician/AssignedTasks/AssignedTasksList';
import TechnicianSchedule from '../components/Technician/WorkSchedule/TechnicianSchedule';
import TechnicianWorkspace from '../components/Technician/ProcedureWorkspace/TechnicianWorkspace';
import TechnicianResultReview from '../components/Technician/ProcedureWorkspace/TechnicianResultReview';
import TechnicianFeedbackView from '../components/Technician/TechnicianFeedbackView';

export default function TechnicianDashboard() {
  const { user } = useAuth();

  /* ───────── state ───────── */
  const [activeTab, setActiveTab] = useState('overview');
  const [activeTask, setActiveTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  // Toast now carries a message + type so claim conflicts / failures surface to
  // the technician (previously a fixed success-only banner).
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }
  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const calculateAge = (dob) => {
    if (!dob) return '—';
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? `${age} tuổi` : '—';
  };

  // PHASE 3 — Doctor → Technician read path. Map a service_ticket row into the
  // task shape the workspace/list components already consume.
  const mapTicket = (t) => {
    // Hydrate the structured result captured at completion. result_metrics /
    // result_images are JSONB (2026-06-24 migration); fall back to the legacy
    // single result_image_url for tickets completed before the migration.
    const ticketMetrics =
      t.result_metrics && typeof t.result_metrics === 'object' ? t.result_metrics : {};
    const ticketImages =
      Array.isArray(t.result_images) && t.result_images.length > 0
        ? t.result_images
        : t.result_image_url
        ? [{ id: 'res-0', url: t.result_image_url, name: 'result.jpg' }]
        : [];
    // The lab-metric grid renders off procedureDetails.metrics. No config column
    // exists, so recover the metric names from the saved keys (excluding the
    // free-text fallback) — this is what makes renderLabTestMetrics fire in review.
    const metricKeys = Object.keys(ticketMetrics).filter((k) => k !== 'fallbackResult');

    // Prefer the doctor-specified config (procedure_details, 2026-06-24 migration)
    // so the metric-entry grid renders during ACTIVE work — not just review. Fall
    // back to keys recovered from saved values for tickets created pre-migration.
    const procedureDetails =
      t.procedure_details && typeof t.procedure_details === 'object'
        ? t.procedure_details
        : metricKeys.length > 0
        ? { type: 'LabTest', metrics: metricKeys }
        : undefined;

    return {
      id: t.id,
      appointmentId: t.appointment_id,
      patientId: t.appointment?.patient_id || null,
      patientName: t.appointment?.patient_name || 'Bệnh nhân',
      patientGender: t.appointment?.patient_gender || '—',
      patientAge: calculateAge(t.appointment?.patient_dob),
      assignedBy: t.appointment?.doctor_name || 'Bác sĩ',
      notes: t.doctor_note || '',
      doctorNotes: t.doctor_note || '',
      procedureType: t.service_name,
      procedure: t.service_name,
      service: t.service_name,
      // Doctor-specified metric config (or recovered from saved values) so both
      // active entry and review route to the lab grid instead of the fallback
      // textarea. Omitted when none (imaging / free-text keep name-based detection).
      procedureDetails,
      status:
        t.status === 'TECH_COMPLETED'
          ? 'Đã hoàn thành'
          : t.status === 'IN_PROGRESS'
          ? 'Đang tiến hành'
          : 'Chờ thực hiện',
      technicianId: t.technician_id || null,
      createdAt: t.created_at,
      requestTime: t.created_at,
      resultRecord:
        t.status === 'TECH_COMPLETED'
          ? {
              technicianNotes: t.result_notes || '',
              images: ticketImages,
              metrics: ticketMetrics,
              // Single-procedure-per-ticket model → resultsMap index 0 feeds the
              // Step 2 confirmation summary in TechnicianWorkspace.
              resultsMap: {
                0: {
                  images: ticketImages,
                  metrics: ticketMetrics,
                  technicianNotes: t.result_notes || '',
                },
              },
            }
          : null,
    };
  };

  const loadTasks = useCallback(async () => {
    try {
      const tickets = await ServiceTicketModel.getActiveTickets();
      setTasks((Array.isArray(tickets) ? tickets : []).map(mapTicket));
    } catch (err) {
      console.error('Failed to load technician tasks:', err);
      setTasks([]);
    }
  }, []);

  // Initial load + Supabase Realtime (replaces the old 5s poll). Refetch the
  // active queue whenever a service_ticket is INSERTed (doctor routes a new
  // indication), UPDATEd (a technician claims/completes one), or DELETEd — so
  // the list reflects another technician's claim the instant it happens.
  useEffect(() => {
    loadTasks();
    const channel = supabase
      .channel('technician-service-tickets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_tickets' },
        () => { loadTasks(); }
      )
      .subscribe();
    // CRITICAL: tear the channel down on unmount so we don't leak subscriptions.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadTasks]);

  /* ───────── dynamic page title ───────── */
  const getPageTitle = () => {
    if (activeTask) {
      return `Phòng Kỹ thuật: ${activeTask.patientName}`;
    }
    const tabNames = {
      overview: 'Tổng quan',
      tasks: 'Danh sách Chỉ định',
      schedule: 'Lịch làm việc',
      feedback: 'Đánh giá',
    };
    return tabNames[activeTab] || 'Tổng quan';
  };

  /* ───────── nav items ───────── */
  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'tasks', label: 'Danh sách Chỉ định', icon: ClipboardList },
    { id: 'schedule', label: 'Lịch làm việc', icon: Calendar },
    { id: 'feedback', label: 'Đánh giá', icon: Star },
  ];

  /* ───────── handlers ───────── */
  // PHASE 3 — Technician result feedback loop. Persist the completion to the
  // service_tickets row so the Doctor's workspace can read tech notes/images.
  const handleCompleteTask = async (taskId, resultRecord) => {
    try {
      // Lifecycle: IN_PROGRESS → TECH_COMPLETED, attaching the technician's result.
      await ServiceTicketModel.update(taskId, {
        status: 'TECH_COMPLETED',
        result_notes: resultRecord?.technicianNotes || '',
        // Keep the legacy single-URL column populated for back-compat readers
        // (Doctor ClinicalHistory / AISkinAnalysis still read result_image_url).
        result_image_url: resultRecord?.images?.[0]?.url || null,
        // Persist the full captured result so review mode can rehydrate it.
        result_images: resultRecord?.images || [],
        result_metrics: resultRecord?.metrics || {},
        technician_id: user?.id || null,
        updated_at: new Date().toISOString(),
      });
      await loadTasks();
      setActiveTask(null);
      notify('Kết quả thủ thuật đã được ghi nhận!', 'success');
    } catch (err) {
      console.error('Failed to save technician result:', err);
      // Keep the workspace open so the technician can retry without losing input.
      notify('Lưu kết quả thất bại. Vui lòng thử lại.', 'error');
    }
  };

  // Start (claim) a PENDING ticket, or resume one this technician already owns.
  // Only PENDING tickets can be picked up; an IN_PROGRESS ticket is openable only
  // by its owner — everyone else is told it's being handled elsewhere.
  const handleStartTask = async (task) => {
    if (task.status === 'Đang tiến hành') {
      if (String(task.technicianId ?? '') !== String(user?.id ?? '')) {
        notify('Chỉ định này đang được kỹ thuật viên khác xử lý.', 'error');
        return;
      }
      setActiveTask(task);
      return;
    }
    try {
      const claimed = await ServiceTicketModel.claim(task.id, user?.id);
      if (!claimed) {
        // Lost the race — another technician claimed it first.
        notify('Chỉ định này vừa được kỹ thuật viên khác nhận.', 'error');
        await loadTasks();
        return;
      }
      await loadTasks();
      setActiveTask({ ...task, status: 'Đang tiến hành', technicianId: user?.id });
    } catch (err) {
      console.error('Failed to claim service ticket:', err);
      notify('Không thể nhận chỉ định lúc này. Vui lòng thử lại.', 'error');
    }
  };

  const handleReviewTask = (task) => {
    setActiveTask(task);
  };

  /* ───────── content renderer ───────── */
  const renderContent = () => {
    if (activeTask) {
      if (activeTask.status === 'Đã hoàn thành') {
        // Completed tickets are READ-ONLY → use the liquid-glass review view that
        // matches the dashboard baseline, not the data-entry stepper workspace.
        return (
          <TechnicianResultReview
            task={activeTask}
            onBack={() => setActiveTask(null)}
          />
        );
      }
      return (
        <TechnicianWorkspace
          task={activeTask}
          onBack={() => setActiveTask(null)}
          onComplete={handleCompleteTask}
          isReviewMode={false}
        />
      );
    }

    switch (activeTab) {
      case 'overview':
        return <TechnicianOverview tasks={tasks} />;
      case 'tasks':
        return (
          <AssignedTasksList
            tasks={tasks}
            currentTechId={user?.id}
            onExecuteTask={handleStartTask}
            onReviewTask={handleReviewTask}
          />
        );
      case 'schedule':
        return <TechnicianSchedule />;
      case 'feedback':
        return <TechnicianFeedbackView />;
      default:
        return <TechnicianOverview tasks={tasks} />;
    }
  };

  return (
    <>
      <DashboardShell
        portalName="Technician Portal"
        navItems={navItems}
        activeTab={activeTask ? '' : activeTab}
        onTabChange={(id) => { setActiveTab(id); setActiveTask(null); }}
        pageTitle={getPageTitle()}
        searchPlaceholder="Tìm kiếm chỉ định, bệnh nhân..."
      >
        {renderContent()}
      </DashboardShell>

      {/* Toast — sits above the shell chrome */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl text-white shadow-2xl ${
              toast.type === 'error'
                ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/30'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/30'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle size={22} className="flex-shrink-0" />
            ) : (
              <CheckCircle2 size={22} className="flex-shrink-0" />
            )}
            <span className="text-sm font-semibold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
