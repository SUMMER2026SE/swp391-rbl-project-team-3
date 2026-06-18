import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Headphones, Calendar, ScanLine, BadgeDollarSign, Pill, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ReceptionistChatModel } from '../../models/ChatModel';
import './FloatingChatbot.css';

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

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

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
  }, [isOpen, messages, isTyping, mode, scrollToBottom]);

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

  // Poll for messages (AI + live receptionist) while open
  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    const fetchMsgs = async () => {
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

    fetchMsgs();
    const interval = setInterval(fetchMsgs, 2000);
    return () => { active = false; clearInterval(interval); };
  }, [isOpen, patientId]);

  const handleSend = async () => {
    const currentText = inputValue.trim();
    if (!currentText) return;
    setInputValue('');

    try {
      const newMsg = await ReceptionistChatModel.addMessage({
        senderId: patientId,
        senderName: patientName,
        senderRole: 'PATIENT',
        text: currentText,
        mode,
        patientId,
      });
      if (newMsg) setMessages((prev) => [...prev, newMsg]);

      if (mode === 'AI') {
        setIsTyping(true);
        setTimeout(async () => {
          try {
            await ReceptionistChatModel.addMessage({
              senderId: 'bot',
              senderName: 'DermaSmart AI',
              senderRole: 'BOT',
              text: 'Cảm ơn bạn đã nhắn tin! Tôi đang xử lý yêu cầu của bạn. Bạn có thể cho tôi biết thêm chi tiết không?',
              mode: 'AI',
              patientId,
            });
            const updated = await ReceptionistChatModel.getMessagesForPatient(patientId);
            setMessages(updated || []);
          } catch (err) {
            console.error('AI automated reply failed:', err);
          } finally {
            setIsTyping(false);
          }
        }, 1100);
      } else {
        setTimeout(async () => {
          try {
            const currentMsgs = await ReceptionistChatModel.getMessagesForPatient(patientId);
            const lastMsg = currentMsgs && currentMsgs[currentMsgs.length - 1];
            if (lastMsg && lastMsg.senderRole === 'PATIENT') {
              await ReceptionistChatModel.addMessage({
                senderId: 'staff-01',
                senderName: 'Lễ tân Hoàng Anh',
                senderRole: 'RECEPTIONIST',
                text: 'Dạ em đã nhận được tin nhắn của anh/chị. Em sẽ kiểm tra và phản hồi ngay ạ!',
                mode: 'Live',
                patientId,
              });
              const updated = await ReceptionistChatModel.getMessagesForPatient(patientId);
              setMessages(updated || []);
            }
          } catch (err) {
            console.error('Receptionist automated reply failed:', err);
          }
        }, 2000);
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
                <span className="lg-fab-core" />
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
                    <span className="lg-mini-drop-core" />
                    <span className="lg-mini-drop-shine" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-white font-bold text-base leading-tight truncate">DermaSmart AI</h2>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                      <span className="text-[11px] text-white/55 font-medium">
                        {mode === 'AI' ? 'Trợ lý thông minh · Trực tuyến' : 'Lễ tân · Sẵn sàng hỗ trợ'}
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
                    onChange={(e) => setInputValue(e.target.value)}
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
