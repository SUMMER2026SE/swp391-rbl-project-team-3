import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  Bot, 
  User, 
  FileText,
  Clock,
  Sparkles,
  CheckCircle
} from 'lucide-react';

export default function LiveChatDrawer({ patient, isOpen, onClose, messages, onSendMessage }) {
  const [inputValue, setInputValue] = useState('');
  const [showQuickProfile, setShowQuickProfile] = useState(true);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(patient.id, inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Canned responses (Canned Templates for Receptionists)
  const cannedTemplates = [
    "Dạ em chào anh/chị, em có thể giúp gì cho anh/chị ạ?",
    "Lịch hẹn khám của anh/chị đã được xác nhận thành công ạ.",
    "Dạ hiện tại bác sĩ đang bận ca phẫu thuật, em xin phép gọi lại sau ít phút ạ.",
    "Anh/Chị nhớ đến sớm 15 phút trước giờ hẹn để làm thủ tục check-in nhé ạ."
  ];

  // Filter messages related to this patient
  // Show messages where senderId === patient.id OR receiverId === patient.id
  // Also fallback: if the database has simple mock messages, we associate them with the active patient if patientId is not specified
  const chatHistory = (messages || []).filter(msg => 
    msg.patientId === patient?.id || 
    msg.senderId === patient?.id || 
    msg.receiverId === patient?.id ||
    // For pat-01, show all mock messages as it's the primary demo user
    (patient?.id === 'pat-01' && (msg.senderId === 'bot' || msg.senderId === 'staff-01' || msg.senderId === 'pat-01'))
  );

  return (
    <AnimatePresence>
      {isOpen && patient && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 transition-opacity"
          />

          {/* Glass Drawer Panel */}
          <motion.aside
            initial={{ x: "100%", opacity: 0.95 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="w-96 backdrop-blur-3xl bg-white/90 border-l border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.15)] z-50 fixed right-0 top-0 h-full flex flex-col overflow-hidden"
          >
            {/* Header: Patient Info and Status */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center bg-teal-50">
                    {patient.avatar ? (
                      <img 
                        src={patient.avatar} 
                        alt={patient.fullName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-teal-600" />
                    )}
                  </div>
                  {/* Status Indicator (Online Green Pulse) */}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 tracking-tight leading-tight">
                    {patient.fullName}
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100/50 flex items-center gap-0.5 mt-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> Trực tuyến
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center border-none cursor-pointer active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Profile Collapse Panel (Staff-oriented Context Feature) */}
            <div className="shrink-0 border-b border-slate-100/60 bg-slate-50/30">
              <button
                onClick={() => setShowQuickProfile(!showQuickProfile)}
                className="w-full py-2.5 px-5 flex items-center justify-between text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-teal-600 border-none cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Hồ Sơ Nhanh Bệnh Nhân
                </span>
                {showQuickProfile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <AnimatePresence initial={false}>
                {showQuickProfile && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 pt-1 space-y-2 text-xs font-medium text-slate-600">
                      <div className="grid grid-cols-2 gap-2">
                        <p className="flex items-center gap-1.5 text-[11px] bg-white/60 p-2 rounded-xl border border-slate-100 shadow-sm">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{patient.phone}</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-[11px] bg-white/60 p-2 rounded-xl border border-slate-100 shadow-sm">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{patient.email || "N/A"}</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <p className="flex items-center gap-1.5 text-[11px] bg-white/60 p-2 rounded-xl border border-slate-100 shadow-sm">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Sinh nhật: {patient.dob || "N/A"}</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-[11px] bg-white/60 p-2 rounded-xl border border-slate-100 shadow-sm">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Giới tính: {patient.gender || "Chưa cập nhật"}</span>
                        </p>
                      </div>

                      <p className="flex items-start gap-1.5 text-[11px] bg-white/60 p-2 rounded-xl border border-slate-100 shadow-sm">
                        <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                        <span>{patient.address || "Chưa có địa chỉ"}</span>
                      </p>

                      {patient.medicalHistory && patient.medicalHistory.length > 0 && (
                        <div className="bg-teal-50/40 p-2 rounded-xl border border-teal-100/50">
                          <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">Tiền sử bệnh lý:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {patient?.medicalHistory?.map((hist, i) => (
                              <span key={i} className="text-[9px] font-bold bg-white text-teal-700 border border-teal-200/40 px-1.5 py-0.5 rounded-md">
                                {hist}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Chat Messages Area */}
            <div 
              className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50/50 scroll-smooth"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.1) transparent' }}
            >
              {chatHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-sm text-slate-400">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">Chưa có tin nhắn</h4>
                  <p className="text-xs text-slate-400 font-medium max-w-[200px] mt-1">
                    Hãy bắt đầu cuộc trò chuyện trực tiếp để hỗ trợ bệnh nhân.
                  </p>
                </div>
              )}

              {(chatHistory || []).map((msg) => {
                const isPatient = msg.senderRole === 'PATIENT';
                const isAI = msg.senderRole === 'BOT';
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isPatient ? 'items-start' : 'items-end'}`}>
                    {/* Sender Name and Time */}
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-semibold mb-1 px-1">
                      <span>{isPatient ? patient.fullName : (isAI ? "DermaSmart AI" : "Bạn")}</span>
                      <span>•</span>
                      <span>
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isPatient
                          ? 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-sm shadow-sm'
                          : isAI
                            ? 'bg-sky-50 border border-sky-100 text-sky-800 rounded-br-sm shadow-sm flex items-center gap-1.5'
                            : 'bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-br-sm shadow-md shadow-teal-700/10'
                      }`}
                    >
                      {isAI && <Bot className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                      <span>{msg.text}</span>
                    </div>

                    {/* Badge Roles (Bệnh nhân / Lễ tân / AI) */}
                    <span className={`text-[8px] font-bold uppercase tracking-wider mt-1 px-1.5 ${
                      isPatient 
                        ? 'text-slate-400' 
                        : isAI 
                          ? 'text-sky-600 bg-sky-50 border border-sky-200/30 rounded-md px-1 py-0.5' 
                          : 'text-teal-600 bg-teal-50 border border-teal-200/30 rounded-md px-1 py-0.5'
                    }`}>
                      {isPatient ? "Bệnh nhân" : (isAI ? "Trợ lý AI" : "Nhân viên")}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Canned Responses Drawer Row */}
            <div className="px-4 py-2 border-t border-slate-100 bg-white shrink-0 flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {cannedTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(template)}
                  title={template}
                  className="bg-slate-50 hover:bg-teal-50 border border-slate-200/80 hover:border-teal-200 hover:text-teal-700 text-slate-500 text-[10px] font-semibold px-2.5 py-1.5 rounded-xl cursor-pointer transition-all whitespace-nowrap shrink-0 max-w-[150px] truncate"
                >
                  {template}
                </button>
              ))}
            </div>

            {/* Footer Input Area */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn hỗ trợ bệnh nhân..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs flex-1 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition-all font-medium text-slate-800"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border-none cursor-pointer transition-all shrink-0 ${
                  inputValue.trim()
                    ? 'bg-gradient-to-tr from-teal-600 to-sky-600 text-white shadow-md shadow-teal-600/20 hover:scale-105 active:scale-95'
                    : 'bg-slate-100 text-slate-300'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
