import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppointmentController } from '../controllers/useAppointmentController';
import { useMedicalRecordController } from '../controllers/useMedicalRecordController';
import { AppointmentModel } from '../models/AppointmentModel';
import { MedicalRecordModel } from '../models/MedicalRecordModel';
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
  Hourglass, 
  CheckSquare, 
  DollarSign, 
  ChevronRight, 
  UserPlus,
  User,
  X,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Clock,
  CalendarDays,
  CreditCard,
  Stethoscope,
  Star,
  ClipboardList,
  Activity,
  FileText,
  Printer,
  Heart,
  ChevronDown
} from 'lucide-react';
import { 
  mockAppointments, 
  mockPatients, 
  mockChatMessages, 
  doctors, 
  mockServices, 
  mockTimeSlots 
} from '../mockData';
import LiveChatDrawer from '../components/Receptionist/LiveChatDrawer';
import ReceptionistFeedbackView from '../components/Receptionist/ReceptionistFeedbackView';
import { NotificationModel } from '../models/NotificationModel';
import ReceptionistChatTab from '../components/Receptionist/ReceptionistChatTab';
import { ReceptionistChatModel } from '../models/ChatModel';


const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", damping: 25, stiffness: 100 } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function ReceptionistDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');

  // ─── STATE MANAGEMENT ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview');
  const { 
    appointments, 
    updateAppointmentStatus, 
    addDirectAppointment, 
    approveAppointment, 
    checkinAppointment, 
    bookAppointment, 
    cancelAppointment,
    changeAppointment
  } = useAppointmentController();

  const {
    patients,
    records: medicalRecords,
    addPatient,
    updatePatient,
    addRecord,
    updateRecord,
    validatePatient,
    validateRecord,
    getPatientRecords,
    searchPatients,
    getPatientAge
  } = useMedicalRecordController();

  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false);
  const [editPatientData, setEditPatientData] = useState({
    id: '',
    fullName: '',
    phone: '',
    dob: '',
    gender: 'Nam',
    email: '',
    address: '',
    medicalHistory: [],
    guardianName: '',
    guardianPhone: '',
    guardianRelation: 'Mẹ'
  });
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [editRecordId, setEditRecordId] = useState(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [createdRecord, setCreatedRecord] = useState(null);

  // Queue Management States
  const [queueTab, setQueueTab] = useState('waiting');
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [reassignAptId, setReassignAptId] = useState(null);
  const [selectedDocId, setSelectedDocId] = useState('');

  // Patient Check-in & Vitals States
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [checkinApt, setCheckinApt] = useState(null);
  const [checkinVitals, setCheckinVitals] = useState({
    weight: '',
    height: '',
    bloodPressure: '',
    pulse: '',
    temperature: '',
    spo2: '',
    symptoms: '',
    doctorId: '',
    clinicRoom: 'Phòng khám 101'
  });

  const [regPatient, setRegPatient] = useState({
    fullName: '',
    phone: '',
    dob: '',
    gender: 'Nam',
    email: '',
    address: '',
    medicalHistory: [],
    guardianName: '',
    guardianPhone: '',
    guardianRelation: 'Mẹ'
  });

  const [newRecordData, setNewRecordData] = useState({
    doctorId: 'doc-01',
    serviceName: 'Khám Da Liễu Tổng Quát',
    symptoms: '',
    notes: '',
    vitalSigns: {
      weight: '',
      height: '',
      bloodPressure: '',
      pulse: '',
      temperature: '',
      spo2: ''
    }
  });

  const PRE_DEFINED_HISTORY = [
    'Dị ứng thuốc',
    'Cao huyết áp',
    'Tiểu đường',
    'Đang mang thai',
    'Đang cho con bú',
    'Dị ứng mỹ phẩm',
    'Viêm da cơ địa'
  ];

  const [chatMessages, setChatMessages] = useState([]);
  const [toast, setToast] = useState(null);

  // Poll receptionist messages from ReceptionistChatModel to keep state synchronized
  useEffect(() => {
    const fetchMsgs = () => {
      const msgs = ReceptionistChatModel.getAllMessages();
      setChatMessages(msgs);
    };
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 2000);
    return () => clearInterval(interval);
  }, []);
  
  const [notifications, setNotifications] = useState(() => NotificationModel.getAll());
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setNotifications(NotificationModel.getAll());
    };
    window.addEventListener('notifications-updated', handleUpdate);
    return () => window.removeEventListener('notifications-updated', handleUpdate);
  }, []);

  const receptionistId = user?.id || 'staff-01';
  const myNotifications = notifications.filter(n => 
    n.recipientRole === 'RECEPTIONIST' && (n.recipientId === receptionistId || n.recipientId === 'all')
  );
  const unreadCount = myNotifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    NotificationModel.markAllAsRead('RECEPTIONIST', receptionistId);
  };

  // Manual Appointment Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newApt, setNewApt] = useState({
    patientName: '',
    phone: '',
    date: '2026-06-01',
    time: '09:00',
    service: 'Khám Da Liễu Tổng Quát',
    doctorName: 'BS. CKII. Trần Văn A',
    notes: ''
  });

  // Chat Drawer State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatPatient, setActiveChatPatient] = useState(null);
  
  const [servicesList, setServicesList] = useState([]);

  useEffect(() => {
    if (isAddOpen) {
      const saved = localStorage.getItem('admin-services');
      if (saved) {
        const parsed = JSON.parse(saved).map(s => ({
          id: s.id,
          name: s.name,
          price: typeof s.price === 'number' ? `${s.price.toLocaleString('vi-VN')} VNĐ` : s.price,
          description: s.description,
          status: s.status
        })).filter(s => s.status === 'Hoạt động');
        setServicesList(parsed);
        if (parsed.length > 0 && !parsed.some(s => s.name === newApt.service)) {
          setNewApt(prev => ({ ...prev, service: parsed[0].name }));
        }
      } else {
        setServicesList(mockServices);
      }
    }
  }, [isAddOpen]);

  // ─── INITIALIZATION (Adjust Dates to Coordinate with Today's Date) ───────
  const todayStr = "2026-06-01"; // Timeline current date

  const handleScroll = (e) => {
    if (e.target.scrollTop > 10) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  // ─── TOAST NOTIFICATION ─────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // ─── DYNAMIC STATISTICS CALCULATIONS ────────────────────────────────────
  // "Bệnh nhân đang chờ" (Đã xác nhận but not checked in yet)
  const waitingCount = (appointments || []).filter(a => a.status === 'Đã xác nhận').length;
  
  // "Lịch hẹn hôm nay" (Total non-cancelled appointments)
  const todayAppointmentsCount = (appointments || []).filter(a => a.status !== 'Đã hủy').length;
  
  // "Thanh toán chờ xử lý" (Chờ xác nhận appointments)
  const pendingPaymentsCount = (appointments || []).filter(a => a.status === 'Chờ xác nhận').length;

  // ─── INTERACTIVE ACTIONS ────────────────────────────────────────────────
  
  // 1. Check-in Button Action (Launches Vitals & Room Check-in Modal)
  const handleCheckIn = (apt) => {
    setCheckinApt(apt);
    setCheckinVitals({
      weight: '',
      height: '',
      bloodPressure: '',
      pulse: '',
      temperature: '',
      spo2: '',
      symptoms: apt.reason || 'Khám da liễu tổng quát',
      doctorId: apt.doctor_id || (doctors[0] ? doctors[0].id : ''),
      clinicRoom: 'Phòng khám 101'
    });
    setIsCheckinModalOpen(true);
  };

  const handleCheckinSubmit = (e) => {
    e.preventDefault();
    if (!checkinApt) return;

    // Validate vitals using the Medical Record validation rules
    const validationPayload = {
      symptoms: checkinVitals.symptoms || 'Khám da liễu tổng quát',
      vitalSigns: {
        weight: checkinVitals.weight,
        height: checkinVitals.height,
        bloodPressure: checkinVitals.bloodPressure,
        pulse: checkinVitals.pulse,
        temperature: checkinVitals.temperature,
        spo2: checkinVitals.spo2
      }
    };

    const validation = validateRecord(validationPayload);
    if (!validation.valid) {
      showToast(validation.error, 'error');
      return;
    }

    // Get assigned doctor info
    const doctor = doctors.find(d => d.id === checkinVitals.doctorId) || {
      name: checkinApt.doctor_name || 'BS. CKII. Trần Văn A',
      title: 'Giám đốc chuyên môn'
    };

    try {
      // Create new medical record with vitals
      const record = addRecord({
        appointmentId: checkinApt.appointment_id,
        patientId: checkinApt.patient_id,
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialty: doctor.title || 'Da liễu thẩm mỹ',
        serviceName: checkinApt.service_name || 'Khám Da Liễu Tổng Quát',
        symptoms: checkinVitals.symptoms.trim() || 'Khám da liễu tổng quát',
        notes: `Tiếp nhận tại quầy. Phòng chỉ định: ${checkinVitals.clinicRoom}.`,
        vitalSigns: {
          weight: checkinVitals.weight,
          height: checkinVitals.height,
          bloodPressure: checkinVitals.bloodPressure,
          pulse: checkinVitals.pulse,
          temperature: checkinVitals.temperature,
          spo2: checkinVitals.spo2
        },
        fee: checkinApt.fee || '300,000 VNĐ'
      });

      // Update appointment: check in, set room & doctor
      changeAppointment(checkinApt.appointment_id, {
        status: 'Đang chờ',
        checkin_time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        queue_index: Date.now(),
        doctor_id: doctor.id,
        doctor_name: doctor.name,
        doctor_title: doctor.title,
        doctor_image: doctor.image,
        clinic_room: checkinVitals.clinicRoom
      });

      // Notify the Doctor
      NotificationModel.sendNotification(
        'DOCTOR',
        doctor.id,
        'Bệnh nhân mới check-in',
        `Bệnh nhân ${checkinApt.patient_name} đã được kiểm tra sinh hiệu tại quầy lễ tân và xếp vào hàng chờ khám của bạn.`
      );

      setCreatedRecord(record);
      setIsCheckinModalOpen(false);
      setIsTicketOpen(true);
      showToast(`Check-in thành công cho bệnh nhân ${checkinApt.patient_name}!`, 'success');
    } catch (error) {
      showToast(error.message || 'Lỗi khi check-in.', 'error');
    }
  };

  // 2. Approve Button Action
  const handleApprove = (aptId, patientName) => {
    approveAppointment(aptId, 'rec-01');

    showToast(`Đã phê duyệt lịch hẹn khám của ${patientName}!`, 'success');
  };

  // 3. Reject/Cancel Button Action
  const handleReject = (aptId, patientName) => {
    cancelAppointment(aptId);

    showToast(`Đã từ chối/hủy lịch hẹn khám của ${patientName}.`, 'error');
  };

  // ─── QUEUE MANAGEMENT ACTIONS ──────────────────────────────────────────
  
  // Toggle priority status
  const togglePriority = (aptId) => {
    const apt = appointments.find(a => a.appointment_id === aptId);
    if (!apt) return;
    const isPriority = !apt.priority;
    changeAppointment(aptId, { 
      priority: isPriority,
      queue_index: apt.queue_index || Date.now()
    });
    showToast(
      isPriority 
        ? `Đã ưu tiên bệnh nhân ${apt.patient_name}!` 
        : `Đã hủy ưu tiên bệnh nhân ${apt.patient_name}.`,
      isPriority ? 'success' : 'info'
    );
  };

  // Move patient up in priority section queue
  const handleMoveUp = (aptId) => {
    const list = [...appointments];
    const targetIdx = list.findIndex(a => a.appointment_id === aptId);
    if (targetIdx === -1) return;
    const targetApt = list[targetIdx];

    const todayQueue = list.filter(a => 
      a.status === 'Đang chờ' && 
      a.appointment_date === todayStr &&
      !!a.priority === !!targetApt.priority
    ).sort((a, b) => (a.queue_index || 0) - (b.queue_index || 0));

    const queueIdx = todayQueue.findIndex(a => a.appointment_id === aptId);
    if (queueIdx <= 0) return; 

    const prevAptInQueue = todayQueue[queueIdx - 1];
    
    const tempIndex = targetApt.queue_index || Date.now();
    const prevIndex = prevAptInQueue.queue_index || (Date.now() - 1);
    
    changeAppointment(targetApt.appointment_id, { queue_index: prevIndex });
    changeAppointment(prevAptInQueue.appointment_id, { queue_index: tempIndex });

    showToast('Đã di chuyển bệnh nhân lên phía trước.', 'success');
  };

  // Move patient down in priority section queue
  const handleMoveDown = (aptId) => {
    const list = [...appointments];
    const targetIdx = list.findIndex(a => a.appointment_id === aptId);
    if (targetIdx === -1) return;
    const targetApt = list[targetIdx];

    const todayQueue = list.filter(a => 
      a.status === 'Đang chờ' && 
      a.appointment_date === todayStr &&
      !!a.priority === !!targetApt.priority
    ).sort((a, b) => (a.queue_index || 0) - (b.queue_index || 0));

    const queueIdx = todayQueue.findIndex(a => a.appointment_id === aptId);
    if (queueIdx === -1 || queueIdx >= todayQueue.length - 1) return; 

    const nextAptInQueue = todayQueue[queueIdx + 1];
    
    const tempIndex = targetApt.queue_index || Date.now();
    const nextIndex = nextAptInQueue.queue_index || (Date.now() + 1);
    
    changeAppointment(targetApt.appointment_id, { queue_index: nextIndex });
    changeAppointment(nextAptInQueue.appointment_id, { queue_index: tempIndex });

    showToast('Đã di chuyển bệnh nhân xuống phía sau.', 'success');
  };

  // Cancel check-in (revert status back to Confirmed 'Đã xác nhận')
  const handleCancelCheckin = (aptId) => {
    const apt = appointments.find(a => a.appointment_id === aptId);
    if (!apt) return;

    changeAppointment(aptId, { 
      status: 'Đã xác nhận',
      checkin_time: null,
      priority: false,
      queue_index: null
    });

    const allRecords = MedicalRecordModel.getAll();
    const recordIdx = allRecords.findIndex(r => r.appointmentId === aptId);
    if (recordIdx !== -1) {
      allRecords[recordIdx].status = 'Đã hủy';
      MedicalRecordModel.save(allRecords);
    }

    showToast(`Đã hủy tiếp nhận bệnh nhân ${apt.patient_name}!`, 'info');
  };

  // Handle re-assigning doctor submit
  const handleReassignDoctorSubmit = (e) => {
    e.preventDefault();
    if (!reassignAptId || !selectedDocId) return;

    const doc = doctors.find(d => d.id === selectedDocId);
    if (!doc) return;

    changeAppointment(reassignAptId, {
      doctor_id: doc.id,
      doctor_name: doc.name,
      doctor_title: doc.title,
      doctor_image: doc.image
    });

    const allRecords = MedicalRecordModel.getAll();
    const recordIdx = allRecords.findIndex(r => r.appointmentId === reassignAptId);
    if (recordIdx !== -1) {
      allRecords[recordIdx] = {
        ...allRecords[recordIdx],
        doctorId: doc.id,
        doctorName: doc.name,
        specialty: doc.title || 'Da liễu thẩm mỹ'
      };
      MedicalRecordModel.save(allRecords);
    }

    setIsReassignOpen(false);
    setReassignAptId(null);
    showToast(`Đã chuyển bệnh nhân sang hàng chờ của ${doc.name}!`, 'success');
  };

  // Print queue ticket handler
  const handlePrintQueueTicket = (apt) => {
    const allRecs = MedicalRecordModel.getAll();
    const found = allRecs.find(r => r.appointmentId === apt.appointment_id);
    
    if (found) {
      if (!found.patient) {
        const pat = patients.find(p => p.id === apt.patient_id);
        found.patient = pat || { fullName: apt.patient_name, phone: apt.phone || '', dob: '', gender: '' };
      }
      setCreatedRecord(found);
    } else {
      const pat = patients.find(p => p.id === apt.patient_id);
      const mockRecord = {
        id: `rec-${apt.appointment_id.replace('apt-', '') || 'print'}`,
        appointmentId: apt.appointment_id,
        patientId: apt.patient_id,
        doctorId: apt.doctor_id,
        doctorName: apt.doctor_name,
        service: apt.service_name,
        vitalSigns: { weight: '—', height: '—', temperature: '—', bloodPressure: '—', pulse: '—', spo2: '—' },
        patient: pat || { fullName: apt.patient_name, phone: apt.phone || '', dob: '', gender: '' }
      };
      setCreatedRecord(mockRecord);
    }
    setIsTicketOpen(true);
  };

  const cleanVital = (val) => {
    if (!val) return '';
    return val.replace(/(kg|cm|mmHg|lần\/phút|°C|%|\s)/g, '');
  };

  const handleEditRecordClick = (rec) => {
    setEditRecordId(rec.id);
    setNewRecordData({
      patientId: rec.patientId,
      doctorId: rec.doctorId,
      serviceName: rec.service,
      symptoms: rec.symptoms,
      notes: rec.notes || '',
      vitalSigns: {
        weight: cleanVital(rec.vitalSigns?.weight),
        height: cleanVital(rec.vitalSigns?.height),
        bloodPressure: cleanVital(rec.vitalSigns?.bloodPressure),
        pulse: cleanVital(rec.vitalSigns?.pulse),
        temperature: cleanVital(rec.vitalSigns?.temperature),
        spo2: cleanVital(rec.vitalSigns?.spo2),
      }
    });
    setIsAddRecordOpen(true);
  };

  const closeRecordModal = () => {
    setIsAddRecordOpen(false);
    setEditRecordId(null);
  };

  // 4. Manual Appointment Creation Submission
  const handleAddApt = (e) => {
    e.preventDefault();
    if (!newApt.patientName.trim() || !newApt.phone.trim()) {
      showToast("Vui lòng điền đầy đủ họ tên và số điện thoại!", "error");
      return;
    }

    const doctor = doctors.find(d => d.name === newApt.doctorName) || doctors[0];
    const cleanPhone = newApt.phone.replace(/[\s.-]/g, '');
    let targetPatient = (patients || []).find(p => p.phone.replace(/[\s.-]/g, '') === cleanPhone);
    let patientId;

    if (!targetPatient) {
      try {
        const created = addPatient({
          fullName: newApt.patientName,
          phone: newApt.phone,
          dob: '1990-01-01', // Default DOB
          address: 'Chưa cập nhật',
          medicalHistory: []
        });
        patientId = created.id;
      } catch (err) {
        showToast(err.message || 'Lỗi khi tạo hồ sơ bệnh nhân', 'error');
        return;
      }
    } else {
      patientId = targetPatient.id;
    }

    // Create a new appointment
    const payload = {
      patient_id: patientId,
      patient_name: newApt.patientName,
      doctor_id: doctor.id,
      doctor_name: doctor.name,
      doctor_title: doctor.title,
      doctor_image: doctor.image,
      service_id: 'srv-01',
      service_name: newApt.service,
      slot_id: 'slot-01',
      appointment_date: newApt.date,
      start_time: newApt.time,
      end_time: '10:00',
      reason: newApt.notes,
      status: 'Đã xác nhận' // Directly confirmed/paid
    };

    try {
      bookAppointment(payload);
      setIsAddOpen(false);
      
      // Reset Form
      setNewApt({
        patientName: '',
        phone: '',
        date: '2026-06-01',
        time: '09:00',
        service: 'Khám Da Liễu Tổng Quát',
        doctorName: 'BS. CKII. Trần Văn A',
        notes: ''
      });

      showToast(`Đã tạo lịch khám trực tiếp cho ${newApt.patientName}!`, 'success');
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra', 'error');
    }
  };

  // 5. Open Live Chat for a Patient
  const handleOpenChat = (patientId, patientName) => {
    let targetPatient = (patients || []).find(p => p.id === patientId);
    if (!targetPatient) {
      // Create fallback if not fully defined
      targetPatient = {
        id: patientId,
        fullName: patientName,
        phone: 'Chưa có',
        email: 'Chưa có',
        avatar: `https://i.pravatar.cc/150?u=${patientId}`,
        medicalHistory: []
      };
    }
    setActiveChatPatient(targetPatient);
    setIsChatOpen(true);
  };

  // 6. Handle sending message from receptionist
  const handleSendMessage = (patientId, text) => {
    const newMsg = ReceptionistChatModel.addMessage({
      senderId: 'staff-01', // Receptionist ID
      senderName: 'Lễ tân Hoàng Anh',
      senderRole: 'RECEPTIONIST',
      text: text,
      mode: 'Live',
      patientId: patientId
    });
    
    setChatMessages(prev => [...prev, newMsg]);
  };

  // ─── FILTER DATA BASED ON SEARCH ────────────────────────────────────────
  // Today's waiting list (status: 'Đã xác nhận', 'Đang chờ', or 'Đã khám')
  const todayAppointments = (appointments || []).filter(a => 
    a.status === 'Đã xác nhận' || a.status === 'Đang chờ' || a.status === 'Đã khám'
  );

  const filteredWaiting = (todayAppointments || []).filter(a => 
    a.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.service_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pending booking requests (status: 'Chờ xác nhận')
  const bookingRequests = (appointments || []).filter(a => a.status === 'Chờ xác nhận');
  
  const filteredRequests = (bookingRequests || []).filter(a => 
    a.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.service_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const bmiCategory = (bmi) => {
    if (!bmi) return null;
    const val = parseFloat(bmi);
    if (val < 18.5) return { text: 'Thiếu cân (Underweight)', color: 'text-sky-600 bg-sky-50' };
    if (val < 25.0) return { text: 'Bình thường (Normal)', color: 'text-emerald-600 bg-emerald-50' };
    if (val < 30.0) return { text: 'Thừa cân (Overweight)', color: 'text-amber-600 bg-amber-50' };
    return { text: 'Béo phì (Obese)', color: 'text-rose-600 bg-rose-50' };
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
            <button 
              onClick={() => setIsAddOpen(true)}
              className="w-full bg-gradient-to-r from-teal-600 to-sky-600 text-white py-3 px-4 rounded-xl font-semibold shadow-md shadow-teal-600/10 hover:shadow-lg hover:shadow-teal-600/20 active:scale-95 transition-all flex justify-center items-center gap-2 text-sm border-none cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Đặt lịch hẹn
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
              { id: 'waiting_list', label: 'Danh sách Hàng chờ', icon: Users },
              { id: 'medical_records', label: 'Hồ sơ bệnh án', icon: ClipboardList },
              { id: 'appointments', label: 'Quản lý Lịch hẹn', icon: CalendarDays },
              { id: 'payments', label: 'Thanh toán & Hóa đơn', icon: CreditCard },
              { id: 'doctor_schedules', label: 'Lịch Bác sĩ', icon: Stethoscope },
              { id: 'feedback', label: 'Đánh giá bệnh nhân', icon: Star },
              { id: 'chat', label: 'Trò chuyện & Hỗ trợ', icon: MessageSquare },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all border-none cursor-pointer bg-transparent text-left ${
                  activeTab === tab.id
                    ? 'font-bold bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100/50'
                    : 'text-slate-500 hover:text-teal-600 hover:bg-slate-100'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 pt-4 space-y-1">
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50/40 transition-all border-none cursor-pointer bg-transparent align-middle text-left"
          >
            <User className="w-5 h-5 text-slate-400" />
            <span className="text-sm">Hồ sơ cá nhân</span>
          </button>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50/40 transition-all">
            <HelpCircle className="w-5 h-5 text-slate-400" />
            <span className="text-sm">Hỗ trợ kỹ thuật</span>
          </a>
          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50/40 transition-all border-none cursor-pointer bg-transparent align-middle text-left"
          >
            <LogOut className="w-5 h-5 text-slate-400" />
            <span className="text-sm">Đăng xuất</span>
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
          style={{ position: 'sticky', zIndex: 40, margin: '0 auto', left: 0, right: 0 }}
          className="backdrop-blur-xl flex justify-between items-center w-full px-8 h-20"
        >
          <div className="flex items-center gap-4">
            <span className="font-extrabold text-xl text-teal-600 md:hidden tracking-tight">DermaSmart</span>
            <div className="hidden md:flex items-center bg-white/60 border border-slate-200/50 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all shadow-sm">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                className="bg-transparent border-none outline-none text-sm placeholder-slate-400 w-64 p-0 focus:ring-0"
                placeholder="Tìm kiếm bệnh nhân..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="bg-transparent border-none cursor-pointer p-0.5 rounded-full hover:bg-slate-200/60 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="font-semibold text-xs text-teal-700 py-1 px-3 bg-teal-50 border border-teal-200/30 rounded-full">
              Cổng lễ tân
            </span>
            <div className="flex items-center gap-3 text-slate-500">
              <button 
                onClick={() => handleOpenChat('pat-01', 'Lê Minh Khôi')}
                className="hover:bg-slate-100 hover:text-teal-600 transition-all p-2 rounded-full relative active:scale-95 border-none cursor-pointer bg-transparent flex items-center justify-center"
                title="Mở Kênh Trò Chuyện Trực Tiếp"
              >
                <MessageSquare className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="hover:bg-slate-100 hover:text-teal-600 transition-all p-2 rounded-full relative active:scale-95 border-none cursor-pointer bg-transparent flex items-center justify-center"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
                  )}
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 z-50 max-h-[350px] overflow-y-auto"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                        <span className="text-sm font-extrabold text-slate-800">Thông báo của bạn</span>
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
                          myNotifications.map((notif) => (
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
                              <span className="text-[8px] text-slate-400 block mt-1.5">{new Date(notif.timestamp).toLocaleString('vi-VN')}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button className="hover:bg-slate-100 hover:text-teal-600 transition-all p-2 rounded-full active:scale-95 border-none cursor-pointer bg-transparent flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </button>
              <button className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 active:scale-95 transition-transform cursor-pointer border-none p-0">
                <img
                  alt="User Profile"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-M2BqQXPDoBCWJkM6Fd79cimImp2GcimZMOlz2hyxwTH4bQ8vpMqVC_RIXoL2gAQqWt-OWMeEUU7YiJjTYdrKJ6XsjhktqmEjjycsJnakxWx_WlOKVxXcDhdC1jsooRwJbR1GBzC3hvEXnYhVvwZVOThox8jAo1EtiX6UhXkt9_AzZQuaNOIK89GbYNWX7HblAuBxdx77DsQ0O6pidqIO0QfLOZipt9s6XBnKNn_qc7Ii5Gu8kjJ1_lut2j9_FojRaUOzDBewe09P"
                />
              </button>
            </div>
          </div>
        </motion.header>

        {/* Dashboard Content */}
        <main className="p-8 space-y-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
          {/* Welcome header */}
          <motion.div className="flex flex-col gap-1" variants={fadeInUp}>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight">
                Chào buổi sáng, {user?.name || 'Lễ tân'}
              </h2>
              <span className="text-xl">👋</span>
            </div>
            <p className="text-sm text-slate-500 font-medium">Hôm nay là Thứ Hai, 1 Tháng 6, 2026</p>
          </motion.div>

          {/* Quick Stats Bento Grid (Dynamic stats calculated from local state) */}
          <motion.section className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={fadeInUp}>
            
            {/* Stat 1: Waiting - Checked in but not completed */}
            <div 
              onClick={() => { setActiveTab('waiting_list'); setQueueTab('waiting'); }}
              className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer hover:border-sky-500/30 hover:shadow-sky-500/5"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-sky-500/5 rounded-full blur-xl group-hover:bg-sky-500/10 transition-all"></div>
              <div className="flex justify-between items-start mb-4">
                {waitingCount > 0 && (
                  <span className="bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full text-xs font-bold border border-sky-200/20 animate-pulse">
                    Đang chờ khám
                  </span>
                )}
              </div>
              <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Bệnh nhân đang chờ</h3>
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-4xl text-slate-900">{waitingCount}</span>
                <span className="text-xs text-slate-400 font-medium">người</span>
              </div>
            </div>

            {/* Stat 2: Today's Appointments */}
            <div 
              onClick={() => setActiveTab('appointments')}
              className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer hover:border-emerald-500/30 hover:shadow-emerald-500/5"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100 shadow-inner">
                  <CheckSquare className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Lịch hẹn hôm nay</h3>
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-4xl text-slate-900">{todayAppointmentsCount}</span>
                <span className="text-xs text-slate-400 font-medium">ca khám</span>
              </div>
              <div className="mt-4 w-full bg-slate-200/50 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, ((appointments || []).filter(a => a.status === 'Completed').length / (todayAppointmentsCount || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Stat 3: Pending Payments */}
            <div 
              onClick={() => setActiveTab('payments')}
              className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer hover:border-rose-500/30 hover:shadow-rose-500/5"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-rose-50 rounded-xl text-rose-600 border border-rose-100 shadow-inner">
                  <DollarSign className="w-6 h-6" />
                </div>
                {pendingPaymentsCount > 0 && (
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
                )}
              </div>
              <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Thanh toán chờ xử lý</h3>
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-4xl text-slate-900">{pendingPaymentsCount}</span>
                <span className="text-xs text-slate-400 font-medium">hồ sơ</span>
              </div>
            </div>
          </motion.section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Column 1: Waiting List ("Danh sách hàng chờ") */}
            <motion.div className="lg:col-span-2 space-y-4" variants={fadeInUp}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xl text-slate-900">Danh sách hàng chờ hôm nay</h3>
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100/50">
                    Khung giờ khám
                  </span>
                </div>
                {filteredWaiting.length > 0 && (
                  <span className="text-xs text-slate-400 font-semibold">
                    Hiển thị {filteredWaiting.length} lịch khám
                  </span>
                )}
              </div>

              <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden flex flex-col">
                {filteredWaiting.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-slate-100 border border-slate-200/50 rounded-2xl flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                      <Hourglass className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-700 text-sm">Hàng chờ trống</h4>
                    <p className="text-xs text-slate-400 font-medium max-w-sm mt-1">
                      {searchTerm ? 'Không tìm thấy bệnh nhân nào khớp với từ khóa tìm kiếm.' : 'Không có lịch hẹn khám nào đã xác nhận cho hôm nay.'}
                    </p>
                  </div>
                ) : (
                  (filteredWaiting || []).map((apt, index) => {
                    const isCheckedIn = apt.status === 'Đang chờ' || apt.status === 'Đã khám';
                    
                    return (
                      <div 
                        key={apt.appointment_id}
                        className={`p-5 border-b border-slate-200/40 hover:bg-white/60 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isCheckedIn ? 'opacity-85' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border relative transition-all ${
                            isCheckedIn 
                              ? 'bg-slate-100 text-slate-500 border-slate-200' 
                              : 'bg-gradient-to-tr from-sky-50 to-teal-50 text-teal-700 border-sky-100 shadow-sm'
                          }`}>
                            {(apt.patient_name || 'B').charAt(0).toUpperCase()}
                            {!isCheckedIn && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-600 text-white text-[9px] rounded-full flex items-center justify-center border border-white font-extrabold shadow-sm">
                                {index + 1}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className={`font-bold text-sm transition-colors ${isCheckedIn ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                              {apt.patient_name}
                            </h4>
                            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-bold text-slate-500">{apt.start_time}</span>
                              <span>•</span>
                              <span>{apt.service_name}</span>
                              {apt.doctor_name && (
                                <>
                                  <span>•</span>
                                  <span className="text-teal-600 font-semibold">{apt.doctor_name}</span>
                                </>
                              )}
                            </p>
                            
                            {/* Payment Deposit & Collection Status */}
                            {apt.status === 'Đã xác nhận' && (
                              <div className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/20 font-bold mt-1 inline-block">
                                💳 Đã cọc: 50,000 VNĐ — Thu thêm: <strong className="text-slate-700">{(() => {
                                  const parseFeeStr = (f) => f ? (parseInt(f.replace(/[^0-9]/g, ''), 10) || 500000) : 500000;
                                  const doc = doctors.find(d => d.id === apt.doctor_id);
                                  const feeStr = doc?.consultationFee || '500,000 VNĐ';
                                  const remaining = parseFeeStr(feeStr) - 50000;
                                  return remaining.toLocaleString('vi-VN') + ' VNĐ';
                                })()}</strong> (Tại quầy)
                              </div>
                            )}
                            {(apt.status === 'Đang chờ' || apt.status === 'Đã khám') && (
                              <div className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/20 font-bold mt-1 inline-block">
                                {apt.status === 'Đã khám' ? '✓ Đã khám xong & Đã thu đủ tiền' : '✓ Đã check-in & Đang chờ khám'}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button 
                            onClick={() => handleOpenChat(apt.patient_id, apt.patient_name)}
                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 hover:text-teal-600 transition-colors cursor-pointer bg-white"
                          >
                            Hồ sơ & Chat
                          </button>
                          
                          {isCheckedIn ? (
                            <span className="px-4 py-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl font-bold flex items-center gap-1.5 shadow-sm">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-bounce" /> Đang chờ bác sĩ
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleCheckIn(apt)}
                              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white text-xs font-bold transition-all shadow-sm shadow-sky-600/10 cursor-pointer border-none"
                            >
                              Check-in
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* Column 2: Booking Requests ("Yêu cầu đặt lịch") */}
            <motion.div className="space-y-4" variants={fadeInUp}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-extrabold text-xl text-slate-900">Yêu cầu đặt lịch</h3>
                {filteredRequests.length > 0 && (
                  <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200/20 animate-pulse">
                    {filteredRequests.length} MỚI
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {filteredRequests.length === 0 ? (
                  <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-8 text-center flex flex-col items-center justify-center">
                    <div className="w-10 h-10 bg-slate-100 border border-slate-200/50 rounded-xl flex items-center justify-center text-slate-400 mb-2 shadow-inner">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-700 text-xs">Không có yêu cầu mới</h4>
                    <p className="text-[10px] text-slate-400 font-medium max-w-[180px] mt-0.5">
                      Tất cả các yêu cầu đặt lịch đã được xử lý xong.
                    </p>
                  </div>
                ) : (
                  (filteredRequests || []).map((apt) => (
                    <div 
                      key={apt.appointment_id}
                      className="backdrop-blur-xl bg-white/50 border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-2xl p-4 hover:shadow-md transition-all border-l-4 border-l-sky-500 relative flex flex-col"
                    >
                      {/* Close button to reject request */}
                      <button 
                        onClick={() => handleReject(apt.appointment_id, apt.patient_name)}
                        title="Từ chối yêu cầu lịch hẹn"
                        className="absolute right-3 top-3 w-6 h-6 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center cursor-pointer border-none bg-transparent"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex justify-between items-start mb-2 pr-6">
                        <h4 className="font-bold text-slate-800 text-xs tracking-tight">{apt.patient_name}</h4>
                      </div>
                      
                      <div className="text-xs text-slate-500 font-medium space-y-1.5 flex-1">
                        <p className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-600">{apt.appointment_date}</span>
                          <span>-</span>
                          <span className="font-bold text-teal-600 bg-teal-50 px-1 rounded">{apt.start_time}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{apt.service_name}</span>
                        </p>
                        {apt.doctor_name && (
                          <p className="text-[10px] text-slate-400 flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Bác sĩ chỉ định: <strong className="text-slate-600">{apt.doctor_name}</strong></span>
                          </p>
                        )}
                        {apt.reason && (
                          <p className="text-[10px] bg-slate-50 p-2 rounded-xl border border-slate-200/50 italic text-slate-400 font-normal">
                            "{apt.reason}"
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <button 
                          onClick={() => handleApprove(apt.appointment_id, apt.patient_name)}
                          className="flex-1 py-2 rounded-xl bg-teal-50 text-teal-700 text-[11px] font-bold hover:bg-teal-100/50 border border-teal-200/10 transition-colors cursor-pointer"
                        >
                          Phê duyệt
                        </button>
                        <button 
                          onClick={() => handleOpenChat(apt.patient_id, apt.patient_name)}
                          className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-bold hover:bg-slate-200/60 border border-slate-200/10 transition-colors cursor-pointer"
                        >
                          Liên hệ
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button 
                onClick={() => setIsAddOpen(true)}
                className="w-full mt-4 py-3 rounded-2xl border border-dashed border-slate-300 text-slate-400 hover:bg-white/40 hover:text-teal-600 hover:border-teal-300 transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-transparent"
              >
                <UserPlus className="w-4 h-4" /> Tự thêm lịch hẹn trực tiếp
              </button>
            </motion.div>
          </div>
              </motion.div>
            )}

            {activeTab === 'waiting_list' && (
              <motion.div 
                key="waiting_list" 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                {/* Header panel */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Điều phối & Giám sát Hàng chờ</h2>
                    <p className="text-xs text-slate-500 font-medium">Theo dõi số thứ tự, độ ưu tiên và điều phối phòng khám bác sĩ hôm nay ({todayStr})</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQueueTab('waiting')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        queueTab === 'waiting'
                          ? 'bg-teal-600 border-none text-white shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Bệnh nhân Đang chờ ({
                        (appointments || []).filter(a => a.status === 'Đang chờ' && a.appointment_date === todayStr).length
                      })
                    </button>
                    <button
                      onClick={() => setQueueTab('completed')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        queueTab === 'completed'
                          ? 'bg-teal-600 border-none text-white shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Đã khám xong ({
                        (appointments || []).filter(a => a.status === 'Đã khám' && a.appointment_date === todayStr).length
                      })
                    </button>
                  </div>
                </div>

                {/* Queue KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="backdrop-blur-xl bg-white/50 border border-white/70 p-4 rounded-2xl flex items-center gap-3">
                    <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Đang chờ khám</span>
                      <strong className="text-xl font-extrabold text-slate-800">
                        {(appointments || []).filter(a => a.status === 'Đang chờ' && a.appointment_date === todayStr).length} BN
                      </strong>
                    </div>
                  </div>
                  <div className="backdrop-blur-xl bg-white/50 border border-white/70 p-4 rounded-2xl flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Đã khám xong</span>
                      <strong className="text-xl font-extrabold text-slate-800">
                        {(appointments || []).filter(a => a.status === 'Đã khám' && a.appointment_date === todayStr).length} BN
                      </strong>
                    </div>
                  </div>
                  <div className="backdrop-blur-xl bg-white/50 border border-white/70 p-4 rounded-2xl flex items-center gap-3">
                    <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Bác sĩ hoạt động</span>
                      <strong className="text-xl font-extrabold text-slate-800">
                        {Array.from(new Set(
                          (appointments || []).filter(a => a.appointment_date === todayStr && a.status !== 'Đã hủy').map(a => a.doctor_id)
                        )).length} BS
                      </strong>
                    </div>
                  </div>
                  <div className="backdrop-blur-xl bg-white/50 border border-white/70 p-4 rounded-2xl flex items-center gap-3">
                    <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Chờ trung bình</span>
                      <strong className="text-xl font-extrabold text-slate-800">12 phút</strong>
                    </div>
                  </div>
                </div>

                {/* Queue density alert */}
                {(() => {
                  const waitingBN = (appointments || []).filter(a => a.status === 'Đang chờ' && a.appointment_date === todayStr).length;
                  if (waitingBN > 5) {
                    return (
                      <div className="p-3 bg-amber-50 border border-amber-200/50 rounded-xl text-amber-800 text-[11px] font-bold flex items-center gap-2">
                        <span>⚠️ Hàng chờ hiện đang khá đông ({waitingBN} bệnh nhân). Vui lòng sử dụng tính năng Đổi Bác sĩ để điều phối khám hợp lý.</span>
                      </div>
                    );
                  }
                  return (
                    <div className="p-3 bg-teal-50 border border-teal-200/30 rounded-xl text-teal-800 text-[11px] font-bold flex items-center gap-2">
                      <span>✓ Mật độ hàng chờ khám đang ở mức ổn định.</span>
                    </div>
                  );
                })()}

                {/* Main list area */}
                <div className="space-y-4">
                  {queueTab === 'waiting' ? (
                    (() => {
                      const getDoctorRoomLocal = (docId) => {
                        if (docId === 'doc-01') return 'Phòng 101 (Lầu 1)';
                        if (docId === 'doc-02') return 'Phòng 102 (Lầu 1)';
                        if (docId === 'doc-03') return 'Phòng 103 (Lầu 1)';
                        return 'Phòng Khám Da Liễu';
                      };

                      const rawWaiting = (appointments || []).filter(a => a.status === 'Đang chờ' && a.appointment_date === todayStr);
                      const sortedWaiting = [...rawWaiting].sort((a, b) => {
                        if (a.priority && !b.priority) return -1;
                        if (!a.priority && b.priority) return 1;
                        const idxA = a.queue_index || 0;
                        const idxB = b.queue_index || 0;
                        return idxA - idxB;
                      });

                      if (sortedWaiting.length === 0) {
                        return (
                          <div className="p-16 text-center backdrop-blur-xl bg-white/40 border border-white/60 shadow-sm rounded-[2rem] text-slate-400 text-xs italic font-semibold">
                            Hiện tại không có bệnh nhân nào trong hàng chờ khám.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {sortedWaiting.map((apt, index) => {
                            const patDetail = patients.find(p => p.id === apt.patient_id);
                            const age = getPatientAge(patDetail?.dob);
                            const gender = patDetail?.gender || 'Nam';
                            
                            const rec = medicalRecords.find(r => r.appointmentId === apt.appointment_id);
                            
                            return (
                              <div 
                                key={apt.appointment_id} 
                                className={`backdrop-blur-xl border p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                                  apt.priority 
                                    ? 'bg-amber-50/30 border-amber-200 shadow-sm shadow-amber-500/5' 
                                    : 'bg-white/50 border-slate-100 hover:bg-white/70'
                                }`}
                              >
                                {/* Left Section: Wait Number & Patient Info */}
                                <div className="flex items-center gap-4 text-left">
                                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center border shrink-0 font-extrabold ${
                                    apt.priority 
                                      ? 'bg-gradient-to-tr from-amber-400 to-amber-500 text-white border-amber-300 shadow-md' 
                                      : 'bg-teal-50 text-teal-700 border-teal-100'
                                  }`}>
                                    <span className="text-[9px] uppercase font-black tracking-widest leading-none block">STT</span>
                                    <span className="text-lg leading-none mt-0.5">{index + 1 < 10 ? `0${index + 1}` : index + 1}</span>
                                  </div>
                                  <div>
                                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                                      {apt.patient_name}
                                      {apt.priority && (
                                        <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] rounded font-black tracking-wider uppercase animate-pulse flex items-center gap-0.5">
                                          ★ ƯU TIÊN
                                        </span>
                                      )}
                                    </h4>
                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-bold">
                                      <span className="text-slate-500">{apt.patient_id}</span>
                                      <span>•</span>
                                      <span>{gender}</span>
                                      <span>•</span>
                                      <span>{age} tuổi</span>
                                      <span>•</span>
                                      <span className="text-sky-600 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" /> Check-in: {apt.checkin_time || apt.start_time || '—'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 italic mt-2">
                                      Triệu chứng: <span className="font-semibold text-slate-600">"{apt.reason || 'Khám tổng quát'}"</span>
                                    </p>
                                  </div>
                                </div>

                                {/* Mid Section: Assigned Doctor & Room & Vitals */}
                                <div className="grid grid-cols-2 gap-4 text-left border-t md:border-t-0 md:border-l border-slate-200/50 pt-3 md:pt-0 md:pl-5 flex-1 max-w-lg">
                                  <div>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Bác sĩ & Phòng khám</span>
                                    <strong className="text-xs text-slate-800 block">{apt.doctor_name}</strong>
                                    <span className="text-[10px] text-teal-600 font-bold mt-0.5 block">{getDoctorRoomLocal(apt.doctor_id)}</span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Chỉ số sinh hiệu</span>
                                    {rec?.vitalSigns ? (
                                      <div className="text-[10px] text-slate-600 font-bold space-y-0.5">
                                        <p>HA: <span className="text-slate-800">{rec.vitalSigns.bloodPressure} mmHg</span> | Mạch: <span className="text-slate-800">{rec.vitalSigns.pulse}</span></p>
                                        <p>Nhiệt độ: <span className="text-slate-800">{rec.vitalSigns.temperature} °C</span> | SpO2: <span className="text-slate-800">{rec.vitalSigns.spo2} %</span></p>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic font-medium">Chưa có chỉ số sinh hiệu</span>
                                    )}
                                  </div>
                                </div>

                                {/* Right Section: Wait Order control & Action buttons */}
                                <div className="flex items-center gap-2 border-t md:border-t-0 border-slate-200/50 pt-3 md:pt-0 shrink-0 justify-between md:justify-end">
                                  {/* Up / Down Swap controls */}
                                  <div className="flex gap-1 border-r border-slate-200/50 pr-2 mr-2">
                                    <button 
                                      onClick={() => handleMoveUp(apt.appointment_id)}
                                      disabled={index === 0}
                                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-600 flex items-center justify-center border-none cursor-pointer text-[10px]"
                                      title="Di chuyển lên"
                                    >
                                      ▲
                                    </button>
                                    <button 
                                      onClick={() => handleMoveDown(apt.appointment_id)}
                                      disabled={index === sortedWaiting.length - 1}
                                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-600 flex items-center justify-center border-none cursor-pointer text-[10px]"
                                      title="Di chuyển xuống"
                                    >
                                      ▼
                                    </button>
                                  </div>

                                  <div className="flex gap-1.5 items-center justify-end">
                                    {/* Priority Toggle */}
                                    <button 
                                      onClick={() => togglePriority(apt.appointment_id)}
                                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                        apt.priority 
                                          ? 'bg-amber-100 border-amber-300 text-amber-600 hover:bg-amber-200/60' 
                                          : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                                      }`}
                                      title={apt.priority ? 'Hủy ưu tiên' : 'Đặt làm Ưu tiên'}
                                    >
                                      <Star className="w-4 h-4 fill-current" />
                                    </button>
                                    
                                    {/* Reassign Doctor */}
                                    <button 
                                      onClick={() => {
                                        setReassignAptId(apt.appointment_id);
                                        setSelectedDocId(apt.doctor_id || '');
                                        setIsReassignOpen(true);
                                      }}
                                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                                      title="Đổi bác sĩ/phòng khám"
                                    >
                                      <Stethoscope className="w-4 h-4" />
                                    </button>

                                    {/* Print Queue Ticket */}
                                    <button 
                                      onClick={() => handlePrintQueueTicket(apt)}
                                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                                      title="In Phiếu khám hàng chờ"
                                    >
                                      <Printer className="w-4 h-4" />
                                    </button>

                                    {/* Cancel checkin */}
                                    <button 
                                      onClick={() => handleCancelCheckin(apt.appointment_id)}
                                      className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
                                      title="Hủy Check-in / Tiếp nhận"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  ) : (
                    (() => {
                      const getDoctorRoomLocal = (docId) => {
                        if (docId === 'doc-01') return 'Phòng 101 (Lầu 1)';
                        if (docId === 'doc-02') return 'Phòng 102 (Lầu 1)';
                        if (docId === 'doc-03') return 'Phòng 103 (Lầu 1)';
                        return 'Phòng Khám Da Liễu';
                      };

                      const completedWaiting = (appointments || []).filter(a => a.status === 'Đã khám' && a.appointment_date === todayStr);

                      if (completedWaiting.length === 0) {
                        return (
                          <div className="p-16 text-center backdrop-blur-xl bg-white/40 border border-white/60 shadow-sm rounded-[2rem] text-slate-400 text-xs italic font-semibold">
                            Chưa có bệnh nhân nào hoàn thành khám hôm nay.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          {completedWaiting.map((apt, index) => {
                            const rec = medicalRecords.find(r => r.appointmentId === apt.appointment_id);
                            
                            return (
                              <div 
                                key={apt.appointment_id} 
                                className="backdrop-blur-xl bg-white/50 border border-slate-100 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left"
                              >
                                <div className="flex items-center gap-4 text-left">
                                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-extrabold text-sm shrink-0">
                                    ✓
                                  </div>
                                  <div>
                                    <h4 className="font-extrabold text-sm text-slate-700">{apt.patient_name}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                      {apt.patient_id} • Giờ khám: {apt.start_time} — Hoàn thành: {apt.end_time || '—'}
                                    </p>
                                    {rec?.diagnosis && (
                                      <p className="text-[11px] text-slate-600 font-medium mt-2 bg-slate-50/60 p-2 rounded-lg border border-slate-100">
                                        Chẩn đoán: <span className="font-extrabold text-slate-800">{rec.diagnosis}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="text-left md:border-l border-slate-200/50 md:pl-5 flex-1 max-w-xs">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase block mb-0.5">Bác sĩ phụ trách</span>
                                  <strong className="text-xs text-slate-800 block">{apt.doctor_name}</strong>
                                  <span className="text-[10px] text-teal-600 font-bold mt-0.5 block">{getDoctorRoomLocal(apt.doctor_id)}</span>
                                </div>

                                <div className="flex items-center gap-2 justify-end shrink-0">
                                  <button 
                                    onClick={() => handlePrintQueueTicket(apt)}
                                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Printer className="w-3.5 h-3.5" /> In phiếu
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'medical_records' && (
              <motion.div 
                key="medical_records" 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Header panel */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="text-left">
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quản lý Hồ sơ & Bệnh án</h2>
                    <p className="text-xs text-slate-500 font-medium">Tìm kiếm bệnh nhân cũ hoặc đặt lịch hẹn</p>
                  </div>
                  <button 
                    onClick={() => {
                      setRegPatient({ fullName: '', phone: '', dob: '', gender: 'Nam', email: '', address: '', medicalHistory: [] });
                      setIsAddPatientOpen(true);
                    }}
                    className="bg-gradient-to-r from-teal-600 to-sky-600 text-white py-3 px-5 rounded-2xl font-bold shadow-md shadow-teal-600/10 hover:shadow-lg hover:shadow-teal-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 border-none cursor-pointer text-xs"
                  >
                    <UserPlus className="w-4 h-4" />
                    Đăng ký Bệnh nhân Mới
                  </button>
                </div>

                {/* Directory panel */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left list: Search & Patient Cards */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="backdrop-blur-xl bg-white/40 border border-slate-200/50 shadow-inner rounded-3xl px-4 py-3 flex items-center">
                      <Search className="w-5 h-5 text-slate-400 mr-2.5 shrink-0" />
                      <input 
                        type="text"
                        placeholder="Tìm theo tên, SĐT, email..."
                        className="bg-transparent border-none outline-none text-sm font-medium w-full text-slate-800 focus:ring-0 p-0 focus:outline-none"
                        value={patientSearchTerm}
                        onChange={(e) => setPatientSearchTerm(e.target.value)}
                      />
                      {patientSearchTerm && (
                        <button onClick={() => setPatientSearchTerm('')} className="bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                      {(() => {
                        const list = searchPatients(patientSearchTerm);
                        if (list.length === 0) {
                          return (
                            <div className="p-12 text-center backdrop-blur-xl bg-white/30 border border-white/50 rounded-[2rem] flex flex-col items-center gap-3">
                              <Users className="w-10 h-10 text-slate-300 mx-auto" />
                              <div>
                                <p className="text-xs text-slate-400 font-bold">Không tìm thấy bệnh nhân nào</p>
                                <p className="text-[10px] text-slate-400 mt-1">Không có kết quả khớp với "{patientSearchTerm}"</p>
                              </div>
                              <button
                                onClick={() => {
                                  const term = patientSearchTerm.trim();
                                  const isPhone = /^[0-9+\s.-]{6,15}$/.test(term);
                                  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(term) || (term.includes('@') && term.length > 5);
                                  
                                  let detectedDob = '';
                                  const dateClean = term.replace(/[-\s.]/g, '/');
                                  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
                                  const dateMatch = dateClean.match(dateRegex);
                                  if (dateMatch) {
                                    const d = dateMatch[1].padStart(2, '0');
                                    const m = dateMatch[2].padStart(2, '0');
                                    const y = dateMatch[3];
                                    detectedDob = `${y}-${m}-${d}`;
                                  } else if (/^\d{8}$/.test(term)) {
                                    const d = term.slice(0, 2);
                                    const m = term.slice(2, 4);
                                    const y = term.slice(4, 8);
                                    detectedDob = `${y}-${m}-${d}`;
                                  } else if (/^\d{4}-\d{2}-\d{2}$/.test(term)) {
                                    detectedDob = term;
                                  }

                                  setRegPatient({
                                    fullName: (isPhone || isEmail || detectedDob) ? '' : term,
                                    phone: isPhone ? term.replace(/[\s.-]/g, '') : '',
                                    dob: detectedDob || '',
                                    gender: 'Nam',
                                    email: isEmail ? term : '',
                                    address: '',
                                    medicalHistory: [],
                                    guardianName: '',
                                    guardianPhone: '',
                                    guardianRelation: 'Mẹ'
                                  });
                                  setIsAddPatientOpen(true);
                                }}
                                className="mt-1 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200/50 rounded-xl px-4 py-2 text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                              >
                                ➕ Đăng ký nhanh bệnh nhân mới
                              </button>
                            </div>
                          );
                        }
                        return list.map(pat => {
                          const isSelected = selectedPatientId === pat.id;
                          const patientAge = getPatientAge(pat.dob);
                          return (
                            <div
                              key={pat.id}
                              onClick={() => setSelectedPatientId(pat.id)}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative flex items-center gap-3.5 group hover:shadow-md ${
                                isSelected 
                                  ? 'bg-gradient-to-tr from-teal-50 to-sky-50 border-teal-200/80 shadow-md shadow-teal-500/5' 
                                  : 'bg-white/60 border-slate-100 hover:bg-white'
                              }`}
                            >
                              <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200/40 shrink-0 bg-slate-100">
                                <img src={pat.avatar} alt={pat.fullName} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-800 text-sm truncate">{pat.fullName}</h4>
                                <p className="text-[11px] text-slate-400 font-bold mt-0.5">{pat.phone}</p>
                                <div className="flex items-center gap-1.5 mt-1.5 text-[9px] font-extrabold">
                                  <span className={`px-1.5 py-0.5 rounded ${pat.gender === 'Nam' ? 'bg-sky-50 text-sky-700' : pat.gender === 'Nữ' ? 'bg-pink-50 text-pink-700' : 'bg-slate-50 text-slate-700'}`}>
                                    {pat.gender}
                                  </span>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-slate-500">{patientAge} tuổi</span>
                                </div>
                              </div>
                              <ChevronRight className={`w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors shrink-0 ${isSelected ? 'translate-x-1' : ''}`} />
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Right Details: Selected Patient & History & Create record */}
                  <div className="lg:col-span-7">
                    {(() => {
                      const pat = patients.find(p => p.id === selectedPatientId);
                      if (!pat) {
                        return (
                          <div className="p-16 text-center backdrop-blur-xl bg-white/40 border border-white/60 shadow-sm rounded-[2.5rem] flex flex-col items-center justify-center min-h-[40vh]">
                            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 shadow-inner mb-4">
                              <ClipboardList className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-slate-700 text-sm">Chưa chọn bệnh nhân</h4>
                            <p className="text-xs text-slate-400 font-medium max-w-xs mt-1">
                              Chọn một bệnh nhân từ danh sách bên trái hoặc tạo đăng ký mới để xem hồ sơ và bệnh án.
                            </p>
                          </div>
                        );
                      }

                      const patRecords = getPatientRecords(pat.id);

                      return (
                        <div className="space-y-6">
                          {/* Patient profile overview card */}
                          <div className="backdrop-blur-xl bg-white/50 border border-white/70 shadow-sm rounded-[2rem] p-6 text-left relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-tr from-teal-500/10 to-sky-500/10 rounded-bl-[50px] pointer-events-none"></div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pb-5 border-b border-slate-200/50">
                              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0 bg-slate-100">
                                <img src={pat.avatar} alt={pat.fullName} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 text-left">
                                <h3 className="font-extrabold text-lg text-slate-900 leading-tight">{pat.fullName}</h3>
                                <p className="text-xs text-slate-400 font-semibold mt-1">ID: <span className="text-slate-600 font-bold">{pat.id}</span></p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pat.gender === 'Nam' ? 'bg-sky-100 text-sky-700' : pat.gender === 'Nữ' ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-700'}`}>
                                    {pat.gender}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-xs text-slate-500 font-bold">{getPatientAge(pat.dob)} tuổi ({new Date(pat.dob).toLocaleDateString('vi-VN')})</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                <button
                                  onClick={() => {
                                    setEditPatientData({
                                      id: pat.id,
                                      fullName: pat.fullName,
                                      phone: pat.phone,
                                      dob: pat.dob,
                                      gender: pat.gender || 'Nam',
                                      email: pat.email || '',
                                      address: pat.address,
                                      medicalHistory: pat.medicalHistory || [],
                                      guardianName: pat.guardianName || '',
                                      guardianPhone: pat.guardianPhone || '',
                                      guardianRelation: pat.guardianRelation || 'Mẹ'
                                    });
                                    setIsEditPatientOpen(true);
                                  }}
                                  className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all active:scale-95 text-xs flex justify-center items-center gap-1.5 border border-slate-200 cursor-pointer"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                  Chỉnh sửa Hồ sơ
                                </button>
                                <button
                                  onClick={() => {
                                    setNewApt({
                                      patientName: pat.fullName,
                                      phone: pat.phone,
                                      date: new Date().toLocaleDateString('en-CA'),
                                      time: '08:00',
                                      service: servicesList[0]?.name || 'Khám Da Liễu Tổng Quát',
                                      doctorName: doctors[0]?.name || 'BS. CKII. Trần Văn A',
                                      notes: ''
                                    });
                                    setIsAddOpen(true);
                                  }}
                                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-teal-600/10 transition-all active:scale-95 text-xs flex justify-center items-center gap-1.5 border-none cursor-pointer"
                                >
                                  <CalendarDays className="w-4 h-4" />
                                  Đặt lịch hẹn
                                </button>
                              </div>
                            </div>

                            {/* Contact info grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-5 text-xs text-left">
                              <div>
                                <span className="text-slate-400 font-bold block mb-1">Số điện thoại</span>
                                <strong className="text-slate-700 text-sm">{pat.phone}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold block mb-1">Email</span>
                                <strong className="text-slate-700 text-sm truncate block">{pat.email || 'Chưa cập nhật'}</strong>
                              </div>
                              <div className="md:col-span-2">
                                <span className="text-slate-400 font-bold block mb-1">Địa chỉ cư trú</span>
                                <strong className="text-slate-700">{pat.address}</strong>
                              </div>
                            </div>

                            {/* Guardian details if patient is under 18 */}
                            {(() => {
                              const age = getPatientAge(pat.dob);
                              if (typeof age === 'number' && age < 18 && pat.guardianName) {
                                return (
                                  <div className="py-4 border-t border-slate-200/50 text-xs text-left bg-amber-50/10 px-4 rounded-2xl border border-amber-100/50 my-2">
                                    <span className="text-amber-800 font-extrabold block mb-1">👪 Người giám hộ (Bảo hộ vị thành niên)</span>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                                      <div>
                                        <span className="text-slate-400 font-semibold block">Họ và tên:</span>
                                        <strong className="text-slate-700">{pat.guardianName}</strong>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 font-semibold block">Số điện thoại:</span>
                                        <strong className="text-slate-700">{pat.guardianPhone}</strong>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 font-semibold block">Quan hệ:</span>
                                        <strong className="text-slate-700">{pat.guardianRelation}</strong>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {/* Medical History Tags */}
                            <div className="pt-4 border-t border-slate-200/50 text-xs text-left">
                              <span className="text-slate-400 font-bold block mb-2">Tiền sử bệnh án & Dị ứng</span>
                              <div className="flex flex-wrap gap-1.5">
                                {pat.medicalHistory && pat.medicalHistory.length > 0 ? (
                                  pat.medicalHistory.map(hist => (
                                    <span key={hist} className="px-2 py-1 bg-rose-50 text-rose-700 font-extrabold rounded-lg border border-rose-200/20 text-[10px]">
                                      ⚠️ {hist}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 italic font-medium">Không có tiền sử bệnh lý/dị ứng nguy hiểm</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Records history list */}
                          <div className="space-y-3 text-left">
                            <h4 className="font-extrabold text-sm text-slate-800 pl-2">Lịch sử khám & Điều trị ({patRecords.length})</h4>
                            {patRecords.length === 0 ? (
                              <div className="p-8 text-center backdrop-blur-xl bg-white/20 border border-white/50 rounded-[2rem] text-slate-400 text-xs italic font-medium">
                                Chưa có hồ sơ bệnh án nào trước đây.
                              </div>
                            ) : (
                              patRecords.map(rec => (
                                <div key={rec.id} className="backdrop-blur-xl bg-white/40 border border-slate-100 hover:bg-white/60 transition-colors p-5 rounded-2xl flex flex-col gap-3">
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="text-left">
                                      <h5 className="font-bold text-slate-800 text-sm">{rec.service}</h5>
                                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                                        Ngày tiếp nhận: <span className="text-slate-600 font-bold">{rec.date} - {rec.time}</span>
                                      </p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                                      rec.status === 'completed'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : 'bg-teal-50 text-teal-700 border border-teal-100'
                                    }`}>
                                      {rec.status === 'completed' ? 'Đã hoàn thành khám' : 'Chờ bác sĩ khám'}
                                    </span>
                                  </div>

                                  {/* Doctor & Symptoms details */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-left">
                                    <div>
                                      <span className="text-slate-400 font-bold">Bác sĩ phụ trách:</span>
                                      <p className="font-semibold text-slate-700 mt-0.5">{rec.doctor}</p>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 font-bold">Chỉ số sinh hiệu ban đầu:</span>
                                      <p className="font-semibold text-slate-700 mt-0.5">
                                        HA: {rec.vitalSigns?.bloodPressure} | Mạch: {rec.vitalSigns?.pulse} | Nhiệt độ: {rec.vitalSigns?.temperature} | SpO2: {rec.vitalSigns?.spo2}
                                      </p>
                                    </div>
                                    <div className="md:col-span-2">
                                      <span className="text-slate-400 font-bold">Lý do khám / Triệu chứng:</span>
                                      <p className="italic text-slate-600 mt-0.5">"{rec.symptoms}"</p>
                                    </div>
                                    {rec.diagnosis && (
                                      <div className="md:col-span-2 border-t border-slate-200/50 pt-2">
                                        <span className="text-emerald-700 font-extrabold">Chẩn đoán lâm sàng:</span>
                                        <p className="font-bold text-slate-800 mt-0.5">{rec.diagnosis} ({rec.diagnosisCode})</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{rec.diagnosisDetail}</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex justify-end gap-2">
                                    {rec.status === 'pending_doctor' && (
                                      <button 
                                        onClick={() => handleEditRecordClick(rec)}
                                        className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg transition-colors text-[10px] font-bold border-none cursor-pointer flex items-center gap-1 border border-sky-200/50"
                                      >
                                        <FileText className="w-3.5 h-3.5" /> Chỉnh sửa
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => {
                                        setCreatedRecord(rec);
                                        setIsTicketOpen(true);
                                      }}
                                      className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-[10px] font-bold border-none cursor-pointer flex items-center gap-1 bg-transparent border border-slate-200"
                                    >
                                      <Printer className="w-3.5 h-3.5" /> In phiếu sinh hiệu
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'appointments' && (
              <motion.div key="appointments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Quản lý toàn bộ Lịch hẹn</h2>
                {/* Future: Inject full Appointments management table here */}
                <div className="p-8 backdrop-blur-xl bg-white/40 border border-white/60 shadow-sm rounded-[2rem] text-center text-slate-500 font-medium">
                  Tính năng đang được phát triển...
                </div>
              </motion.div>
            )}

            {activeTab === 'payments' && (
              <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Thanh toán & Hóa đơn</h2>
                {/* Future: Inject Payment management table here */}
                <div className="p-8 backdrop-blur-xl bg-white/40 border border-white/60 shadow-sm rounded-[2rem] text-center text-slate-500 font-medium">
                  Tính năng đang được phát triển...
                </div>
              </motion.div>
            )}

            {activeTab === 'doctor_schedules' && (
              <motion.div key="doctor_schedules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Cập nhật Lịch Bác sĩ</h2>
                <div className="p-8 backdrop-blur-xl bg-white/40 border border-white/60 shadow-sm rounded-[2rem] text-center text-slate-500 font-medium">
                  Tính năng đang được phát triển...
                </div>
              </motion.div>
            )}

            {activeTab === 'feedback' && (
              <motion.div key="feedback" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ReceptionistFeedbackView />
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Trò chuyện &amp; Hỗ trợ trực tuyến</h2>
                <ReceptionistChatTab />
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* ─── LIVE CHAT DRAWER INTEGRATION ──────────────────────────────────── */}
      <LiveChatDrawer 
        patient={activeChatPatient}
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setActiveChatPatient(null);
        }}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
      />

      {/* ─── MANUAL APPOINTMENT CREATION MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {isAddOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100]"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[90vh] overflow-y-auto backdrop-blur-3xl bg-white/90 border border-white rounded-[2.5rem] shadow-2xl z-[101] p-8 flex flex-col gap-6"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">Thêm lịch hẹn trực tiếp</h3>
                </div>
                <button 
                  onClick={() => setIsAddOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddApt} className="space-y-4 text-xs font-semibold text-slate-700">
                
                {/* Patient Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pname">Họ và tên bệnh nhân <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    id="pname"
                    required
                    placeholder="VD: Nguyễn Văn Anh"
                    value={newApt.patientName}
                    onChange={(e) => setNewApt(prev => ({ ...prev, patientName: e.target.value }))}
                    className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                  />
                </div>

                {/* Patient Phone */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone">Số điện thoại bệnh nhân <span className="text-rose-500">*</span></label>
                  <input 
                    type="tel" 
                    id="phone"
                    required
                    placeholder="VD: 0901 234 567"
                    value={newApt.phone}
                    onChange={(e) => setNewApt(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                  />
                </div>

                {/* Grid: Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="date">Ngày khám</label>
                    <input 
                      type="date" 
                      id="date"
                      required
                      value={newApt.date}
                      onChange={(e) => setNewApt(prev => ({ ...prev, date: e.target.value }))}
                      className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="time">Giờ khám</label>
                    <select 
                      id="time"
                      value={newApt.time}
                      onChange={(e) => setNewApt(prev => ({ ...prev, time: e.target.value }))}
                      className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 cursor-pointer"
                    >
                      {(mockTimeSlots || []).map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Service Selection */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="service">Dịch vụ khám điều trị</label>
                  <select 
                    id="service"
                    value={newApt.service}
                    onChange={(e) => setNewApt(prev => ({ ...prev, service: e.target.value }))}
                    className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 cursor-pointer"
                  >
                    {(servicesList || []).map(svc => (
                      <option key={svc.id} value={svc.name}>{svc.name} - ({svc.price})</option>
                    ))}
                  </select>
                </div>

                {/* Doctor Selection */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="doctor">Bác sĩ phụ trách</label>
                  <select 
                    id="doctor"
                    value={newApt.doctorName}
                    onChange={(e) => setNewApt(prev => ({ ...prev, doctorName: e.target.value }))}
                    className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 cursor-pointer"
                  >
                    {(doctors || []).map(doc => (
                      <option key={doc.id} value={doc.name}>{doc.name} - ({doc.title})</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="notes">Ghi chú hoặc triệu chứng</label>
                  <textarea 
                    id="notes"
                    placeholder="VD: Viêm da tái phát, dị ứng thực phẩm..."
                    rows={3}
                    value={newApt.notes}
                    onChange={(e) => setNewApt(prev => ({ ...prev, notes: e.target.value }))}
                    className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer bg-white"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 text-white font-bold hover:shadow-lg hover:shadow-teal-600/10 active:scale-95 transition-all cursor-pointer border-none"
                  >
                    Đặt lịch & Check-in
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── REGISTER PATIENT MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddPatientOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddPatientOpen(false)}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed inset-0 m-auto w-full max-w-xl h-fit max-h-[90vh] overflow-y-auto backdrop-blur-3xl bg-white/90 border border-white rounded-[2.5rem] shadow-2xl z-[101] p-8 flex flex-col gap-6"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">Đăng ký Hồ sơ Bệnh nhân Mới</h3>
                </div>
                <button 
                  onClick={() => setIsAddPatientOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const validation = validatePatient(regPatient);
                  if (!validation.valid) {
                    if (validation.duplicatePatient) {
                      showToast(`Số điện thoại đã tồn tại cho bệnh nhân ${validation.duplicatePatient.fullName}!`, 'error');
                      setSelectedPatientId(validation.duplicatePatient.id);
                      setIsAddPatientOpen(false);
                    } else {
                      showToast(validation.error, 'error');
                    }
                    return;
                  }

                  try {
                    const created = addPatient(regPatient);
                    setSelectedPatientId(created.id);
                    setIsAddPatientOpen(false);
                    showToast(`Đăng ký thành công bệnh nhân ${created.fullName}!`, 'success');
                  } catch (err) {
                    showToast(err.message || 'Lỗi khi đăng ký', 'error');
                  }
                }} 
                className="space-y-4 text-xs font-semibold text-slate-700 text-left"
              >
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="regName">Họ và tên <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    id="regName"
                    required
                    placeholder="VD: Nguyễn Văn Anh (phải gồm họ và tên)"
                    value={regPatient.fullName}
                    onChange={(e) => setRegPatient(prev => ({ ...prev, fullName: e.target.value }))}
                    className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                  />
                </div>

                {/* Phone & Gender */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="regPhone">Số điện thoại <span className="text-rose-500">*</span></label>
                    <input 
                      type="tel" 
                      id="regPhone"
                      required
                      placeholder="VD: 0901 234 567"
                      value={regPatient.phone}
                      onChange={(e) => setRegPatient(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="regGender">Giới tính <span className="text-rose-500">*</span></label>
                    <select 
                      id="regGender"
                      value={regPatient.gender}
                      onChange={(e) => {
                        const newGender = e.target.value;
                        setRegPatient(prev => {
                          let updatedHistory = prev.medicalHistory;
                          if (newGender !== 'Nữ') {
                            updatedHistory = prev.medicalHistory.filter(h => h !== 'Đang mang thai' && h !== 'Đang cho con bú');
                          }
                          return {
                            ...prev,
                            gender: newGender,
                            medicalHistory: updatedHistory
                          };
                        });
                      }}
                      className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 cursor-pointer"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                {/* DOB & Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="regDob">Ngày sinh <span className="text-rose-500">*</span></label>
                    <input 
                      type="date" 
                      id="regDob"
                      required
                      value={regPatient.dob}
                      onChange={(e) => setRegPatient(prev => ({ ...prev, dob: e.target.value }))}
                      className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="regEmail">Email (Tùy chọn)</label>
                    <input 
                      type="email" 
                      id="regEmail"
                      placeholder="example@gmail.com"
                      value={regPatient.email}
                      onChange={(e) => setRegPatient(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="regAddress">Địa chỉ thường trú <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    id="regAddress"
                    required
                    placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                    value={regPatient.address}
                    onChange={(e) => setRegPatient(prev => ({ ...prev, address: e.target.value }))}
                    className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                  />
                </div>

                {/* Guardian Info if Under 18 */}
                {(() => {
                  const age = getPatientAge(regPatient.dob);
                  const isMinor = typeof age === 'number' && age < 18;
                  if (!isMinor) return null;

                  return (
                    <div className="border border-amber-200 bg-amber-50/20 rounded-3xl p-5 space-y-4 text-left">
                      <h4 className="font-extrabold text-xs text-amber-800 flex items-center gap-1.5">
                        👪 Thông tin người giám hộ (Bắt buộc vì bệnh nhân dưới 18 tuổi)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Guardian Name */}
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="guardName">Họ và tên người giám hộ <span className="text-rose-500">*</span></label>
                          <input 
                            type="text" 
                            id="guardName"
                            required={isMinor}
                            placeholder="VD: Nguyễn Thị Mẹ"
                            value={regPatient.guardianName}
                            onChange={(e) => setRegPatient(prev => ({ ...prev, guardianName: e.target.value }))}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                          />
                        </div>
                        {/* Guardian Phone */}
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="guardPhone">Số điện thoại người giám hộ <span className="text-rose-500">*</span></label>
                          <input 
                            type="tel" 
                            id="guardPhone"
                            required={isMinor}
                            placeholder="VD: 0912 345 678"
                            value={regPatient.guardianPhone}
                            onChange={(e) => setRegPatient(prev => ({ ...prev, guardianPhone: e.target.value }))}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="guardRelation">Mối quan hệ với bệnh nhân <span className="text-rose-500">*</span></label>
                        <select 
                          id="guardRelation"
                          value={regPatient.guardianRelation}
                          onChange={(e) => setRegPatient(prev => ({ ...prev, guardianRelation: e.target.value }))}
                          className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 cursor-pointer"
                        >
                          <option value="Mẹ">Mẹ</option>
                          <option value="Cha">Cha</option>
                          <option value="Ông">Ông</option>
                          <option value="Bà">Bà</option>
                          <option value="Anh">Anh</option>
                          <option value="Chị">Chị</option>
                          <option value="Cô">Cô</option>
                          <option value="Dì">Dì</option>
                          <option value="Chú">Chú</option>
                          <option value="Bác">Bác</option>
                          <option value="Người giám hộ hợp pháp">Người giám hộ hợp pháp</option>
                        </select>
                      </div>
                    </div>
                  );
                })()}

                {/* Medical History Checklist */}
                <div className="flex flex-col gap-2 pt-2">
                  <label>Tiền sử bệnh án & Dị ứng lâm sàng</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {PRE_DEFINED_HISTORY.filter(condition => {
                      if ((condition === 'Đang mang thai' || condition === 'Đang cho con bú') && regPatient.gender !== 'Nữ') {
                        return false;
                      }
                      return true;
                    }).map(condition => {
                      const isChecked = regPatient.medicalHistory.includes(condition);
                      return (
                        <button
                          key={condition}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setRegPatient(prev => ({
                                ...prev,
                                medicalHistory: prev.medicalHistory.filter(c => c !== condition)
                              }));
                            } else {
                              setRegPatient(prev => ({
                                ...prev,
                                medicalHistory: [...prev.medicalHistory, condition]
                              }));
                            }
                          }}
                          className={`py-2 px-3 rounded-xl border text-[10px] font-bold text-center transition-all cursor-pointer ${
                            isChecked 
                              ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm shadow-rose-500/5' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {isChecked ? '✓ ' : '+ '} {condition}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsAddPatientOpen(false)}
                    className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer bg-white"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 text-white font-bold hover:shadow-lg hover:shadow-teal-600/10 active:scale-95 transition-all cursor-pointer border-none"
                  >
                    Đăng ký Hồ sơ Bệnh nhân
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── EDIT PATIENT MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isEditPatientOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditPatientOpen(false)}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed inset-0 m-auto w-full max-w-xl h-fit max-h-[90vh] overflow-y-auto backdrop-blur-3xl bg-white/90 border border-white rounded-[2.5rem] shadow-2xl z-[101] p-8 flex flex-col gap-6"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
                    <Settings className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">Chỉnh sửa Hồ sơ Bệnh nhân</h3>
                </div>
                <button 
                  onClick={() => setIsEditPatientOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const validation = validatePatient(editPatientData);
                  if (!validation.valid) {
                    showToast(validation.error, 'error');
                    return;
                  }

                  try {
                    const oldPatient = patients.find(p => p.id === editPatientData.id);
                    const updated = updatePatient(editPatientData.id, editPatientData);
                    
                    if (oldPatient && oldPatient.fullName !== updated.fullName) {
                      AppointmentModel.updatePatientName(updated.id, updated.fullName);
                    }
                    
                    setIsEditPatientOpen(false);
                    showToast(`Cập nhật thành công hồ sơ bệnh nhân ${updated.fullName}!`, 'success');
                  } catch (err) {
                    showToast(err.message || 'Lỗi khi cập nhật hồ sơ', 'error');
                  }
                }} 
                className="space-y-4 text-xs font-semibold text-slate-700 text-left"
              >
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="editName">Họ và tên <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    id="editName"
                    required
                    placeholder="VD: Nguyễn Văn Anh (phải gồm họ và tên)"
                    value={editPatientData.fullName}
                    onChange={(e) => setEditPatientData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                  />
                </div>

                {/* Phone & Gender */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="editPhone">Số điện thoại <span className="text-rose-500">*</span></label>
                    <input 
                      type="tel" 
                      id="editPhone"
                      required
                      placeholder="VD: 0901 234 567"
                      value={editPatientData.phone}
                      onChange={(e) => setEditPatientData(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="editGender">Giới tính <span className="text-rose-500">*</span></label>
                    <select 
                      id="editGender"
                      value={editPatientData.gender}
                      onChange={(e) => {
                        const newGender = e.target.value;
                        setEditPatientData(prev => {
                          let updatedHistory = prev.medicalHistory;
                          if (newGender !== 'Nữ') {
                            updatedHistory = prev.medicalHistory.filter(h => h !== 'Đang mang thai' && h !== 'Đang cho con bú');
                          }
                          return {
                            ...prev,
                            gender: newGender,
                            medicalHistory: updatedHistory
                          };
                        });
                      }}
                      className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 cursor-pointer"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                {/* DOB & Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="editDob">Ngày sinh <span className="text-rose-500">*</span></label>
                    <input 
                      type="date" 
                      id="editDob"
                      required
                      value={editPatientData.dob}
                      onChange={(e) => setEditPatientData(prev => ({ ...prev, dob: e.target.value }))}
                      className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="editEmail">Email (Tùy chọn)</label>
                    <input 
                      type="email" 
                      id="editEmail"
                      placeholder="example@gmail.com"
                      value={editPatientData.email}
                      onChange={(e) => setEditPatientData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="editAddress">Địa chỉ thường trú <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    id="editAddress"
                    required
                    placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                    value={editPatientData.address}
                    onChange={(e) => setEditPatientData(prev => ({ ...prev, address: e.target.value }))}
                    className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                  />
                </div>

                {/* Guardian Info if Under 18 */}
                {(() => {
                  const age = getPatientAge(editPatientData.dob);
                  const isMinor = typeof age === 'number' && age < 18;
                  if (!isMinor) return null;

                  return (
                    <div className="border border-amber-200 bg-amber-50/20 rounded-3xl p-5 space-y-4 text-left">
                      <h4 className="font-extrabold text-xs text-amber-800 flex items-center gap-1.5">
                        👪 Thông tin người giám hộ (Bắt buộc vì bệnh nhân dưới 18 tuổi)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Guardian Name */}
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="editGuardName">Họ và tên người giám hộ <span className="text-rose-500">*</span></label>
                          <input 
                            type="text" 
                            id="editGuardName"
                            required={isMinor}
                            placeholder="VD: Nguyễn Thị Mẹ"
                            value={editPatientData.guardianName || ''}
                            onChange={(e) => setEditPatientData(prev => ({ ...prev, guardianName: e.target.value }))}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                          />
                        </div>
                        {/* Guardian Phone */}
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="editGuardPhone">Số điện thoại người giám hộ <span className="text-rose-500">*</span></label>
                          <input 
                            type="tel" 
                            id="editGuardPhone"
                            required={isMinor}
                            placeholder="VD: 0912 345 678"
                            value={editPatientData.guardianPhone || ''}
                            onChange={(e) => setEditPatientData(prev => ({ ...prev, guardianPhone: e.target.value }))}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="editGuardRelation">Mối quan hệ với bệnh nhân <span className="text-rose-500">*</span></label>
                        <select 
                          id="editGuardRelation"
                          value={editPatientData.guardianRelation || 'Mẹ'}
                          onChange={(e) => setEditPatientData(prev => ({ ...prev, guardianRelation: e.target.value }))}
                          className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 cursor-pointer"
                        >
                          <option value="Mẹ">Mẹ</option>
                          <option value="Cha">Cha</option>
                          <option value="Ông">Ông</option>
                          <option value="Bà">Bà</option>
                          <option value="Anh">Anh</option>
                          <option value="Chị">Chị</option>
                          <option value="Cô">Cô</option>
                          <option value="Dì">Dì</option>
                          <option value="Chú">Chú</option>
                          <option value="Bác">Bác</option>
                          <option value="Người giám hộ hợp pháp">Người giám hộ hợp pháp</option>
                        </select>
                      </div>
                    </div>
                  );
                })()}

                {/* Medical History Checklist */}
                <div className="flex flex-col gap-2 pt-2">
                  <label>Tiền sử bệnh án & Dị ứng lâm sàng</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {PRE_DEFINED_HISTORY.filter(condition => {
                      if ((condition === 'Đang mang thai' || condition === 'Đang cho con bú') && editPatientData.gender !== 'Nữ') {
                        return false;
                      }
                      return true;
                    }).map(condition => {
                      const isChecked = editPatientData.medicalHistory.includes(condition);
                      return (
                        <button
                          key={condition}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setEditPatientData(prev => ({
                                ...prev,
                                medicalHistory: prev.medicalHistory.filter(c => c !== condition)
                              }));
                            } else {
                              setEditPatientData(prev => ({
                                ...prev,
                                medicalHistory: [...prev.medicalHistory, condition]
                              }));
                            }
                          }}
                          className={`py-2 px-3 rounded-xl border text-[10px] font-bold text-center transition-all cursor-pointer ${
                            isChecked 
                              ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm shadow-rose-500/5' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {isChecked ? '✓ ' : '+ '} {condition}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsEditPatientOpen(false)}
                    className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer bg-white"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 text-white font-bold hover:shadow-lg hover:shadow-teal-600/10 active:scale-95 transition-all cursor-pointer border-none"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── CREATE MEDICAL RECORD MODAL ─────────────────────────────────────── */}
      <AnimatePresence>
        {isAddRecordOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={closeRecordModal}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[90vh] overflow-y-auto backdrop-blur-3xl bg-white/90 border border-white rounded-[2.5rem] shadow-2xl z-[101] p-8 flex flex-col gap-6"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
                    <Activity className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 tracking-tight text-left">
                      {editRecordId ? "Chỉnh Sửa Chỉ Số Sinh Hiệu & Bệnh Án" : "Đo Sinh Hiệu & Tiếp Nhận Khám"}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium text-left">Bệnh nhân: <strong className="text-slate-700">{patients.find(p => p.id === newRecordData.patientId)?.fullName}</strong></p>
                  </div>
                </div>
                <button 
                  onClick={closeRecordModal}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const targetPat = patients.find(p => p.id === newRecordData.patientId);
                  if (!targetPat) return;

                  const doctor = doctors.find(d => d.id === newRecordData.doctorId) || doctors[0];
                  
                  const validation = validateRecord({
                    symptoms: newRecordData.symptoms,
                    vitalSigns: newRecordData.vitalSigns
                  });

                  if (!validation.valid) {
                    showToast(validation.error, 'error');
                    return;
                  }

                  try {
                    if (editRecordId) {
                      // Update mode
                      const record = updateRecord(editRecordId, {
                        patientId: newRecordData.patientId,
                        doctorId: newRecordData.doctorId,
                        doctorName: doctor.name,
                        serviceName: newRecordData.serviceName,
                        symptoms: newRecordData.symptoms,
                        notes: newRecordData.notes,
                        vitalSigns: newRecordData.vitalSigns
                      });

                      // Synchronize appointment
                      let linkedAppointmentId = record.appointmentId;
                      if (!linkedAppointmentId) {
                        const todayApts = appointments.filter(a => a.patient_id === newRecordData.patientId);
                        if (todayApts.length > 0) {
                          linkedAppointmentId = todayApts[0].appointment_id;
                        }
                      }

                      if (linkedAppointmentId) {
                        changeAppointment(linkedAppointmentId, {
                          reason: newRecordData.symptoms,
                          service_name: newRecordData.serviceName,
                          doctor_id: doctor.id,
                          doctor_name: doctor.name,
                          doctor_title: doctor.title,
                          doctor_image: doctor.image
                        });
                      }

                      setCreatedRecord(record);
                      closeRecordModal();
                      setIsTicketOpen(true);
                      showToast(`Cập nhật bệnh án và đồng bộ lịch khám thành công!`, 'success');
                    } else {
                      // Create mode
                      const appId = `apt-${Date.now()}`;
                      const record = addRecord({
                        appointmentId: appId,
                        patientId: newRecordData.patientId,
                        doctorId: newRecordData.doctorId,
                        doctorName: doctor.name,
                        specialty: doctor.title || 'Da liễu thẩm mỹ',
                        serviceName: newRecordData.serviceName,
                        symptoms: newRecordData.symptoms,
                        notes: newRecordData.notes,
                        vitalSigns: newRecordData.vitalSigns,
                        fee: '300,000 VNĐ'
                      });

                      // Automatically create appointment checked in
                      const appPayload = {
                        appointment_id: appId,
                        patient_id: targetPat.id,
                        patient_name: targetPat.fullName,
                        doctor_id: doctor.id,
                        doctor_name: doctor.name,
                        doctor_title: doctor.title,
                        doctor_image: doctor.image,
                        service_id: 'srv-01',
                        service_name: newRecordData.serviceName,
                        slot_id: 'slot-01',
                        appointment_date: '2026-06-01', // Today
                        start_time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                        end_time: '18:00',
                        reason: newRecordData.symptoms,
                        status: 'Đang chờ', // Checked-in / Completed for Receptionist
                        fee: '300,000 VNĐ',
                        paymentStatus: 'Đã thanh toán'
                      };

                      bookAppointment(appPayload);

                      // Send Notification to doctor
                      NotificationModel.sendNotification(
                        'DOCTOR',
                        doctor.id,
                        'Bệnh nhân mới check-in',
                        `Bệnh nhân ${targetPat.fullName} đã được kiểm tra sinh hiệu tại quầy lễ tân và xếp vào hàng chờ khám của bác sĩ.`
                      );

                      setCreatedRecord(record);
                      closeRecordModal();
                      setIsTicketOpen(true);
                      showToast(`Bệnh án đã được khởi tạo & Bệnh nhân được check-in thành công!`, 'success');
                    }
                  } catch (err) {
                    showToast(err.message || 'Lỗi khi xử lý bệnh án', 'error');
                  }
                }}
                className="space-y-4 text-xs font-semibold text-slate-700 text-left"
              >
                {/* Doctor & Service */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="recDoctor">Bác sĩ chỉ định khám <span className="text-rose-500">*</span></label>
                    <select 
                      id="recDoctor"
                      value={newRecordData.doctorId}
                      onChange={(e) => setNewRecordData(prev => ({ ...prev, doctorId: e.target.value }))}
                      className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 cursor-pointer"
                    >
                      {doctors.map(doc => (
                        <option key={doc.id} value={doc.id}>{doc.name} ({doc.title})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="recService">Dịch vụ lâm sàng <span className="text-rose-500">*</span></label>
                    <select 
                      id="recService"
                      value={newRecordData.serviceName}
                      onChange={(e) => setNewRecordData(prev => ({ ...prev, serviceName: e.target.value }))}
                      className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 cursor-pointer"
                    >
                      {mockServices.map(svc => (
                        <option key={svc.id} value={svc.name}>{svc.name} - ({svc.price})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Symptoms / Reason for visit */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="recSymptoms">Lý do khám bệnh & Triệu chứng ban đầu <span className="text-rose-500">*</span></label>
                  <textarea 
                    id="recSymptoms"
                    required
                    placeholder="VD: Nổi mẩn ngứa vùng má, lan xuống cổ 2 ngày nay. Da mặt khô căng..."
                    rows={3}
                    value={newRecordData.symptoms}
                    onChange={(e) => setNewRecordData(prev => ({ ...prev, symptoms: e.target.value }))}
                    className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                  />
                </div>

                {/* Vital signs section */}
                <div className="border border-slate-100 rounded-3xl p-5 bg-slate-50/30 space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-500" /> Chỉ Số Sinh Hiệu & Thể Trạng
                  </h4>
                  
                  {/* Row 1: Height, Weight & BMI Gauge */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="recHeight">Chiều cao (cm) <span className="text-rose-500">*</span></label>
                      <input 
                        type="number"
                        id="recHeight"
                        required
                        step="0.1"
                        placeholder="VD: 170"
                        value={newRecordData.vitalSigns.height}
                        onChange={(e) => setNewRecordData(prev => ({
                          ...prev,
                          vitalSigns: { ...prev.vitalSigns, height: e.target.value }
                        }))}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="recWeight">Cân nặng (kg) <span className="text-rose-500">*</span></label>
                      <input 
                        type="number"
                        id="recWeight"
                        required
                        step="0.1"
                        placeholder="VD: 65"
                        value={newRecordData.vitalSigns.weight}
                        onChange={(e) => setNewRecordData(prev => ({
                          ...prev,
                          vitalSigns: { ...prev.vitalSigns, weight: e.target.value }
                        }))}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                      />
                    </div>
                    
                    {/* Live BMI Calculator */}
                    <div className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col justify-center h-full shadow-sm text-left">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">Chỉ số BMI (Tự động)</span>
                      {(() => {
                        const h = parseFloat(newRecordData.vitalSigns.height);
                        const w = parseFloat(newRecordData.vitalSigns.weight);
                        if (!isNaN(h) && !isNaN(w) && h > 0 && w > 0) {
                          const bmi = w / Math.pow(h / 100, 2);
                          let status = 'Bình thường';
                          let color = 'text-emerald-600 bg-emerald-50 border-emerald-200';
                          let barColor = 'bg-emerald-500';
                          let barLeft = '50%';

                          if (bmi < 18.5) {
                            status = 'Thiếu cân';
                            color = 'text-sky-600 bg-sky-50 border-sky-200';
                            barColor = 'bg-sky-400';
                            barLeft = '15%';
                          } else if (bmi >= 25 && bmi < 30) {
                            status = 'Thừa cân';
                            color = 'text-amber-600 bg-amber-50 border-amber-200';
                            barColor = 'bg-amber-500';
                            barLeft = '75%';
                          } else if (bmi >= 30) {
                            status = 'Béo phì';
                            color = 'text-rose-600 bg-rose-50 border-rose-200';
                            barColor = 'bg-rose-500';
                            barLeft = '90%';
                          }

                          return (
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-sm text-slate-800">{bmi.toFixed(1)}</span>
                                <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black ${color}`}>{status}</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 relative overflow-hidden">
                                <div className={`h-full rounded-full ${barColor}`} style={{ width: barLeft }}></div>
                              </div>
                            </div>
                          );
                        }
                        return <span className="text-[11px] text-slate-400 font-bold italic py-1">Nhập cân nặng/chiều cao...</span>;
                      })()}
                    </div>
                  </div>

                  {/* Row 2: BP, Heart Rate, Temperature, SpO2 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Blood Pressure */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <label htmlFor="recBP">Huyết áp (SYS/DIA) <span className="text-rose-500">*</span></label>
                      <input 
                        type="text"
                        id="recBP"
                        required
                        placeholder="VD: 120/80"
                        value={newRecordData.vitalSigns.bloodPressure}
                        onChange={(e) => setNewRecordData(prev => ({
                          ...prev,
                          vitalSigns: { ...prev.vitalSigns, bloodPressure: e.target.value }
                        }))}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                      />
                      {(() => {
                        const bp = newRecordData.vitalSigns.bloodPressure.replace(/\s/g, '');
                        const parts = bp.split('/');
                        if (parts.length === 2) {
                          const sys = parseInt(parts[0], 10);
                          const dia = parseInt(parts[1], 10);
                          if (!isNaN(sys) && !isNaN(dia)) {
                            if (sys >= 140 || dia >= 90) {
                              return <span className="text-[9px] text-rose-600 font-extrabold">⚠️ Huyết áp cao</span>;
                            } else if (sys <= 90 || dia <= 60) {
                              return <span className="text-[9px] text-sky-600 font-extrabold">⚠️ Huyết áp thấp</span>;
                            } else {
                              return <span className="text-[9px] text-emerald-600 font-extrabold">✓ Huyết áp bình thường</span>;
                            }
                          }
                        }
                        return null;
                      })()}
                    </div>

                    {/* Pulse / Heart Rate */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <label htmlFor="recPulse">Nhịp tim (lần/phút) <span className="text-rose-500">*</span></label>
                      <input 
                        type="number"
                        id="recPulse"
                        required
                        placeholder="VD: 75"
                        value={newRecordData.vitalSigns.pulse}
                        onChange={(e) => setNewRecordData(prev => ({
                          ...prev,
                          vitalSigns: { ...prev.vitalSigns, pulse: e.target.value }
                        }))}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                      />
                      {(() => {
                        const pulse = parseInt(newRecordData.vitalSigns.pulse, 10);
                        if (!isNaN(pulse)) {
                          if (pulse > 100) {
                            return <span className="text-[9px] text-rose-600 font-extrabold">⚠️ Tim đập nhanh</span>;
                          } else if (pulse < 60) {
                            return <span className="text-[9px] text-sky-600 font-extrabold">⚠️ Tim đập chậm</span>;
                          } else {
                            return <span className="text-[9px] text-emerald-600 font-extrabold">✓ Nhịp tim bình thường</span>;
                          }
                        }
                        return null;
                      })()}
                    </div>

                    {/* Temperature */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <label htmlFor="recTemp">Nhiệt độ (°C) <span className="text-rose-500">*</span></label>
                      <input 
                        type="number"
                        id="recTemp"
                        required
                        step="0.1"
                        placeholder="VD: 36.5"
                        value={newRecordData.vitalSigns.temperature}
                        onChange={(e) => setNewRecordData(prev => ({
                          ...prev,
                          vitalSigns: { ...prev.vitalSigns, temperature: e.target.value }
                        }))}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                      />
                      {(() => {
                        const temp = parseFloat(newRecordData.vitalSigns.temperature);
                        if (!isNaN(temp)) {
                          if (temp >= 38.0) {
                            return <span className="text-[9px] text-rose-600 font-extrabold">⚠️ Sốt cao ({temp}°C)</span>;
                          } else if (temp >= 37.5) {
                            return <span className="text-[9px] text-amber-600 font-extrabold">⚠️ Sốt nhẹ ({temp}°C)</span>;
                          } else if (temp < 36.0) {
                            return <span className="text-[9px] text-sky-600 font-extrabold">⚠️ Hạ thân nhiệt</span>;
                          } else {
                            return <span className="text-[9px] text-emerald-600 font-extrabold">✓ Thân nhiệt bình thường</span>;
                          }
                        }
                        return null;
                      })()}
                    </div>

                    {/* SpO2 */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <label htmlFor="recSpO2">Độ bão hòa SpO2 (%) <span className="text-rose-500">*</span></label>
                      <input 
                        type="number"
                        id="recSpO2"
                        required
                        placeholder="VD: 98"
                        value={newRecordData.vitalSigns.spo2}
                        onChange={(e) => setNewRecordData(prev => ({
                          ...prev,
                          vitalSigns: { ...prev.vitalSigns, spo2: e.target.value }
                        }))}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                      />
                      {(() => {
                        const spo2 = parseInt(newRecordData.vitalSigns.spo2, 10);
                        if (!isNaN(spo2)) {
                          if (spo2 < 95) {
                            return <span className="text-[9px] text-rose-600 font-extrabold">⚠️ SpO2 thấp (dưới 95%)</span>;
                          } else {
                            return <span className="text-[9px] text-emerald-600 font-extrabold">✓ SpO2 bình thường</span>;
                          }
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Receptionist Notes */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="recNotes">Ghi chú tiếp nhận hành chính (Tùy chọn)</label>
                  <input 
                    type="text" 
                    id="recNotes"
                    placeholder="VD: Mang theo thẻ bảo hiểm, yêu cầu khám nhanh, có dị ứng nhẹ..."
                    value={newRecordData.notes}
                    onChange={(e) => setNewRecordData(prev => ({ ...prev, notes: e.target.value }))}
                    className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={closeRecordModal}
                    className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer bg-white"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 text-white font-bold hover:shadow-lg hover:shadow-teal-600/10 active:scale-95 transition-all cursor-pointer border-none"
                  >
                    {editRecordId ? "Cập nhật bệnh án" : "Lập bệnh án & Check-in"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── DOCTOR RE-ASSIGNMENT MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {isReassignOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsReassignOpen(false); setReassignAptId(null); }}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed inset-0 m-auto w-full max-w-sm h-fit backdrop-blur-3xl bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl z-[101] p-6 flex flex-col gap-5 text-slate-800 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-md text-slate-900 tracking-tight">Đổi Bác sĩ & Phòng khám</h3>
                </div>
                <button 
                  onClick={() => { setIsReassignOpen(false); setReassignAptId(null); }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleReassignDoctorSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                  <label htmlFor="reassignDoc">Chọn Bác sĩ điều phối mới</label>
                  <select 
                    id="reassignDoc"
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 cursor-pointer w-full"
                  >
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.name} - ({doc.title})</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Bệnh nhân sẽ được xếp vào cuối hàng chờ khám của bác sĩ này.
                  </span>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100 text-xs">
                  <button 
                    type="button"
                    onClick={() => { setIsReassignOpen(false); setReassignAptId(null); }}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all cursor-pointer bg-white"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 text-white font-bold hover:shadow-lg hover:shadow-teal-600/10 transition-all cursor-pointer border-none"
                  >
                    Xác nhận chuyển
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── PATIENT VITALS & ROOM CHECK-IN MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {isCheckinModalOpen && checkinApt && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsCheckinModalOpen(false); setCheckinApt(null); }}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed inset-0 m-auto w-full max-w-xl h-fit backdrop-blur-3xl bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl z-[101] p-6 flex flex-col gap-5 text-slate-800 text-left overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-md text-slate-900 tracking-tight">Check-in &amp; Tiếp nhận Bệnh nhân</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Đo chỉ số sinh hiệu và chỉ định phòng khám lâm sàng</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setIsCheckinModalOpen(false); setCheckinApt(null); }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Patient Quick Info Card */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/40 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Bệnh nhân</span>
                  <strong className="text-sm text-slate-800">{checkinApt.patient_name}</strong>
                  <span className="text-slate-400 block mt-0.5">SĐT: {checkinApt.patientPhone || checkinApt.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Dịch vụ đăng ký</span>
                  <span className="font-semibold text-slate-700 block">{checkinApt.service_name}</span>
                  <span className="text-slate-400 block mt-0.5">Thời gian khám: {checkinApt.start_time} | {checkinApt.appointment_date}</span>
                </div>
              </div>

              <form onSubmit={handleCheckinSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
                
                {/* symptoms/reason */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="checkinSymptoms">Lý do khám / Triệu chứng ban đầu <span className="text-rose-500">*</span></label>
                  <textarea 
                    id="checkinSymptoms"
                    value={checkinVitals.symptoms}
                    onChange={(e) => setCheckinVitals(prev => ({ ...prev, symptoms: e.target.value }))}
                    placeholder="Mô tả ngắn triệu chứng ban đầu (VD: Mụn trứng cá nổi đỏ vùng mặt kèm ngứa nhẹ...)"
                    rows={2}
                    className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 w-full"
                    required
                  />
                </div>

                {/* Vitals Grid */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 text-xs flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-teal-600" /> Chỉ số sinh hiệu (Vitals)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {/* Height */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="height">Chiều cao (cm) <span className="text-rose-500">*</span></label>
                      <input 
                        type="number"
                        id="height"
                        value={checkinVitals.height}
                        onChange={(e) => setCheckinVitals(prev => ({ ...prev, height: e.target.value }))}
                        placeholder="VD: 170"
                        className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 w-full"
                        required
                      />
                    </div>
                    {/* Weight */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="weight">Cân nặng (kg) <span className="text-rose-500">*</span></label>
                      <input 
                        type="number"
                        id="weight"
                        value={checkinVitals.weight}
                        onChange={(e) => setCheckinVitals(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="VD: 60"
                        className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 w-full"
                        required
                      />
                    </div>
                    {/* Blood Pressure */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="bloodPressure">Huyết áp (SYS/DIA) <span className="text-rose-500">*</span></label>
                      <input 
                        type="text"
                        id="bloodPressure"
                        value={checkinVitals.bloodPressure}
                        onChange={(e) => setCheckinVitals(prev => ({ ...prev, bloodPressure: e.target.value }))}
                        placeholder="VD: 120/80"
                        className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 w-full"
                        required
                      />
                    </div>
                    {/* Temperature */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="temperature">Thân nhiệt (°C) <span className="text-rose-500">*</span></label>
                      <input 
                        type="number"
                        step="0.1"
                        id="temperature"
                        value={checkinVitals.temperature}
                        onChange={(e) => setCheckinVitals(prev => ({ ...prev, temperature: e.target.value }))}
                        placeholder="VD: 36.5"
                        className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 w-full"
                        required
                      />
                    </div>
                    {/* Pulse */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="pulse">Nhịp tim (lần/phút) <span className="text-rose-500">*</span></label>
                      <input 
                        type="number"
                        id="pulse"
                        value={checkinVitals.pulse}
                        onChange={(e) => setCheckinVitals(prev => ({ ...prev, pulse: e.target.value }))}
                        placeholder="VD: 75"
                        className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 w-full"
                        required
                      />
                    </div>
                    {/* SpO2 */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="spo2">Chỉ số SpO2 (%) <span className="text-rose-500">*</span></label>
                      <input 
                        type="number"
                        id="spo2"
                        value={checkinVitals.spo2}
                        onChange={(e) => setCheckinVitals(prev => ({ ...prev, spo2: e.target.value }))}
                        placeholder="VD: 98"
                        className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 w-full"
                        required
                      />
                    </div>
                  </div>

                  {/* Realtime BMI Display */}
                  {(() => {
                    const w = parseFloat(checkinVitals.weight);
                    const h = parseFloat(checkinVitals.height);
                    if (!w || !h || isNaN(w) || isNaN(h) || h <= 0) return null;
                    const bmi = (w / ((h / 100) * (h / 100))).toFixed(1);
                    const cat = bmiCategory(bmi);
                    if (!cat) return null;
                    return (
                      <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-250 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-bold">Chỉ số khối cơ thể (BMI):</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-800 font-black text-sm">{bmi}</strong>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cat.color}`}>{cat.text}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Doctor and Clinic Room Allocation */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 text-xs flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-teal-600" /> Phân bổ phòng khám &amp; Bác sĩ
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Doctor Selector */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="checkinDoc">Chỉ định Bác sĩ khám</label>
                      <select 
                        id="checkinDoc"
                        value={checkinVitals.doctorId}
                        onChange={(e) => setCheckinVitals(prev => ({ ...prev, doctorId: e.target.value }))}
                        className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 cursor-pointer w-full"
                      >
                        {doctors.map(doc => (
                          <option key={doc.id} value={doc.id}>{doc.name} - ({doc.title})</option>
                        ))}
                      </select>
                    </div>

                    {/* Clinic Room Selector */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="clinicRoom">Phòng khám chỉ định</label>
                      <select 
                        id="clinicRoom"
                        value={checkinVitals.clinicRoom}
                        onChange={(e) => setCheckinVitals(prev => ({ ...prev, clinicRoom: e.target.value }))}
                        className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 cursor-pointer w-full"
                      >
                        <option value="Phòng khám 101">Phòng khám 101 (Tầng 1)</option>
                        <option value="Phòng khám 102">Phòng khám 102 (Tầng 1)</option>
                        <option value="Phòng chuyên gia 201">Phòng chuyên gia 201 (Tầng 2)</option>
                        <option value="Phòng Laser 202">Phòng Laser 202 (Tầng 2)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => { setIsCheckinModalOpen(false); setCheckinApt(null); }}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all cursor-pointer bg-white text-xs"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 text-white font-bold hover:shadow-lg hover:shadow-teal-600/10 transition-all cursor-pointer border-none text-xs"
                  >
                    Xác nhận Check-in &amp; In phiếu
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── CLINIC RECEPTION TICKET MODAL ───────────────────────────────────── */}
      <AnimatePresence>
        {isTicketOpen && createdRecord && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTicketOpen(false)}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit backdrop-blur-3xl bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-[101] p-6 flex flex-col gap-5 text-slate-800"
            >
              {/* Receipt Body print template */}
              <div id="print-ticket" className="p-4 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/20 text-center text-xs space-y-4">
                {/* Header */}
                <div>
                  <h4 className="font-extrabold text-sm uppercase text-slate-900 tracking-wide">Phòng Khám Da Liễu DermaSmart</h4>
                  <p className="text-[9px] text-slate-400 font-medium">45 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
                  <p className="text-[9px] text-slate-400 font-medium">Hotline: 1900 6060 | Website: dermasmart.vn</p>
                </div>

                <div className="border-t border-b border-slate-200 py-3 my-2">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block mb-0.5">Số Thứ Tự Khám</span>
                  <strong className="text-4xl font-black text-teal-600 block tracking-tight">
                    {(() => {
                      // Generate a mock ticket number (e.g. STT-08)
                      const parts = createdRecord.id.split('-');
                      const rand = parts[1] ? parseInt(parts[1].substr(-2), 10) || 7 : 7;
                      const num = (rand % 30) + 1;
                      return num < 10 ? `0${num}` : num;
                    })()}
                  </strong>
                  <span className="text-[9px] text-slate-400 font-bold block mt-1">Vui lòng chờ gọi số tại phòng khám</span>
                </div>

                {/* Patient Details */}
                <div className="space-y-1.5 text-left bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-bold">Bệnh nhân:</span>
                    <strong className="text-slate-800">{createdRecord.patient?.fullName}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-bold">Số điện thoại:</span>
                    <span className="text-slate-700 font-semibold">{createdRecord.patient?.phone}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-bold">Ngày sinh:</span>
                    <span className="text-slate-700 font-semibold">{new Date(createdRecord.patient?.dob).toLocaleDateString('vi-VN')}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-bold">Giới tính:</span>
                    <span className="text-slate-700 font-semibold">{createdRecord.patient?.gender}</span>
                  </p>
                </div>

                {/* Vital Signs Details */}
                <div className="space-y-1 text-left bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-[10px]">
                  <h5 className="font-extrabold text-slate-800 text-[11px] mb-1.5 pb-1 border-b border-slate-100 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" /> Chỉ số sinh hiệu ban đầu
                  </h5>
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-slate-600 font-medium">
                    <p>Cân nặng: <strong className="text-slate-800">{createdRecord.vitalSigns?.weight}</strong></p>
                    <p>Chiều cao: <strong className="text-slate-800">{createdRecord.vitalSigns?.height}</strong></p>
                    <p>Nhiệt độ: <strong className="text-slate-800">{createdRecord.vitalSigns?.temperature}</strong></p>
                    <p>Huyết áp: <strong className="text-slate-800">{createdRecord.vitalSigns?.bloodPressure}</strong></p>
                    <p>Nhịp tim: <strong className="text-slate-800">{createdRecord.vitalSigns?.pulse}</strong></p>
                    <p>SpO2: <strong className="text-slate-800">{createdRecord.vitalSigns?.spo2}</strong></p>
                  </div>
                  {(() => {
                    const h = parseFloat(createdRecord.vitalSigns?.height);
                    const w = parseFloat(createdRecord.vitalSigns?.weight);
                    if (!isNaN(h) && !isNaN(w) && h > 0) {
                      const bmi = w / Math.pow(h / 100, 2);
                      let status = 'Bình thường';
                      if (bmi < 18.5) status = 'Thiếu cân';
                      else if (bmi >= 25 && bmi < 30) status = 'Thừa cân';
                      else if (bmi >= 30) status = 'Béo phì';
                      return (
                        <p className="border-t border-slate-100 pt-1.5 mt-1 font-bold text-slate-700">
                          Chỉ số BMI: <strong className="text-teal-600">{bmi.toFixed(1)}</strong> ({status})
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Assigned Details */}
                <div className="space-y-1.5 text-left bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-bold">Dịch vụ:</span>
                    <strong className="text-slate-800">{createdRecord.service}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-bold">Bác sĩ khám:</span>
                    <strong className="text-teal-600">{createdRecord.doctor}</strong>
                  </p>
                  {(() => {
                    const linkedApt = appointments.find(a => a.appointment_id === createdRecord.appointmentId || a.id === createdRecord.appointmentId);
                    if (linkedApt?.clinic_room) {
                      return (
                        <p className="flex justify-between">
                          <span className="text-slate-400 font-bold">Phòng khám:</span>
                          <strong className="text-slate-800 font-bold">{linkedApt.clinic_room}</strong>
                        </p>
                      );
                    }
                    return null;
                  })()}
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-bold">Thời gian vào:</span>
                    <span className="text-slate-500 font-semibold">{createdRecord.date} {createdRecord.time}</span>
                  </p>
                </div>

                <div className="text-[10px] text-slate-400 italic pt-2">
                  Chúc quý khách luôn có làn da khỏe đẹp!
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsTicketOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer bg-white"
                >
                  Đóng lại
                </button>
                <button 
                  onClick={() => {
                    showToast('Đang gửi lệnh in phiếu...', 'success');
                    // Simulation
                    const printContent = document.getElementById('print-ticket').innerHTML;
                    const originalContent = document.body.innerHTML;
                    console.log('Printing Ticket Content:', printContent);
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 text-white text-xs font-bold hover:shadow-lg hover:shadow-teal-600/10 active:scale-95 transition-all cursor-pointer border-none flex justify-center items-center gap-1"
                >
                  <Printer className="w-4 h-4" /> In phiếu nhận
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── CUSTOM ANIMATED TOAST NOTIFICATION ─────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: "-50%" }}
            className={`fixed bottom-6 left-1/2 z-[110] p-4 rounded-2xl shadow-xl backdrop-blur-xl flex items-center gap-3 border ${
              toast.type === 'success'
                ? 'bg-emerald-600/90 border-emerald-500 text-white shadow-emerald-600/20'
                : toast.type === 'info'
                  ? 'bg-sky-600/90 border-sky-500 text-white shadow-sky-600/20'
                  : 'bg-rose-600/90 border-rose-500 text-white shadow-rose-600/20'
            }`}
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              {toast.type === 'success' ? (
                <CheckSquare className="w-3.5 h-3.5" />
              ) : toast.type === 'info' ? (
                <Sparkles className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
            </div>
            <p className="text-xs font-bold whitespace-nowrap">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
