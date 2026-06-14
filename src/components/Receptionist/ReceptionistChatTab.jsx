import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, MessageSquare, User, Clock, Phone, Mail } from 'lucide-react';
import { ReceptionistChatModel } from '../../models/ChatModel';

export default function ReceptionistChatTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [patientsList, setPatientsList] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, selectedPatientId]);

  // Load patient list and their latest messages with the receptionist
  const loadPatientsAndChats = () => {
    const allMsgs = ReceptionistChatModel.getAllMessages();

    // 1. Find all unique patientIds that have messages
    const uniquePatientIds = [...new Set(allMsgs?.map(msg => msg.patientId)?.filter?.(Boolean))];

    // 2. Process each unique patient
    const processedPatients = uniquePatientIds?.map?.(patientId => {
      const patMsgs = allMsgs?.filter?.(msg => msg.patientId === patientId);
      
      // Find latest message for this patient
      const sortedMsgs = [...patMsgs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const latestMsg = sortedMsgs[0] || null;

      // Try to find matching patient in ([])
      const patientMatch = ([]).find(p => p.id === patientId);

      let fullName = 'Bệnh nhân';
      let phone = 'Chưa có SĐT';
      let email = 'Chưa có Email';
      let avatar = `https://i.pravatar.cc/150?u=${patientId}`;

      if (([])) {
        fullName = ([]).fullName;
        phone = ([]).phone || 'Chưa có SĐT';
        email = ([]).email || 'Chưa có Email';
        avatar = ([]).avatar || avatar;
      } else {
        // Not in ([]) (e.g. registered user or guest)
        // Find any message sent by the patient to resolve their name
        const patientSentMsg = patMsgs.find(msg => msg.senderRole === 'PATIENT');
        if (patientSentMsg) {
          fullName = patientSentMsg.senderName;
        } else if (patientId === 'pat-guest') {
          fullName = 'Khách viếng thăm';
        }
      }

      return {
        id: patientId,
        fullName,
        phone,
        email,
        avatar,
        latestMsgText: latestMsg ? latestMsg.text : 'Chưa có tin nhắn',
        latestMsgTime: latestMsg ? new Date(latestMsg.timestamp) : null,
        hasChat: true
      };
    });

    // Sort patients by latest message time descending
    processedPatients.sort((a, b) => {
      if (!a.latestMsgTime) return 1;
      if (!b.latestMsgTime) return -1;
      return b.latestMsgTime - a.latestMsgTime;
    });

    setPatientsList(processedPatients);
  };

  // Initial load and polling for patient list & current active conversation
  useEffect(() => {
    loadPatientsAndChats();

    const interval = setInterval(() => {
      loadPatientsAndChats();
      if (selectedPatientId) {
        const msgs = ReceptionistChatModel.getMessagesForPatient(selectedPatientId);
        setConversation(msgs);
      }
    }, 2000); // 2s polling

    return () => clearInterval(interval);
  }, [selectedPatientId]);

  // Load conversation when selected patient changes
  useEffect(() => {
    if (selectedPatientId) {
      const msgs = ReceptionistChatModel.getMessagesForPatient(selectedPatientId);
      setConversation(msgs);
    } else {
      setConversation([]);
    }
  }, [selectedPatientId]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !selectedPatientId) return;

    const newMsg = ReceptionistChatModel.addMessage({
      senderId: 'staff-01',
      senderName: 'Lễ tân Hoàng Anh',
      senderRole: 'RECEPTIONIST',
      text: inputValue.trim(),
      mode: 'Live',
      patientId: selectedPatientId
    });

    setConversation(prev => [...prev, newMsg]);
    setInputValue('');
    loadPatientsAndChats();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredPatients = patientsList?.filter?.(pat => 
    pat.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pat.phone.includes(searchTerm));

  const selectedPatient = patientsList.find(p => p.id === selectedPatientId);

  return (
    <div className="w-full h-[calc(100vh-160px)] backdrop-blur-2xl bg-white/70 border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row">
      {/* Left Pane: Patients Sidebar */}
      <div className="w-full md:w-80 shrink-0 border-r border-slate-200/50 flex flex-col h-full bg-slate-50/40">
        {/* Search */}
        <div className="p-4 border-b border-slate-200/50 bg-white/30 shrink-0">
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
            filteredPatients?.map?.(pat => {
              const isActive = pat.id === selectedPatientId;
              const hasNew = pat.hasChat && pat.latestMsgText !== 'Chưa có tin nhắn nào';
              
              return (
                <div
                  key={pat.id}
                  onClick={() => setSelectedPatientId(pat.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer shadow-sm group ${
                    isActive
                      ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/5'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={pat.avatar}
                      alt={pat.fullName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm"
                    />
                    {pat.hasChat && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className={`text-xs font-bold transition-colors truncate ${isActive ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {pat.fullName}
                      </h4>
                      {pat.latestMsgTime && (
                        <span className="text-[9px] text-slate-400 font-semibold shrink-0">
                          {pat.latestMsgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] truncate mt-1 ${isActive ? 'text-emerald-600/80' : 'text-slate-400'} font-medium`}>
                      {pat.latestMsgText}
                    </p>
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
                conversation?.map?.(msg => {
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
                onChange={(e) => setInputValue(e.target.value)}
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
