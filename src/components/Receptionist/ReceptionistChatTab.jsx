import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, MessageSquare, Clock, Phone, Mail, BellRing } from 'lucide-react';
import {
  ReceptionistChatModel,
  ChatSessionModel,
  CHAT_STATUS,
  subscribeToMessages,
  subscribeToSessions,
  unsubscribe,
} from '../../models/ChatModel';

export default function ReceptionistChatTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [patientsList, setPatientsList] = useState([]);
  const messagesEndRef = useRef(null);
  const agentTypingTimer = useRef(null);
  // Latest selection, readable inside realtime callbacks without re-subscribing.
  const selectedRef = useRef(null);
  useEffect(() => { selectedRef.current = selectedPatientId; }, [selectedPatientId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, selectedPatientId]);

  // Build the conversation list by merging message history with session state
  // (handoff status + the agent's last-read marker → unread count).
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
          phone: 'Chưa có SĐT',
          email: 'Chưa có Email',
          avatar: `https://i.pravatar.cc/150?u=${patientId}`,
          latestMsgText: latestMsg ? latestMsg.text : 'Chưa có tin nhắn',
          latestMsgTime: latestMsg ? new Date(latestMsg.timestamp) : null,
          status: session?.status || CHAT_STATUS.BOT,
          waiting: session?.status === CHAT_STATUS.WAITING,
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

  // ── Realtime: list + active conversation. Safety poll backs up the
  // localStorage-fallback path. Channels torn down on unmount. ──
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

  // On selecting a patient: load history, claim the thread (WITH_AGENT) and
  // clear unread by stamping the read marker.
  useEffect(() => {
    if (!selectedPatientId) { setConversation([]); return; }
    loadConversation(selectedPatientId);
    ChatSessionModel.claim(selectedPatientId, 'staff-01');
    loadPatientsAndChats();
  }, [selectedPatientId, loadConversation, loadPatientsAndChats]);

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

  // Debounced "agent is typing" presence → patient sees "Lễ tân đang gõ…".
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

  const filteredPatients = (patientsList || []).filter(
    (pat) =>
      (pat.fullName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (pat.phone || '').includes(searchTerm || '')
  );

  const selectedPatient = patientsList.find((p) => p.id === selectedPatientId);
  const totalWaiting = patientsList.filter((p) => p.waiting).length;

  return (
    <div className="w-full h-[calc(100vh-160px)] backdrop-blur-2xl bg-white/70 border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row">
      {/* Left Pane: Patients Sidebar */}
      <div className="w-full md:w-80 shrink-0 border-r border-slate-200/50 flex flex-col h-full bg-slate-50/40">
        {/* Search */}
        <div className="p-4 border-b border-slate-200/50 bg-white/30 shrink-0 space-y-2">
          {totalWaiting > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
              <BellRing className="w-3.5 h-3.5 animate-pulse" />
              {totalWaiting} bệnh nhân đang chờ hỗ trợ
            </div>
          )}
          <div className="flex items-center bg-white/80 border border-slate-200/60 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all shadow-sm">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              className="bg-transparent border-none outline-none text-xs placeholder-slate-400 w-full p-0 focus:ring-0"
              placeholder="Tìm bệnh nhân..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Patients List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-semibold">
              Không tìm thấy bệnh nhân nào.
            </div>
          ) : (
            filteredPatients.map((pat) => {
              const isActive = pat.id === selectedPatientId;
              const hasUnread = pat.unreadCount > 0;

              return (
                <div
                  key={pat.id}
                  onClick={() => setSelectedPatientId(pat.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer shadow-sm group ${
                    isActive
                      ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/5'
                      : pat.waiting
                        ? 'bg-amber-50/70 border-amber-200 hover:border-amber-300'
                        : 'bg-white/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={pat.avatar}
                      alt={pat.fullName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm"
                    />
                    {pat.waiting ? (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white">
                        <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping" />
                      </span>
                    ) : (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-1">
                      <h4 className={`text-xs transition-colors truncate ${
                        isActive ? 'text-emerald-700 font-bold' : hasUnread ? 'text-slate-900 font-extrabold' : 'text-slate-800 font-bold'
                      }`}>
                        {pat.fullName}
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {pat.latestMsgTime && (
                          <span className="text-[9px] text-slate-400 font-semibold">
                            {pat.latestMsgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {hasUnread && !isActive && (
                          <span className="min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-extrabold leading-none">
                            {pat.unreadCount > 9 ? '9+' : pat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {pat.waiting && (
                        <span className="text-[8px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-100 border border-amber-200 rounded px-1 py-0.5 shrink-0">
                          Chờ hỗ trợ
                        </span>
                      )}
                      <p className={`text-[10px] truncate ${
                        isActive ? 'text-emerald-600/80' : hasUnread ? 'text-slate-600 font-semibold' : 'text-slate-400'
                      } font-medium`}>
                        {pat.latestMsgText}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* Right Pane: Active Chat Conversation */}
      <div className="flex-grow flex flex-col h-full bg-white/40">
        {selectedPatientId && selectedPatient ? (
          <>
            {/* Active Header */}
            <div className="px-6 py-4 border-b border-slate-200/50 bg-white/50 backdrop-blur-sm flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={selectedPatient.avatar}
                  alt={selectedPatient.fullName}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm"
                />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">{selectedPatient.fullName}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold mt-0.5">
                    <span className="flex items-center gap-1"><Phone size={10} /> {selectedPatient.phone}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Mail size={10} /> {selectedPatient.email}</span>
                  </div>
                </div>
              </div>
              {selectedPatient.waiting && (
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 flex items-center gap-1">
                  <BellRing className="w-3 h-3" /> Đang chờ
                </span>
              )}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-slate-50/20"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.1) transparent' }}
            >
              {conversation.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-10">
                  <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-xs font-semibold">Chưa có tin nhắn hỗ trợ nào giữa bạn và bệnh nhân này.</p>
                  <p className="text-[10px] mt-1 text-slate-400 font-medium">Nhập tin nhắn bên dưới để hỗ trợ bệnh nhân.</p>
                </div>
              ) : (
                conversation.map((msg) => {
                  const isPatient = msg.senderRole === 'PATIENT';
                  const isAI = msg.senderRole === 'BOT';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isPatient ? 'items-start' : 'items-end'}`}>
                      <span className="text-[9px] text-slate-400 font-medium mb-0.5 px-1 flex items-center gap-1">
                        {isPatient ? msg.senderName : (isAI ? 'Trợ lý AI' : 'Bạn')}
                        <Clock size={8} className="ml-1 text-[8px] text-slate-400" />
                        <span className="text-[8px]">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                      <div
                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isPatient
                            ? 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'
                            : isAI
                            ? 'bg-sky-50 border border-sky-100 text-sky-800 rounded-br-md'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-md'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer Area */}
            <form onSubmit={handleSend} className="px-6 py-4 border-t border-slate-200/50 bg-white flex items-center gap-3 shrink-0">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Nhắn tin cho ${selectedPatient.fullName}...`}
                className="bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-slate-900 rounded-2xl px-4 py-3 text-xs flex-1 outline-none font-semibold transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center border-none cursor-pointer transition-all shrink-0 shadow-sm ${
                  inputValue.trim()
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/25 shadow-lg'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-700">Trò chuyện trực tuyến</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1 font-semibold">
              Chọn một bệnh nhân từ danh sách bên trái để bắt đầu chat hỗ trợ trực tuyến và giải đáp thắc mắc.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
