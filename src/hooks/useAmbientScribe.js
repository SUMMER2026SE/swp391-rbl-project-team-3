import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * useAmbientScribe — wraps the browser Web Speech API for continuous
 * Vietnamese dictation during a consultation.
 *
 * Chrome/Edge silently stop recognition after short silences, so the hook
 * auto-restarts while `isListening` is on and accumulates final results into
 * one growing transcript. Interim (not-yet-final) text is exposed separately
 * so the UI can render it live in a lighter style.
 */
export default function useAmbientScribe({ lang = 'vi-VN' } = {}) {
  const SpeechRecognition =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);
  const isSupported = !!SpeechRecognition;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stop = useCallback(() => {
    listeningRef.current = false;
    setIsListening(false);
    setInterimText('');
    clearTimer();
    try {
      recognitionRef.current?.stop();
    } catch (_) { /* already stopped */ }
  }, []);

  const start = useCallback(() => {
    if (!isSupported || listeningRef.current) return;
    setError(null);
    setInterimText('');

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          finalChunk += piece;
        } else {
          interim += piece;
        }
      }
      if (finalChunk.trim()) {
        setTranscript((prev) => {
          const sep = prev && !prev.endsWith(' ') ? ' ' : '';
          return `${prev}${sep}${finalChunk.trim()}`;
        });
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      // 'no-speech' / 'aborted' happen constantly during pauses — the onend
      // auto-restart handles them. Only real failures should surface.
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Trình duyệt chưa cấp quyền micro. Vui lòng cho phép truy cập micro và thử lại.');
        listeningRef.current = false;
        setIsListening(false);
        clearTimer();
      } else if (event.error === 'network') {
        setError('Lỗi mạng khi nhận dạng giọng nói. Kiểm tra kết nối internet.');
      }
    };

    recognition.onend = () => {
      // Chrome ends the session after silence — restart seamlessly while the
      // doctor still has the scribe turned on.
      if (listeningRef.current) {
        try {
          recognition.start();
        } catch (_) {
          listeningRef.current = false;
          setIsListening(false);
          clearTimer();
        }
      }
    };

    recognitionRef.current = recognition;
    listeningRef.current = true;
    setIsListening(true);
    setElapsedSec(0);
    clearTimer();
    timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);

    try {
      recognition.start();
    } catch (err) {
      console.error('useAmbientScribe: failed to start recognition:', err);
      setError('Không khởi động được nhận dạng giọng nói.');
      listeningRef.current = false;
      setIsListening(false);
      clearTimer();
    }
  }, [isSupported, lang]);

  const reset = useCallback(() => {
    stop();
    setTranscript('');
    setInterimText('');
    setElapsedSec(0);
    setError(null);
  }, [stop]);

  // Kill the mic if the component unmounts mid-recording.
  useEffect(() => () => {
    listeningRef.current = false;
    clearTimer();
    try {
      recognitionRef.current?.stop();
    } catch (_) { /* noop */ }
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    setTranscript,
    interimText,
    elapsedSec,
    error,
    start,
    stop,
    reset,
  };
}
