import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Headphones, Calendar, ScanLine, BadgeDollarSign, Pill, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  ReceptionistChatModel,
  ChatSessionModel,
  CHAT_STATUS,
  subscribeToMessages,
  subscribeToSessions,
  unsubscribe,
} from '../../models/ChatModel';
import { generateBotReply, isHandoffReply } from '../../services/GeminiService';
import './FloatingChatbot.css';

// Phrases that signal the patient wants a real human → auto-escalate from AI.
const HANDOFF_KEYWORDS = ['gặp lễ tân', 'gặp nhân viên', 'gặp người', 'người thật', 'nhân viên tư vấn', 'tư vấn viên', 'nói chuyện với người', 'tổng đài', 'hỗ trợ trực tiếp'];
const wantsHuman = (text) => {
  const t = (text || '').toLowerCase();
  return HANDOFF_KEYWORDS.some((k) => t.includes(k));
};

/* ───────────────────────── Sub-components ───────────────────────── */

function ModeToggle({ mode, setMode }) {
  const tabs = [
    { id: 'AI', label: 'DermaSmart AI', Icon: Bot },
    { id: 'Live', label: 'Lễ tân', Icon: Headphones },
  ];
  return (
    <div className="relative flex p-1 rounded-full bg-white/10 border border-white/15">
      {tabs.map(({ id, label, Icon }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            onClick={() => setMode(id)}
            className="relative flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer border-none bg-transparent z-10 transition-colors"
            style={{ color: active ? '#0b1220' : 'rgba(255,255,255,0.75)' }}
          >
            {active && (
              <motion.span
                layoutId="lg-mode-pill"
                className="absolute inset-0 rounded-full bg-white shadow-lg"
                style={{ zIndex: -1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <Icon className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* Streams the bot's text out character-by-character (ChatGPT/Gemini feel).
   Only the *latest* message types; older history renders instantly so it
   never re-types when the chat is reopened or the list re-renders. */
function TypewriterMessage({ text, isLatest, onTextUpdate }) {
  const isLatestRef = useRef(isLatest);
  const [displayedText, setDisplayedText] = useState(isLatestRef.current ? '' : text);
  const [isStreaming, setIsStreaming] = useState(isLatestRef.current);
  const typedRef = useRef(!isLatestRef.current);

  useEffect(() => {
    if (!isStreaming || typedRef.current) return;

    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setIsStreaming(false);
        typedRef.current = true;
      }
    }, 18);

    return () => clearInterval(id);
  }, [text, isStreaming]);

  useEffect(() => {
    onTextUpdate?.();
  }, [displayedText, onTextUpdate]);

  return (
    <>
      {displayedText}
      {isStreaming && <span className="animate-pulse ml-1">▋</span>}
    </>
  );
}

function MessageBubble({ msg, isLatest, onTextUpdate }) {
  const isPatient = msg.senderRole === 'PATIENT';
  const isBot = msg.senderRole === 'BOT';
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}
    >
      <span className="text-[10px] font-medium text-white/45 mb-1 px-1.5">
        {isPatient ? 'Bạn' : msg.senderName}
      </span>
      <div
        data-wave
        className={
          isPatient
            ? 'max-w-[78%] px-4 py-2.5 rounded-2xl rounded-br-md text-sm leading-relaxed text-white shadow-lg shadow-sky-900/30 bg-gradient-to-br from-cyan-400 via-sky-500 to-violet-500'
            : 'lg-bubble-in max-w-[78%] px-4 py-2.5 rounded-2xl rounded-bl-md text-sm leading-relaxed text-white/90 shadow-lg shadow-black/20'
        }
      >
        {isBot
          ? <TypewriterMessage text={msg.text} isLatest={isLatest} onTextUpdate={onTextUpdate} />
          : msg.text}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 lg-bubble-in w-fit px-4 py-3 rounded-2xl rounded-bl-md">
      <span className="lg-typing-dot w-2 h-2 rounded-full bg-white/70" />
      <span className="lg-typing-dot w-2 h-2 rounded-full bg-white/70" />
      <span className="lg-typing-dot w-2 h-2 rounded-full bg-white/70" />
    </div>
  );
}

/* ───────────────────────── Main content ───────────────────────── */

function FloatingChatbotContent({ onBookAppointment, onAIScan }) {
  const { user } = useAuth();
  const patientId = user?.id
    ? (String(user.id).startsWith('pat-') ? String(user.id) : `pat-${user.id}`)
    : 'pat-guest';
  const patientName = user?.name || 'Khách';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState('AI'); // 'AI' | 'Live'
  const [isTyping, setIsTyping] = useState(false);
  const [session, setSession] = useState(null); // handoff state (status + agentTyping)

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const patientTypingTimer = useRef(null);

  // Merge an incoming message into state, de-duping by id (realtime INSERT can
  // race the optimistic local append / the safety poll).
  const mergeMessage = useCallback((msg) => {
    if (!msg) return;
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  }, []);

  const escalated = session?.status === CHAT_STATUS.WAITING || session?.status === CHAT_STATUS.WITH_AGENT;

  // Scroll only the inner container — never the page. Prevents layout shift.
  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Called continuously while a message streams. Stays pinned to the bottom
  // (so growing text never hides under the input) but only if the user is
  // already near the bottom — never yanks them away from reading history.
  const keepPinned = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const typedMessageIds = useRef(new Set());

  useEffect(() => {
    if (messages.length > 0 && typedMessageIds.current.size === 0) {
      messages.forEach(m => typedMessageIds.current.add(m.id));
    }
  }, [messages]);

  const filteredMessages = messages?.filter?.(
    (m) => (mode === 'AI' ? m.mode === 'AI' : m.mode === 'Live')
  ) || [];

  useEffect(() => {
    if (isOpen) requestAnimationFrame(scrollToBottom);
  }, [isOpen, messages, isTyping, mode, session?.agentTyping, scrollToBottom]);

  // Lock the page scroll while the overlay owns the viewport
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // "Light wave" shockwave on invoke (ported from CallAI.html runPhysicsMotion):
  // ripples every [data-wave] element outward from the button origin, staggered
  // by distance, so the energy visibly spreads through the UI. WAAPI on these
  // non-Framer elements with fill:'none' → no transform conflict, no residue.
  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const originX = window.innerWidth - 48;   // button corner (bottom-right, 3rem)
    const originY = window.innerHeight - 48;

    // The landing page itself reacts: ALL of its content (wrapped in #lp-stage)
    // is pushed away from the button then settles, so the background visibly
    // moves as the wave passes. Fired immediately — while the radial reveal is
    // still expanding — so the shift is seen before the frost fully covers it.
    // Transform-only on the wrapper; composes with the page's own Framer anims.
    const stage = typeof document !== 'undefined' && document.getElementById('lp-stage');
    if (stage) {
      stage.style.transformOrigin = '50% 0';
      stage.animate(
        [
          { transform: 'translate3d(0, 0, 0) scale(1)' },
          { transform: 'translate3d(-9px, -5px, 0) scale(1.012)', offset: 0.36 },
          { transform: 'translate3d(3px, 1px, 0) scale(1.003)', offset: 0.66 },
          { transform: 'translate3d(0, 0, 0) scale(1)' },
        ],
        { duration: 1050, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'none' }
      );
    }

    // Small lead so the radial reveal has begun and the items are laid out.
    const timer = setTimeout(() => {
      // The visible wave of light expanding across the (blurred) background.
      const sweep = document.querySelector('.lg-wave-sweep');
      if (sweep) {
        sweep.animate(
          [
            { transform: 'translate(-50%, -50%) scale(0.1)', opacity: 0 },
            { transform: 'translate(-50%, -50%) scale(0.55)', opacity: 0.7, offset: 0.2 },
            { transform: 'translate(-50%, -50%) scale(2.6)', opacity: 0 },
          ],
          { duration: 1200, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'none' }
        );
      }

      // Gentle plasma swell as the wave passes. We deliberately do NOT scale the
      // full-screen backdrop-filter here — that's the heaviest op and was a
      // source of stutter; the real page already reacts via #lp-stage.
      const plasma = document.querySelector('.lg-plasma');
      if (plasma) {
        plasma.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(1.03)', offset: 0.4 },
            { transform: 'scale(1)' },
          ],
          { duration: 950, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'none' }
        );
      }

      document.querySelectorAll('[data-wave]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = cx - originX;
        const dy = cy - originY;
        const dist = Math.hypot(dx, dy);
        const delay = Math.min(dist / 1.3, 360); // tighter shockwave travel
        const len = Math.max(dist, 1);
        const nx = dx / len;
        const ny = dy / len;
        const amp = 4; // gentler nudge as the wave passes through

        // Clean nudge-and-return (no recoil keyframe) so each element settles
        // smoothly back to rest without a tiny bounce.
        el.animate(
          [
            { transform: 'translate3d(0,0,0) scale(1)', filter: 'brightness(1)' },
            { transform: `translate3d(${nx * amp}px, ${ny * amp - amp * 0.3}px, 0) scale(1.006)`, filter: 'brightness(1.05)', offset: 0.4 },
            { transform: 'translate3d(0,0,0) scale(1)', filter: 'brightness(1)' },
          ],
          { duration: 520, delay, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'none' }
        );
      });
    }, 140);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // ── Live data while the widget is open ──
  // Primary transport is Supabase Realtime (INSERT/UPDATE on messages +
  // chat_sessions). A slow safety poll covers the localStorage-fallback path
  // and any dropped realtime frames. Both channels are torn down on close.
  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    const seedAndLoad = async () => {
      try {
        let msgs = await ReceptionistChatModel.getMessagesForPatient(patientId);
        if (!active) return;
        if (!msgs || msgs.length === 0) {
          await ReceptionistChatModel.addMessage({
            senderId: 'bot',
            senderName: 'DermaSmart AI',
            senderRole: 'BOT',
            text: 'Xin chào! Tôi là trợ lý AI của DermaSmart. Tôi có thể giúp bạn đặt lịch khám, kiểm tra tình trạng da hoặc giải đáp thắc mắc. Bạn cần hỗ trợ gì hôm nay?',
            mode: 'AI',
            patientId,
          });
          msgs = await ReceptionistChatModel.getMessagesForPatient(patientId);
        }
        if (active) setMessages(msgs || []);
      } catch (err) {
        console.error('Error fetching messages in chatbot:', err);
      }
    };

    const loadSession = async () => {
      try {
        const s = await ChatSessionModel.get(patientId);
        if (active && s) setSession(s);
      } catch (err) {
        console.error('Error loading chat session:', err);
      }
    };

    seedAndLoad();
    loadSession();

    // Realtime: append new messages (de-duped) and patch updates.
    const msgChannel = subscribeToMessages({
      patientId,
      onEvent: (type, msg) => {
        if (!active) return;
        if (type === 'INSERT') mergeMessage(msg);
        else setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
      },
    });

    // Realtime: handoff status + "agent is typing".
    const sesChannel = subscribeToSessions({
      patientId,
      onEvent: (_type, s) => { if (active) setSession(s); },
    });
    const stopLocal = ChatSessionModel.onLocalChange((all) => {
      if (!active) return;
      const mine = all.find((s) => s.patientId === patientId);
      if (mine) setSession(mine);
    });

    // Safety net (localStorage fallback / missed frames) — slow, non-authoritative.
    const interval = setInterval(seedAndLoad, 5000);

    return () => {
      active = false;
      clearInterval(interval);
      clearTimeout(patientTypingTimer.current);
      unsubscribe(msgChannel);
      unsubscribe(sesChannel);
      stopLocal();
    };
  }, [isOpen, patientId, mergeMessage]);

  // Escalate the conversation to a human receptionist. Posts a system note,
  // flips the session to WAITING_FOR_AGENT, switches the widget to Live mode,
  // and (because the bot only ever replies in AI mode + when not escalated)
  // gracefully silences the bot. Idempotent — safe to call when already live.
  const escalateToHuman = useCallback(async (note) => {
    setMode('Live');
    try {
      await ChatSessionModel.requestAgent(patientId, patientName);
      setSession((prev) => ({ ...(prev || { patientId }), status: CHAT_STATUS.WAITING }));
      const sys = await ReceptionistChatModel.addMessage({
        senderId: 'system',
        senderName: 'DermaSmart',
        senderRole: 'BOT',
        text: note || 'Mình đã kết nối bạn với lễ tân. Vui lòng chờ trong giây lát, nhân viên sẽ phản hồi ngay ạ!',
        mode: 'Live',
        patientId,
      });
      if (sys) mergeMessage(sys);
    } catch (err) {
      console.error('Handoff to receptionist failed:', err);
    }
  }, [patientId, patientName, mergeMessage]);

  // Debounced "patient is typing" presence flag (Live mode only).
  const signalPatientTyping = useCallback(() => {
    if (mode !== 'Live') return;
    ChatSessionModel.setPatientTyping(patientId, true);
    clearTimeout(patientTypingTimer.current);
    patientTypingTimer.current = setTimeout(() => {
      ChatSessionModel.setPatientTyping(patientId, false);
    }, 2500);
  }, [mode, patientId]);

  const handleSend = async () => {
    const currentText = inputValue.trim();
    if (!currentText) return;
    setInputValue('');

    // Keyword handoff: a human request in AI mode escalates instead of replying.
    if (mode === 'AI' && wantsHuman(currentText)) {
      try {
        const userMsg = await ReceptionistChatModel.addMessage({
          senderId: patientId, senderName: patientName, senderRole: 'PATIENT',
          text: currentText, mode: 'Live', patientId,
        });
        if (userMsg) mergeMessage(userMsg);
      } catch (err) { console.error('Failed to send message:', err); }
      await escalateToHuman();
      return;
    }

    try {
      const newMsg = await ReceptionistChatModel.addMessage({
        senderId: patientId,
        senderName: patientName,
        senderRole: 'PATIENT',
        text: currentText,
        mode,
        patientId,
      });
      if (newMsg) mergeMessage(newMsg);

      // The bot answers ONLY in AI mode. Once handed off, it stays silent so the
      // receptionist owns the thread — no duplicate / conflicting auto-replies.
      if (mode === 'AI') {
        setIsTyping(true);
        clearTimeout(patientTypingTimer.current);
        try {
          // Real LLM reply (DermaBot via Gemini). Pass prior AI-mode turns as
          // context; GeminiService maps PATIENT→user / BOT→model. Errors and a
          // missing key both resolve to a graceful maintenance fallback.
          const history = messages.filter((m) => m.mode === 'AI');
          const replyText = await generateBotReply(currentText, history);

          const reply = await ReceptionistChatModel.addMessage({
            senderId: 'bot',
            senderName: 'DermaBot',
            senderRole: 'BOT',
            text: replyText,
            mode: 'AI',
            patientId,
          });
          if (reply) mergeMessage(reply);

          // Auto-handoff: if DermaBot signalled it wants a human, escalate.
          if (isHandoffReply(replyText)) {
            await escalateToHuman('Tôi sẽ kết nối bạn với Lễ tân ngay bây giờ. Vui lòng chờ trong giây lát ạ!');
          }
        } catch (err) {
          console.error('AI (Gemini) reply failed:', err);
        } finally {
          setIsTyping(false);
        }
      } else {
        // Live mode: persist only. A real receptionist replies from their
        // dashboard — no fabricated staff message. Re-arm the waiting state so
        // the agent dashboard re-surfaces the thread after a patient follow-up.
        signalPatientTyping();
        clearTimeout(patientTypingTimer.current);
        ChatSessionModel.setPatientTyping(patientId, false);
        if (session?.status !== CHAT_STATUS.WITH_AGENT) {
          ChatSessionModel.requestAgent(patientId, patientName);
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: 'Đặt lịch khám', Icon: Calendar, action: () => onBookAppointment?.() },
    { label: 'Soi da AI', Icon: ScanLine, action: () => onAIScan?.() },
    { label: 'Bảng giá', Icon: BadgeDollarSign, action: () => setInputValue('Cho tôi xem bảng giá dịch vụ') },
    { label: 'Liệu trình', Icon: Pill, action: () => setInputValue('Tư vấn liệu trình điều trị cho tôi') },
    // Explicit Bot→Human handoff. Hidden once already talking to a receptionist.
    ...(escalated ? [] : [{ label: 'Gặp Lễ tân', Icon: Headphones, action: () => escalateToHuman() }]),
  ];

  // Reveal originates from the floating button corner (bottom-right).
  const REVEAL_ORIGIN = 'circle(0% at calc(100% - 3rem) calc(100% - 3rem))';
  const REVEAL_FULL = 'circle(150% at calc(100% - 3rem) calc(100% - 3rem))';

  return (
    <>
      {/* ── Floating trigger button ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="lg-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.85 }}
            // Elastic, liquid press — mirrors SkinAI's cubic-bezier(0.5, 2.5, 0.5, 1)
            transition={{ type: 'spring', stiffness: 520, damping: 13, mass: 0.7 }}
            onClick={() => setIsOpen(true)}
            aria-label="Mở trợ lý DermaSmart AI"
            className="lg-fab fixed bottom-6 right-6 z-[9998] w-16 h-16 flex items-center justify-center cursor-pointer border-none bg-transparent p-0"
          >
            <span className="lg-fab-glow" aria-hidden="true" />
            <span className="lg-fab-float">
              <span className="lg-fab-drop">
                <svg className="siri-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="siri-pink-grad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ff2a85" stopOpacity="0.9" />
                      <stop offset="60%" stopColor="#ff2a85" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#8a2be2" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="siri-blue-grad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#0055ff" stopOpacity="0.9" />
                      <stop offset="50%" stopColor="#00aaff" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#4169e1" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="siri-teal-grad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#00ffff" stopOpacity="0.9" />
                      <stop offset="60%" stopColor="#00f5d4" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#017a6e" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="siri-purple-grad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#8a2be2" stopOpacity="0.9" />
                      <stop offset="60%" stopColor="#aa00ff" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#7a00ff" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="siri-white-grad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                      <stop offset="40%" stopColor="#e0ffff" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#00ffff" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <g style={{ mixBlendMode: 'screen' }}>
                    <path className="siri-path siri-path-pink" d="M 50 15 C 75 35, 25 65, 50 85 C 75 65, 25 35, 50 15 Z" fill="url(#siri-pink-grad)" />
                    <path className="siri-path siri-path-blue" d="M 15 50 C 35 75, 65 25, 85 50 C 65 75, 35 25, 15 50 Z" fill="url(#siri-blue-grad)" />
                    <path className="siri-path siri-path-teal" d="M 22 22 C 45 65, 55 35, 78 78 C 55 65, 45 35, 22 22 Z" fill="url(#siri-teal-grad)" />
                    <path className="siri-path siri-path-purple" d="M 78 22 C 55 65, 45 35, 22 78 C 45 65, 55 35, 78 22 Z" fill="url(#siri-purple-grad)" />
                    <path className="siri-path siri-path-white" d="M 50 35 C 55 45, 65 50, 65 50 C 65 50, 55 55, 50 65 C 45 55, 35 50, 35 50 C 35 50, 45 45, 50 35 Z" fill="url(#siri-white-grad)" />
                  </g>
                </svg>
                <span className="lg-fab-shine" />
                <span className="lg-fab-shine-sub" />
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Full-screen liquid glass overlay ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="lg-overlay"
            className="lg-root fixed inset-0 w-screen z-[9999] overflow-hidden"
            style={{ height: '100dvh' }}
            initial={{ clipPath: REVEAL_ORIGIN }}
            animate={{ clipPath: REVEAL_FULL }}
            exit={{ clipPath: REVEAL_ORIGIN }}
            // CallAI progressive radial reveal — ease-out cubic-bezier(.16,1,.3,1),
            // ~980ms open / ~880ms close (clip-path is GPU-composited, no layout).
            transition={{
              clipPath: { duration: 0.98, ease: [0.16, 1, 0.3, 1] },
            }}
          >
            {/* Layer 0 — static frosted dim of the page (opacity-only fade) */}
            <motion.div
              className="lg-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />

            {/* Layer 1 — animated plasma energy (pure CSS, transform-only) */}
            <div className="lg-plasma" aria-hidden="true">
              <span className="lg-blob lg-blob--cyan" />
              <span className="lg-blob lg-blob--blue" />
              <span className="lg-blob lg-blob--violet" />
              <span className="lg-blob lg-blob--pink" />
              <span className="lg-blob lg-blob--orange" />
            </div>

            {/* Light-wave sweep — expands across the background on summon */}
            <div className="lg-wave-sweep" aria-hidden="true" />

            {/* Layer 1.5 — rotating Apple-Intelligence colour rim at the screen edge */}
            <div className="lg-edge" aria-hidden="true">
              <div className="lg-edge-border-system" />
            </div>

            {/* Layer 2 — content. Strict flex column, internally scrolling. */}
            <motion.div
              className="relative z-10 flex flex-col h-full w-full max-w-3xl mx-auto px-4 sm:px-6"
              style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
                // Scale-up originates from the button corner (bottom-right), per CallAI.
                transformOrigin: 'calc(100% - 3rem) calc(100% - 3rem)',
                willChange: 'transform, opacity',
              }}
              // CallAI "invoke" feel: smooth scale-up + opacity fade. A decelerating
              // ease-out tween (NOT a spring) so it settles cleanly with no overshoot
              // bounce at the end. transform + opacity only → GPU-composited.
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{
                scale: { duration: 0.66, ease: [0.22, 1, 0.36, 1], delay: 0.06 },
                opacity: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.06 },
              }}
            >
              {/* Header — anchored top */}
              <header data-wave className="flex-none flex items-center justify-between gap-3 pt-5 pb-4">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mini water-drop — same identity as the trigger button */}
                  <div className="lg-mini-drop relative w-11 h-11 shrink-0">
                    <svg className="siri-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <radialGradient id="siri-pink-grad-mini" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ff2a85" stopOpacity="0.9" />
                          <stop offset="60%" stopColor="#ff2a85" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#8a2be2" stopOpacity="0" />
                        </radialGradient>
                        <radialGradient id="siri-blue-grad-mini" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#0055ff" stopOpacity="0.9" />
                          <stop offset="50%" stopColor="#00aaff" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#4169e1" stopOpacity="0" />
                        </radialGradient>
                        <radialGradient id="siri-teal-grad-mini" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#00ffff" stopOpacity="0.9" />
                          <stop offset="60%" stopColor="#00f5d4" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#017a6e" stopOpacity="0" />
                        </radialGradient>
                        <radialGradient id="siri-purple-grad-mini" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#8a2be2" stopOpacity="0.9" />
                          <stop offset="60%" stopColor="#aa00ff" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#7a00ff" stopOpacity="0" />
                        </radialGradient>
                        <radialGradient id="siri-white-grad-mini" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                          <stop offset="40%" stopColor="#e0ffff" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#00ffff" stopOpacity="0" />
                        </radialGradient>
                      </defs>
                      <g style={{ mixBlendMode: 'screen' }}>
                        <path className="siri-path siri-path-pink" d="M 50 15 C 75 35, 25 65, 50 85 C 75 65, 25 35, 50 15 Z" fill="url(#siri-pink-grad-mini)" />
                        <path className="siri-path siri-path-blue" d="M 15 50 C 35 75, 65 25, 85 50 C 65 75, 35 25, 15 50 Z" fill="url(#siri-blue-grad-mini)" />
                        <path className="siri-path siri-path-teal" d="M 22 22 C 45 65, 55 35, 78 78 C 55 65, 45 35, 22 22 Z" fill="url(#siri-teal-grad-mini)" />
                        <path className="siri-path siri-path-purple" d="M 78 22 C 55 65, 45 35, 22 78 C 45 65, 55 35, 78 22 Z" fill="url(#siri-purple-grad-mini)" />
                        <path className="siri-path siri-path-white" d="M 50 35 C 55 45, 65 50, 65 50 C 65 50, 55 55, 50 65 C 45 55, 35 50, 35 50 C 35 50, 45 45, 50 35 Z" fill="url(#siri-white-grad-mini)" />
                      </g>
                    </svg>
                    <span className="lg-mini-drop-shine" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-white font-bold text-base leading-tight truncate">DermaSmart AI</h2>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                      <span className="text-[11px] text-white/55 font-medium">
                        {mode === 'AI'
                          ? 'Trợ lý thông minh · Trực tuyến'
                          : session?.status === CHAT_STATUS.WITH_AGENT
                            ? 'Lễ tân · Đang hỗ trợ bạn'
                            : session?.status === CHAT_STATUS.WAITING
                              ? 'Lễ tân · Đang kết nối…'
                              : 'Lễ tân · Sẵn sàng hỗ trợ'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Đóng"
                  className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border border-white/15 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              {/* Mode toggle — anchored */}
              <div data-wave className="flex-none pb-4">
                <ModeToggle mode={mode} setMode={setMode} />
              </div>

              {/* Handoff status banner (Live mode) */}
              {mode === 'Live' && escalated && (
                <div className="flex-none pb-3">
                  <div className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-[11px] font-semibold border ${
                    session?.status === CHAT_STATUS.WITH_AGENT
                      ? 'bg-emerald-400/15 border-emerald-300/30 text-emerald-200'
                      : 'bg-amber-400/15 border-amber-300/30 text-amber-100'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      session?.status === CHAT_STATUS.WITH_AGENT ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                    }`} />
                    {session?.status === CHAT_STATUS.WITH_AGENT
                      ? 'Bạn đang được lễ tân hỗ trợ trực tiếp.'
                      : 'Đã chuyển tới lễ tân — vui lòng chờ trong giây lát…'}
                  </div>
                </div>
              )}

              {/* Messages — THE scroll region (flex-1 + min-h-0 + overflow-y-auto) */}
              <div
                ref={scrollRef}
                className="lg-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-4 py-2 pr-1"
              >
                {filteredMessages.length === 0 && !isTyping && (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-white/10 border border-white/15">
                      {mode === 'AI'
                        ? <Bot className="w-8 h-8 text-cyan-300" />
                        : <Headphones className="w-8 h-8 text-sky-300" />}
                    </div>
                    <p className="text-sm text-white/55 font-medium max-w-xs">
                      {mode === 'AI'
                        ? 'Hãy đặt câu hỏi cho trợ lý AI của DermaSmart!'
                        : 'Nhân viên lễ tân sẽ phản hồi bạn trong giây lát.'}
                    </p>
                  </div>
                )}

                {filteredMessages.map((msg, index) => {
                  const isLast = index === filteredMessages.length - 1;
                  const alreadyTyped = typedMessageIds.current.has(msg.id);
                  const isLatest = isLast && !alreadyTyped && msg.senderRole === 'BOT';
                  
                  if (isLatest) {
                    typedMessageIds.current.add(msg.id);
                  }
                  
                  return (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isLatest={isLatest}
                      onTextUpdate={keepPinned}
                    />
                  );
                })}

                {isTyping && mode === 'AI' && (
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-medium text-white/45 mb-1 px-1.5">DermaSmart AI</span>
                    <TypingIndicator />
                  </div>
                )}

                {mode === 'Live' && session?.agentTyping && (
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-medium text-white/45 mb-1 px-1.5">Lễ tân đang gõ…</span>
                    <TypingIndicator />
                  </div>
                )}
              </div>

              {/* Suggestion chips — anchored bottom */}
              <div className="flex-none pt-3">
                <div className="lg-no-scrollbar flex gap-2 overflow-x-auto pb-3">
                  {quickActions.map(({ label, Icon, action }, idx) => (
                    <button
                      key={idx}
                      data-wave
                      onClick={action}
                      className="flex items-center gap-1.5 shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap border border-white/15 bg-white/10 text-white/85 hover:bg-white/20 hover:text-white transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Input — anchored bottom */}
                <div data-wave className="lg-glass flex items-center gap-2 p-2 pl-4 rounded-full mb-4 shadow-xl shadow-black/20">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => { setInputValue(e.target.value); signalPatientTyping(); }}
                    onKeyDown={handleKeyDown}
                    placeholder={mode === 'AI' ? 'Hỏi DermaSmart AI bất cứ điều gì…' : 'Nhắn tin cho lễ tân…'}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    aria-label="Gửi"
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer shrink-0 transition-all ${
                      inputValue.trim()
                        ? 'text-white bg-gradient-to-br from-cyan-400 via-sky-500 to-violet-500 shadow-lg shadow-sky-500/40'
                        : 'text-white/30 bg-white/10 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ───────────────────────── Error boundary ───────────────────────── */

class LocalChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Chatbot widget crashed:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <button
          onClick={() => this.setState({ hasError: false })}
          className="fixed bottom-6 right-6 z-[9998] w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 border-none cursor-pointer"
          title="Trợ lý gặp lỗi. Nhấp để tải lại."
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      );
    }
    return this.props.children;
  }
}

export default function FloatingChatbot(props) {
  return (
    <LocalChatErrorBoundary>
      <FloatingChatbotContent {...props} />
    </LocalChatErrorBoundary>
  );
}
