import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Send, 
  MessageSquare, 
  Clock, 
  Phone, 
  Mail, 
  BellRing, 
  CheckCircle, 
  Bot, 
  Check, 
  Sparkles, 
  CornerDownLeft,
  UserCheck,
  ArrowLeft
} from 'lucide-react';
import {
  ReceptionistChatModel,
  ChatSessionModel,
  CHAT_STATUS,
  subscribeToMessages,
  subscribeToSessions,
  unsubscribe,
} from '../../models/ChatModel';
import { GLASS_BASE, GLASS_INPUT } from '../../components/common/GlassCard';

const CANNED_RESPONSES = [
  "Dạ em chào anh/chị, em có thể giúp gì ạ?",
  "Lịch hẹn của anh/chị đã được xác nhận thành công ạ.",
  "Anh/Chị nhớ đến sớm 15 phút trước giờ hẹn nhé ạ.",
  "Dạ bác sĩ đang bận, em xin phép liên hệ lại sau ạ.",
  "Phòng khám mở cửa từ 8h-17h, thứ 2 đến thứ 7 ạ.",
  "Anh/Chị có cần đặt lịch tái khám không ạ?",
];

export default function ReceptionistChatTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [patientsList, setPatientsList] = useState([]);
  const [showCanned, setShowCanned] = useState(true);
  // Mobile: show chat panel vs list panel
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  const messagesEndRef = useRef(null);
  const agentTypingTimer = useRef(null);
  const inputRef = useRef(null);
  
  // Latest selection, readable inside realtime callbacks without re-subscribing.
  const selectedRef = useRef(null);
  useEffect(() => { selectedRef.current = selectedPatientId; }, [selectedPatientId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, selectedPatientId]);

  // Keyboard shortcut: Escape to deselect conversation
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setSelectedPatientId(null);
        setShowMobileChat(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Build the conversation list by merging message history with session state
  const loadPatientsAndChats = useCallback(async () => {
    try {
      const [allMsgs, sessions] = await Promise.all([
        ReceptionistChatModel.getAllMessages(),
        ChatSessionModel.getAll(),
      ]);
      const sessionByPatient = Object.fromEntries((sessions || []).map((s) => [s.patientId, s]));

      const uniquePatientIds = [...new Set((allMsgs || []).map((m) => m.patientId).filter(Boolean))];

      const processed = uniquePatientIds.map((patientId) => {
        const patMsgs = (allMsgs || []).filter((m) => m.patientId === patientId);
        const sortedMsgs = [...patMsgs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const latestMsg = sortedMsgs[0] || null;
        const session = sessionByPatient[patientId] || null;

        // Display name from the patient's own messages (no external roster here).
        let fullName = 'Bệnh nhân';
        const patientSentMsg = patMsgs.find((m) => m.senderRole === 'PATIENT');
        if (patientSentMsg?.senderName) fullName = patientSentMsg.senderName;
        else if (session?.patientName) fullName = session.patientName;
        else if (patientId === 'pat-guest') fullName = 'Khách viếng thăm';

        // Unread = PATIENT messages newer than the agent's last-read marker.
        const lastReadMs = session?.lastReadAt ? new Date(session.lastReadAt).getTime() : 0;
        const unreadCount = patMsgs.filter(
          (m) => m.senderRole === 'PATIENT' && new Date(m.timestamp).getTime() > lastReadMs
        ).length;

        return {
          id: patientId,
          fullName,
          phone: session?.phone || 'Chưa có SĐT',
          email: session?.email || 'Chưa có Email',
          avatar: `https://i.pravatar.cc/150?u=${patientId}`,
          latestMsgText: latestMsg ? latestMsg.text : 'Chưa có tin nhắn',
          latestMsgTime: latestMsg ? new Date(latestMsg.timestamp) : null,
          status: session?.status || CHAT_STATUS.BOT,
          waiting: session?.status === CHAT_STATUS.WAITING,
          patientTyping: session?.patientTyping || false,
          unreadCount,
        };
      });

      // Waiting-for-agent first, then by unread, then by recency.
      processed.sort((a, b) => {
        if (a.waiting !== b.waiting) return a.waiting ? -1 : 1;
        if ((b.unreadCount > 0) !== (a.unreadCount > 0)) return b.unreadCount - a.unreadCount;
        if (!a.latestMsgTime) return 1;
        if (!b.latestMsgTime) return -1;
        return b.latestMsgTime - a.latestMsgTime;
      });

      setPatientsList(processed);
    } catch (err) {
      console.error('Failed to load patients and chats:', err);
    }
  }, []);

  const loadConversation = useCallback(async (patientId) => {
    if (!patientId) { setConversation([]); return; }
    try {
      const msgs = await ReceptionistChatModel.getMessagesForPatient(patientId);
      setConversation(msgs || []);
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
  }, []);

  // Realtime: list + active conversation. Channels torn down on unmount.
  useEffect(() => {
    loadPatientsAndChats();

    const msgChannel = subscribeToMessages({
      onEvent: (type, msg) => {
        loadPatientsAndChats();
        const active = selectedRef.current;
        if (active && msg.patientId === active) {
          if (type === 'INSERT') {
            setConversation((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
            // A new patient message in the open thread is read immediately.
            if (msg.senderRole === 'PATIENT') ChatSessionModel.markRead(active);
          } else {
            setConversation((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
          }
        }
      },
    });

    const sesChannel = subscribeToSessions({ onEvent: () => loadPatientsAndChats() });
    const stopLocal = ChatSessionModel.onLocalChange(() => loadPatientsAndChats());

    const interval = setInterval(() => {
      loadPatientsAndChats();
      if (selectedRef.current) loadConversation(selectedRef.current);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(agentTypingTimer.current);
      unsubscribe(msgChannel);
      unsubscribe(sesChannel);
      stopLocal();
    };
  }, [loadPatientsAndChats, loadConversation]);

  // On selecting a patient: load history, claim the thread (WITH_AGENT) and clear unread.
  useEffect(() => {
    if (!selectedPatientId) { setConversation([]); return; }
    loadConversation(selectedPatientId);
    ChatSessionModel.claim(selectedPatientId, 'staff-01');
    loadPatientsAndChats();
    // Auto-focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  }, [selectedPatientId, loadConversation, loadPatientsAndChats]);

  const handleSelectPatient = (patientId) => {
    setSelectedPatientId(patientId);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    // Optionally keep the selection or clear it
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !selectedPatientId) return;

    const currentText = inputValue.trim();
    setInputValue('');
    clearTimeout(agentTypingTimer.current);
    ChatSessionModel.setAgentTyping(selectedPatientId, false);

    try {
      const newMsg = await ReceptionistChatModel.addMessage({
        senderId: 'staff-01',
        senderName: 'Lễ tân Hoàng Anh',
        senderRole: 'RECEPTIONIST',
        text: currentText,
        mode: 'Live',
        patientId: selectedPatientId,
      });
      if (newMsg) setConversation((prev) => [...prev, newMsg]);
      // Replying claims the conversation + marks it read.
      await ChatSessionModel.claim(selectedPatientId, 'staff-01');
      await loadPatientsAndChats();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (!selectedPatientId) return;
    ChatSessionModel.setAgentTyping(selectedPatientId, true);
    clearTimeout(agentTypingTimer.current);
    agentTypingTimer.current = setTimeout(() => {
      ChatSessionModel.setAgentTyping(selectedPatientId, false);
    }, 2500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResolve = async () => {
    if (!selectedPatientId) return;
    try {
      await ChatSessionModel.setStatus(selectedPatientId, CHAT_STATUS.RESOLVED);
      await loadPatientsAndChats();
    } catch (err) {
      console.error('Failed to resolve:', err);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case CHAT_STATUS.WAITING:
        return { label: 'Chờ hỗ trợ', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: BellRing, pulse: true };
      case CHAT_STATUS.WITH_AGENT:
        return { label: 'Đang hỗ trợ', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, pulse: false };
      case CHAT_STATUS.RESOLVED:
        return { label: 'Đã xong', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: UserCheck, pulse: false };
      default:
        return { label: 'AI Bot', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: Bot, pulse: false };
    }
  };

  const filteredPatients = (patientsList || []).filter(
    (pat) =>
      (pat.fullName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (pat.phone || '').includes(searchTerm || '')
  );

  const selectedPatient = patientsList.find((p) => p.id === selectedPatientId);
  const totalWaiting = patientsList.filter((p) => p.waiting).length;

  return (
    <div
      className={`w-full ${GLASS_BASE} flex flex-col md:flex-row transition-all duration-300`}
      style={{ height: 'calc(100vh - 140px)', minHeight: '480px', maxHeight: 'calc(100vh - 100px)' }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          Left Pane: Patients Sidebar 
          On mobile: hidden when showMobileChat is true
       ═══════════════════════════════════════════════════════════════════ */}
      <div className={`
        w-full md:w-[340px] md:min-w-[300px] md:max-w-[380px]
        shrink-0 border-r border-slate-200/50
        flex flex-col bg-slate-50/20 backdrop-blur-md
        ${showMobileChat ? 'hidden md:flex' : 'flex'}
        overflow-hidden
      `}>
        {/* Search Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/50 bg-white/10 shrink-0 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600 shrink-0" />
              <span className="truncate">Chăm sóc khách hàng</span>
            </h3>
            {totalWaiting > 0 && (
              <span className="flex h-3 w-3 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
          </div>
          
          {totalWaiting > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold shadow-sm"
            >
              <BellRing className="w-4 h-4 animate-bounce text-amber-600 shrink-0" />
              <span>{totalWaiting} bệnh nhân cần lễ tân hỗ trợ</span>
            </motion.div>
          )}

          <div className="relative">
            <input
              className={`${GLASS_INPUT} w-full pl-10 pr-4 py-2.5 text-xs font-semibold`}
              placeholder="Tìm bệnh nhân, số điện thoại..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Patients List — scrollable */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar min-h-0">
          <AnimatePresence initial={false}>
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                Không tìm thấy bệnh nhân nào.
              </div>
            ) : (
              filteredPatients.map((pat, i) => {
                const isActive = pat.id === selectedPatientId;
                const hasUnread = pat.unreadCount > 0;
                const config = getStatusConfig(pat.status);
                const IconComponent = config.icon;

                return (
                  <motion.div
                    key={pat.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    onClick={() => handleSelectPatient(pat.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer shadow-sm group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border-teal-500/40 ring-1 ring-teal-500/20'
                        : pat.waiting
                          ? 'bg-amber-500/5 border-amber-200 hover:bg-amber-500/10'
                          : 'bg-white/50 border-white/60 hover:bg-white/80'
                    }`}
                  >
                    {/* Active side indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-teal-500 to-emerald-500 rounded-r-full" />
                    )}

                    <div className="relative shrink-0">
                      <img
                        src={pat.avatar}
                        alt={pat.fullName}
                        className="w-10 h-10 rounded-2xl object-cover border border-white shadow-md"
                      />
                      {/* Live green ring badge */}
                      {pat.status === CHAT_STATUS.WITH_AGENT ? (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                          <span className="w-1.5 h-1.5 bg-white rounded-full" />
                        </span>
                      ) : pat.waiting ? (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                          <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping" />
                          <span className="w-1.5 h-1.5 bg-white rounded-full relative z-10" />
                        </span>
                      ) : pat.status === CHAT_STATUS.BOT ? (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-sky-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                          <span className="w-1 h-1 bg-white rounded-full" />
                        </span>
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-1">
                        <h4 className={`text-xs transition-colors truncate ${
                          isActive 
                            ? 'text-teal-900 font-extrabold' 
                            : hasUnread 
                              ? 'text-slate-900 font-extrabold' 
                              : 'text-slate-700 font-bold'
                        }`}>
                          {pat.fullName}
                        </h4>
                        
                        {pat.latestMsgTime && (
                          <span className="text-[9px] text-slate-400 font-semibold shrink-0">
                            {pat.latestMsgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1.5 mt-1">
                        <p className={`text-[10px] truncate flex-1 ${
                          isActive 
                            ? 'text-teal-700 font-semibold' 
                            : hasUnread 
                              ? 'text-slate-800 font-extrabold' 
                              : 'text-slate-400 font-medium'
                        }`}>
                          {pat.patientTyping ? (
                            <span className="text-emerald-600 font-bold animate-pulse">Bệnh nhân đang nhập...</span>
                          ) : (
                            pat.latestMsgText
                          )}
                        </p>

                        {/* Unread badge & Status tag */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {hasUnread && !isActive ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold shadow-sm shadow-emerald-500/25">
                              {pat.unreadCount}
                            </span>
                          ) : (
                            <span className={`text-[8px] font-extrabold border rounded-md px-1.5 py-0.5 ${config.color} uppercase tracking-wider flex items-center gap-0.5`}>
                              <IconComponent className="w-2.5 h-2.5" />
                              {config.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          Right Pane: Active Chat Conversation
          On mobile: hidden when showMobileChat is false AND there's a patient selected
       ═══════════════════════════════════════════════════════════════════ */}
      <div className={`
        flex-1 flex flex-col bg-slate-50/10 backdrop-blur-sm relative min-w-0 min-h-0
        ${!showMobileChat ? 'hidden md:flex' : 'flex'}
        overflow-hidden
      `}>
        {selectedPatientId && selectedPatient ? (
          <>
            {/* ── Active Header ── */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200/50 bg-white/40 backdrop-blur-md flex justify-between items-center shrink-0 shadow-sm z-10 gap-2">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile back button */}
                <button
                  onClick={handleBackToList}
                  className="md:hidden p-2 -ml-1 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <img
                  src={selectedPatient.avatar}
                  alt={selectedPatient.fullName}
                  className="w-10 h-10 rounded-2xl object-cover border border-white shadow-md shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 leading-none truncate">
                    {selectedPatient.fullName}
                  </h3>
                  <div className="flex items-center gap-2 sm:gap-3 text-[10px] text-slate-500 font-semibold mt-1 flex-wrap">
                    <span className="flex items-center gap-1 truncate"><Phone size={10} className="text-slate-400 shrink-0" /> {selectedPatient.phone}</span>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <span className="flex items-center gap-1 truncate hidden sm:flex"><Mail size={10} className="text-slate-400 shrink-0" /> {selectedPatient.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold border rounded-full px-2 py-1 items-center gap-1 ${getStatusConfig(selectedPatient.status).color} hidden sm:flex`}>
                  {React.createElement(getStatusConfig(selectedPatient.status).icon, { className: "w-3 h-3" })}
                  {getStatusConfig(selectedPatient.status).label}
                </span>

                {selectedPatient.status !== CHAT_STATUS.RESOLVED && (
                  <button
                    onClick={handleResolve}
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 text-[10px] font-extrabold border-none shadow-sm shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Check className="w-3 h-3" />
                    <span className="hidden sm:inline">Hoàn thành hỗ trợ</span>
                    <span className="sm:hidden">Xong</span>
                  </button>
                )}
              </div>
            </div>

            {/* ── Messages Scroll Area ── */}
            <div 
              className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4 bg-slate-50/10 custom-scrollbar min-h-0"
              style={{ scrollbarWidth: 'thin' }}
            >
              <AnimatePresence initial={false}>
                {conversation.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
                    <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-700">Chưa có tin nhắn hỗ trợ</p>
                    <p className="text-xs mt-1 text-slate-400 font-semibold">Nhập tin nhắn bên dưới để hỗ trợ bệnh nhân.</p>
                  </div>
                ) : (
                  conversation.map((msg, i) => {
                    const isPatient = msg.senderRole === 'PATIENT';
                    const isAI = msg.senderRole === 'BOT';
                    return (
                      <motion.div 
                        key={msg.id || i} 
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={`flex flex-col ${isPatient ? 'items-start' : 'items-end'}`}
                      >
                        <span className="text-[9px] text-slate-400 font-semibold mb-1 px-1 flex items-center gap-1">
                          {isPatient ? msg.senderName : (isAI ? 'Trợ lý AI' : 'Lễ tân')}
                          <span>•</span>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </span>
                        
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isPatient
                              ? 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-md'
                              : isAI
                              ? 'bg-sky-50 border border-sky-100 text-sky-800 rounded-bl-md flex items-center gap-2 font-medium'
                              : 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-br-md shadow-md shadow-teal-600/10'
                          }`}
                        >
                          {isAI && <Bot className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                          <span className="break-words">{msg.text}</span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* ── Typing status bar ── */}
            {selectedPatient.patientTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 sm:px-6 py-2 bg-slate-50/50 flex items-center gap-2 border-t border-slate-100 shrink-0"
              >
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] text-emerald-600 font-extrabold truncate">{selectedPatient.fullName} đang nhập...</span>
              </motion.div>
            )}

            {/* ── Bottom Panel: Canned Responses + Input ── */}
            <div className="border-t border-slate-200/50 bg-white/80 backdrop-blur-md p-3 sm:p-4 shrink-0 space-y-2 sm:space-y-3 z-10 shadow-lg shadow-black/5">
              {/* Quick Canned Responses Strip */}
              {showCanned && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {CANNED_RESPONSES.map((temp, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setInputValue(temp)}
                      className="bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 hover:text-teal-700 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-all whitespace-nowrap shrink-0"
                    >
                      {temp}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Box */}
              <form onSubmit={handleSend} className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowCanned(!showCanned)}
                  className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0 ${
                    showCanned 
                      ? 'bg-teal-50 border-teal-200 text-teal-600' 
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                  }`}
                  title="Mẫu trả lời nhanh"
                >
                  <Sparkles size={16} />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập câu trả lời hỗ trợ bệnh nhân..."
                  className={`${GLASS_INPUT} px-3 sm:px-4 py-3 text-xs flex-1 font-semibold min-w-0`}
                />

                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center border-none cursor-pointer transition-all shrink-0 ${
                    inputValue.trim()
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-600/25 active:scale-95'
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  <Send size={16} />
                </button>
              </form>
              
              <div className="flex justify-between items-center px-1">
                <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
                  <CornerDownLeft size={10} /> Nhấn <strong>Enter</strong> để gửi tin nhắn
                </span>
                <span className="text-[9px] text-slate-400 font-semibold hidden sm:inline">
                  Mã bệnh nhân: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 text-[8px]">{selectedPatient.id}</code>
                </span>
              </div>
            </div>
          </>
        ) : (
          /* ── Empty state: no patient selected ── */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/20 flex items-center justify-center mb-5 shadow-inner">
                <MessageSquare className="w-9 h-9 text-teal-600" />
              </div>
              <h3 className="font-extrabold text-base text-slate-700">Chưa chọn bệnh nhân</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-2 font-bold leading-relaxed">
                Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin tư vấn trực tiếp.
              </p>
              <span className="text-[10px] text-slate-300 mt-6 font-semibold border border-slate-100 rounded-lg px-2 py-1">
                Phím tắt: ESC để quay lại
              </span>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
