import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, Headphones, ChevronLeft, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ChatModel, ReceptionistChatModel } from '../../models/ChatModel';

export default function FloatingChatbot({ onBookAppointment, onAIScan }) {
  const { user } = useAuth();
  const patientId = user?.id 
    ? (String(user.id).startsWith('pat-') ? String(user.id) : `pat-${user.id}`) 
    : 'pat-guest';
  const patientName = user?.name || 'Khách';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState('AI'); // 'AI' | 'Live'
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [isOpen, messages]);

  // Polling for live chat/AI messages between this patient and receptionist/AI
  useEffect(() => {
    if (!isOpen) return;

    const fetchMsgs = () => {
      let msgs = ReceptionistChatModel.getMessagesForPatient(patientId);
      if (msgs.length === 0) {
        // Auto-seed first AI welcome message
        ReceptionistChatModel.addMessage({
          senderId: 'bot',
          senderName: 'DermaSmart AI',
          senderRole: 'BOT',
          text: 'Xin chào! Tôi là trợ lý AI của DermaSmart. Tôi có thể giúp bạn đặt lịch khám, kiểm tra tình trạng da hoặc giải đáp thắc mắc. Bạn cần hỗ trợ gì hôm nay?',
          mode: 'AI',
          patientId: patientId
        });
        msgs = ReceptionistChatModel.getMessagesForPatient(patientId);
      }
      setMessages(msgs);
    };

    fetchMsgs();
    const interval = setInterval(fetchMsgs, 2000);
    return () => clearInterval(interval);
  }, [isOpen, patientId]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    console.log("DEBUG - FloatingChatbot sending:", {
      patientId,
      patientName,
      text: inputValue.trim()
    });

    const newMsg = ReceptionistChatModel.addMessage({
      senderId: patientId,
      senderName: patientName,
      senderRole: 'PATIENT',
      text: inputValue.trim(),
      mode,
      patientId: patientId
    });

    setMessages((prev) => [...prev, newMsg]);
    setInputValue('');

    // Simulate response after 1-2s
    if (mode === 'AI') {
      setTimeout(() => {
        ReceptionistChatModel.addMessage({
          senderId: 'bot',
          senderName: 'DermaSmart AI',
          senderRole: 'BOT',
          text: 'Cảm ơn bạn đã nhắn tin! Tôi đang xử lý yêu cầu của bạn. Bạn có thể cho tôi biết thêm chi tiết không?',
          mode: 'AI',
          patientId: patientId
        });
        setMessages(ReceptionistChatModel.getMessagesForPatient(patientId));
      }, 1000);
    } else if (mode === 'Live') {
      setTimeout(() => {
        // Only auto-reply if the receptionist hasn't replied yet to avoid double auto-replies
        const currentMsgs = ReceptionistChatModel.getMessagesForPatient(patientId);
        const lastMsg = currentMsgs[currentMsgs.length - 1];
        if (lastMsg && lastMsg.senderRole === 'PATIENT') {
          ReceptionistChatModel.addMessage({
            senderId: 'staff-01',
            senderName: 'Lễ tân Hoàng Anh',
            senderRole: 'RECEPTIONIST',
            text: 'Dạ em đã nhận được tin nhắn của anh/chị. Em sẽ kiểm tra và phản hồi ngay ạ!',
            mode: 'Live',
            patientId: patientId
          });
          setMessages(ReceptionistChatModel.getMessagesForPatient(patientId));
        }
      }, 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: '📅 Đặt lịch khám', action: () => onBookAppointment?.() },
    { label: '🤖 Soi da AI', action: () => onAIScan?.() },
    { label: '💰 Bảng giá', action: () => {} },
    { label: '💊 Liệu trình', action: () => {} },
  ];

  const filteredMessages = messages?.filter?.((msg) => mode === 'AI' ? msg.mode === 'AI' : msg.mode === 'Live');

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {/* ── Floating Button ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="relative w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 border-none cursor-pointer"
          >
            <MessageCircle className="w-6 h-6" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping" />
          </motion.button>
        )}
      </AnimatePresence>
      {/* ── Chat Window ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, originX: 1, originY: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-80 h-[28rem] backdrop-blur-3xl bg-white/80 border border-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* ── Header ── */}
            <div className="bg-gradient-to-r from-emerald-500 to-sky-500 px-4 py-3 flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <h3 className="text-white font-bold text-xs tracking-tight truncate max-w-[180px]">
                    DermaSmart Hỗ trợ
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center border-none cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Mode Toggle */}
              <div className="flex gap-1 bg-white/15 rounded-full p-0.5">
                <button
                  onClick={() => setMode('AI')}
                  className={`flex-1 flex items-center justify-center gap-1 px-1 py-1.5 rounded-full text-[10px] font-semibold transition-all border-none cursor-pointer ${
                    mode === 'AI'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'bg-transparent text-white/85 hover:text-white'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  AI Bot
                </button>
                <button
                  onClick={() => setMode('Live')}
                  className={`flex-1 flex items-center justify-center gap-1 px-1 py-1.5 rounded-full text-[10px] font-semibold transition-all border-none cursor-pointer ${
                    mode === 'Live'
                      ? 'bg-white text-sky-700 shadow-sm'
                      : 'bg-transparent text-white/85 hover:text-white'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  Lễ tân
                </button>
              </div>
            </div>

            {/* ── Messages Body ── */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-smooth bg-slate-50/50"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.1) transparent' }}
            >
              {filteredMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                    {mode === 'AI' ? (
                      <Bot className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <Headphones className="w-6 h-6 text-sky-500" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium px-4">
                    {mode === 'AI' 
                      ? 'Hãy đặt câu hỏi cho AI trợ lý!' 
                      : 'Nhân viên sẽ phản hồi bạn trong giây lát.'}
                  </p>
                </div>
              )}

              {filteredMessages?.map?.((msg) => {
                const isPatient = msg.senderRole === 'PATIENT';
                return (
                  <div key={msg.id} className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] text-slate-400 font-medium mb-0.5 px-1">
                      {isPatient ? 'Bạn' : msg.senderName}
                    </span>
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                        isPatient
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-md shadow-sm'
                          : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-md shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Quick Actions ── */}
            <div className="px-3 py-2 flex gap-1.5 overflow-x-auto shrink-0 bg-slate-50/30 border-t border-slate-100"
              style={{ scrollbarWidth: 'none' }}
            >
              {quickActions?.map?.((qa, idx) => (
                <button
                  key={idx}
                  onClick={qa.action}
                  className="bg-white border border-slate-200 rounded-full px-3 py-1 text-[10px] font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  {qa.label}
                </button>
              ))}
            </div>

            {/* ── Footer Input ── */}
            <div className="px-3 py-2.5 border-t border-slate-100 flex items-center gap-2 shrink-0 bg-white">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs flex-1 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer transition-all shrink-0 ${
                  inputValue.trim()
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20 hover:bg-teal-600'
                    : 'bg-slate-100 text-slate-300'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
