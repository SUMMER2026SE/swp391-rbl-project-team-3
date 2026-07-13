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
  imageUrlFromMessage,
} from '../../models/ChatModel';
import { useAuth } from '../../context/AuthContext';
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
  // Real agent identity — every receptionist used to sign as 'staff-01' /
  // 'Lễ tân Hoàng Anh', making concurrent agents indistinguishable.
  const { user } = useAuth();
  const agentId = user?.id || 'staff-01';
  const agentName = user?.name || 'Lễ tân DermaSmart';

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

  // On selecting a patient: load history and clear unread. Deliberately NOT
  // claiming here — merely peeking at a thread used to flip it to WITH_AGENT,
  // showing the patient "Lễ tân đang hỗ trợ bạn" before anyone replied. The
  // claim now happens on the first actual reply (handleSend).
  useEffect(() => {
    if (!selectedPatientId) { setConversation([]); return; }
    loadConversation(selectedPatientId);
    ChatSessionModel.markRead(selectedPatientId);
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
        senderId: agentId,
        senderName: agentName,
        senderRole: 'RECEPTIONIST',
        text: currentText,
        mode: 'Live',
        patientId: selectedPatientId,
      });
      if (newMsg) setConversation((prev) => [...prev, newMsg]);
      // Replying claims the conversation + marks it read.
      await ChatSessionModel.claim(selectedPatientId, agentId);
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
      // Tell the patient the session ended — their banner used to just vanish
      // with no explanation. Lands in their widget (or its unread badge).
      const note = await ReceptionistChatModel.addMessage({
        senderId: 'system',
        senderName: 'DermaSmart',
        senderRole: 'BOT',
        text: 'Lễ tân đã kết thúc phiên hỗ trợ. Nếu cần thêm trợ giúp, bạn có thể hỏi DermaSmart AI hoặc bấm "Gặp Lễ tân" bất cứ lúc nào ạ. Cảm ơn bạn!',
        mode: 'Live',
        patientId: selectedPatientId,
      });
      if (note) setConversation((prev) => (prev.some((m) => m.id === note.id) ? prev : [...prev, note]));
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
      className={`w-full ${GLASS_BASE} overflow-hidden flex flex-col md:flex-row transition-all duration-300`}
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
              className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 custom-scrollbar min-h-0"
              style={{ scrollbarWidth: 'thin' }}
            >
              {conversation.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/20 flex items-center justify-center mb-4 shadow-inner">
                    <MessageSquare className="w-8 h-8 text-teal-500/70" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Chưa có tin nhắn hỗ trợ</p>
                  <p className="text-xs mt-1 text-slate-400 font-semibold">Nhập tin nhắn bên dưới để hỗ trợ bệnh nhân.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {conversation.map((msg, i) => {
                    const isPatient = msg.senderRole === 'PATIENT';
                    const isAI = msg.senderRole === 'BOT';
                    // Messenger-style grouping of consecutive same-sender messages.
                    const prev = conversation[i - 1];
                    const next = conversation[i + 1];
                    const samePrev = prev && prev.senderRole === msg.senderRole;
                    const sameNext = next && next.senderRole === msg.senderRole;
                    const isFirst = !samePrev;   // top of a group  → show name + time
                    const isLast = !sameNext;    // bottom of group → show avatar
                    // Per-corner radii: the sender-facing side "welds" together within a
                    // group (small radius on the connecting corners), the outer side stays round.
                    const R = 18, r = 5;
                    const radii = isPatient
                      ? { borderTopLeftRadius: samePrev ? r : R, borderBottomLeftRadius: sameNext ? r : R, borderTopRightRadius: R, borderBottomRightRadius: R }
                      : { borderTopRightRadius: samePrev ? r : R, borderBottomRightRadius: sameNext ? r : R, borderTopLeftRadius: R, borderBottomLeftRadius: R };
                    return (
                      <motion.div
                        key={msg.id || i}
                        layout="position"
                        initial={{ opacity: 0, x: isPatient ? -14 : 14, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 280, mass: 0.7 }}
                        className={`flex items-end gap-2 ${samePrev ? 'mt-0.5' : 'mt-4 first:mt-0'} ${isPatient ? 'flex-row' : 'flex-row-reverse'} justify-start`}
                      >
                        {/* Avatar rail — fixed-width spacer; avatar shown on the group's last bubble. */}
                        <div className="w-7 shrink-0 self-end">
                          {isLast && isPatient && (
                            <img src={selectedPatient.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-white shadow-sm" />
                          )}
                          {isLast && isAI && (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-sm shadow-sky-500/30">
                              <Bot className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                          {isLast && !isPatient && !isAI && (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm shadow-teal-600/30">
                              <UserCheck className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                        </div>

                        <div className={`flex flex-col max-w-[80%] sm:max-w-[68%] ${isPatient ? 'items-start' : 'items-end'}`}>
                          {isFirst && (
                            <span className="text-[9px] text-slate-400 font-bold mb-1 px-1 flex items-center gap-1">
                              {isPatient ? msg.senderName : (isAI ? 'Trợ lý AI' : 'Lễ tân')}
                              <span className="text-slate-300">•</span>
                              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          )}

                          {(() => {
                            const imageUrl = imageUrlFromMessage(msg.text);
                            if (imageUrl) {
                              return (
                                <a href={imageUrl} target="_blank" rel="noopener noreferrer" style={radii} className="block p-1 bg-white/80 border border-white/90 shadow-sm overflow-hidden">
                                  <img src={imageUrl} alt="Ảnh bệnh nhân gửi" loading="lazy" className="rounded-xl max-h-56 max-w-full object-cover" />
                                </a>
                              );
                            }
                            return (
                              <div
                                style={radii}
                                className={`px-4 py-2.5 text-xs leading-relaxed break-words transition-shadow ${
                                  isPatient
                                    ? 'bg-white/80 backdrop-blur-sm border border-white/90 text-slate-800 shadow-sm shadow-slate-900/5'
                                    : isAI
                                    ? 'bg-gradient-to-br from-sky-50 to-indigo-50/70 border border-sky-100 text-slate-700 font-medium shadow-sm'
                                    : 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-600/25'
                                }`}
                              >
                                {msg.text}
                              </div>
                            );
                          })()}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Typing indicator — mirrors an incoming patient bubble ── */}
            <AnimatePresence>
              {selectedPatient.patientTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 sm:px-6 pb-1 flex items-end gap-2 shrink-0"
                >
                  <img src={selectedPatient.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-white shadow-sm shrink-0" />
                  <div style={{ borderRadius: 18, borderTopLeftRadius: 6 }} className="bg-white/80 backdrop-blur-sm border border-white/90 px-4 py-3 shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Bottom Panel: Canned Responses + Input ── */}
            <div className="border-t border-slate-200/50 bg-white/80 backdrop-blur-md p-3 sm:p-4 shrink-0 space-y-2 sm:space-y-3 z-10 shadow-lg shadow-black/5">
              {/* Quick Canned Responses Strip */}
              <AnimatePresence initial={false}>
                {showCanned && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {CANNED_RESPONSES.map((temp, index) => (
                        <motion.button
                          key={index}
                          type="button"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => setInputValue(temp)}
                          className="bg-white/50 hover:bg-teal-50 border border-white/70 hover:border-teal-200 hover:text-teal-700 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-full cursor-pointer transition-all whitespace-nowrap shrink-0 shadow-sm active:scale-95"
                        >
                          {temp}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Box */}
              <form onSubmit={handleSend} className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowCanned(!showCanned)}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0 ${
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
                  className={`${GLASS_INPUT} !rounded-full px-5 py-3 text-xs flex-1 font-semibold min-w-0`}
                />

                <motion.button
                  type="submit"
                  disabled={!inputValue.trim()}
                  whileTap={inputValue.trim() ? { scale: 0.9 } : {}}
                  animate={inputValue.trim() ? { scale: 1 } : { scale: 0.96 }}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-none cursor-pointer transition-all shrink-0 ${
                    inputValue.trim()
                      ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-600/30 ring-2 ring-teal-500/20'
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  <Send size={16} className={inputValue.trim() ? 'translate-x-px' : ''} />
                </motion.button>
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
