import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, Square, Sparkles, Loader2, Trash2, CheckCircle2,
  AudioLines, ClipboardCheck, Stethoscope, Pill, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GLASS_BASE, GLASS_INPUT } from '../../common/GlassCard';
import useAmbientScribe from '../../../hooks/useAmbientScribe';
import { analyzeConsultation } from '../../../services/ScribeService';
import { MedicalRecordModel } from '../../../models/MedicalRecordModel';

const formatElapsed = (sec) => {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
};

// Animated equalizer bars shown while the mic is hot.
function ListeningBars() {
  return (
    <div className="flex items-end gap-[3px] h-4" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-rose-500"
          animate={{ height: ['30%', '95%', '45%', '80%', '30%'] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function FieldCard({ label, icon: Icon, checked, onToggle, children }) {
  return (
    <label className={`block rounded-xl border p-3.5 cursor-pointer transition-all ${
      checked ? 'border-emerald-300/70 bg-emerald-50/50' : 'border-slate-200/60 bg-white/40 opacity-70'
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 uppercase tracking-wider">
          <Icon className="w-3.5 h-3.5 text-teal-600" />
          {label}
        </span>
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="w-4 h-4 accent-emerald-500 cursor-pointer"
        />
      </div>
      <div className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
        {children}
      </div>
    </label>
  );
}

/**
 * AmbientScribePanel — the doctor turns on "AI Lắng Nghe" during a
 * consultation; speech is transcribed live (Web Speech API, vi-VN), then
 * Gemini extracts a structured EMR draft the doctor reviews field-by-field
 * and applies into the medical record with one click.
 */
export default function AmbientScribePanel({ patientName, onApply }) {
  const {
    isSupported, isListening, transcript, setTranscript,
    interimText, elapsedSec, error: micError, start, stop, reset,
  } = useAmbientScribe();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [draft, setDraft] = useState(null);
  const [include, setInclude] = useState({});
  const [dxMatches, setDxMatches] = useState([]);
  const [selectedDx, setSelectedDx] = useState(null);
  const [justApplied, setJustApplied] = useState(false);
  // Fallback path: type/paste the conversation instead of recording (also the
  // only path on browsers without Web Speech support).
  const [manualMode, setManualMode] = useState(false);

  const liveBoxRef = useRef(null);

  // Keep the live transcript pinned to the newest words.
  useEffect(() => {
    if (isListening && liveBoxRef.current) {
      liveBoxRef.current.scrollTop = liveBoxRef.current.scrollHeight;
    }
  }, [transcript, interimText, isListening]);

  // When a draft arrives, resolve the AI's diagnosis guesses against the real
  // ICD-10 catalogue so only canonical entries can be written to the record.
  useEffect(() => {
    if (!draft) return;
    let active = true;
    const resolve = async () => {
      const seen = new Set();
      const matches = [];
      for (const suggestion of (draft.diagnosis_suggestions || []).slice(0, 3)) {
        const queries = [suggestion.icd10_hint, suggestion.name, (suggestion.name || '').split(' ').slice(0, 3).join(' ')]
          .filter((q) => q && q.trim().length >= 2);
        for (const q of queries) {
          const found = await MedicalRecordModel.searchDiagnoses(q.trim());
          (found || []).forEach((d) => {
            if (!seen.has(d.diagnosis_id) && matches.length < 4) {
              seen.add(d.diagnosis_id);
              matches.push(d);
            }
          });
          if (found?.length) break; // first query that hits is good enough
        }
      }
      if (active) {
        setDxMatches(matches);
        setSelectedDx(matches[0] ? `${matches[0].icd10_code} - ${matches[0].name}` : null);
      }
    };
    resolve().catch((err) => console.error('[AmbientScribe] ICD-10 matching failed:', err));
    return () => { active = false; };
  }, [draft]);

  const handleAnalyze = async () => {
    if (isAnalyzing || !transcript.trim()) return;
    if (isListening) stop();
    setIsAnalyzing(true);
    setAnalysisError(null);
    setDraft(null);
    try {
      const result = await analyzeConsultation(transcript, { patientName });
      setDraft(result);
      setInclude({
        symptoms: !!result.symptoms,
        history: !!result.medical_history,
        assessment: !!result.assessment,
        treatment: !!result.treatment_direction,
        followUp: !!result.follow_up,
        diagnosis: (result.diagnosis_suggestions || []).length > 0,
      });
    } catch (err) {
      setAnalysisError(err.message || 'Phân tích thất bại, vui lòng thử lại.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!draft) return;
    onApply?.({
      symptoms: include.symptoms ? draft.symptoms : '',
      medicalHistory: include.history ? draft.medical_history : '',
      assessment: include.assessment ? draft.assessment : '',
      treatmentDirection: include.treatment ? draft.treatment_direction : '',
      followUp: include.followUp ? draft.follow_up : '',
      diagnosis: include.diagnosis && selectedDx ? selectedDx : '',
    });
    setDraft(null);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 4000);
  };

  const handleReset = () => {
    reset();
    setDraft(null);
    setAnalysisError(null);
    setJustApplied(false);
    setManualMode(false);
  };

  const toggleInclude = (key) => setInclude((prev) => ({ ...prev, [key]: !prev[key] }));

  const hasTranscript = transcript.trim().length > 0;

  return (
    <div className={`${GLASS_BASE} water-refract rounded-2xl p-6 text-left relative overflow-hidden`}>
      {/* Ambient glow while recording */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none bg-gradient-to-br from-rose-500/[0.06] via-transparent to-teal-500/[0.06]"
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 relative">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-colors ${
            isListening
              ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/30'
              : 'bg-gradient-to-br from-teal-500 to-emerald-600 shadow-teal-500/20'
          }`}>
            <AudioLines className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-2">
              Trợ lý AI Lắng Nghe
              {isListening && (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 bg-rose-500/10 border border-rose-300/40 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  REC {formatElapsed(elapsedSec)}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 font-medium truncate">
              Ghi âm hội thoại khám bệnh → AI tự soạn nháp bệnh án
            </p>
          </div>
        </div>

        {isSupported && (
          <button
            onClick={isListening ? stop : start}
            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95 cursor-pointer border-none shadow-lg ${
              isListening
                ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/25 hover:shadow-rose-500/40'
                : 'bg-gradient-to-r from-teal-500 to-emerald-600 shadow-teal-500/25 hover:shadow-teal-500/40'
            }`}
          >
            {isListening ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                Dừng ghi
                <ListeningBars />
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Bật AI Lắng Nghe
              </>
            )}
          </button>
        )}
      </div>

      {!isSupported && (
        <div className="mt-4 flex items-start gap-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl p-3.5 text-sm text-amber-800 font-medium">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Vui lòng dùng Google Chrome hoặc Microsoft Edge.
        </div>
      )}

      {micError && (
        <div className="mt-4 flex items-start gap-2.5 bg-rose-50/70 border border-rose-200/60 rounded-xl p-3.5 text-sm text-rose-700 font-medium">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {micError}
        </div>
      )}

      {/* Manual entry fallback */}
      {!isListening && !hasTranscript && !manualMode && !draft && (
        <button
          onClick={() => setManualMode(true)}
          className="mt-3 text-xs font-bold text-slate-400 hover:text-teal-600 transition-colors cursor-pointer bg-transparent border-none p-0 underline underline-offset-2"
        >
          hoặc nhập / dán nội dung hội thoại thủ công
        </button>
      )}

      {/* Transcript area */}
      <AnimatePresence>
        {(isListening || hasTranscript || manualMode) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-5">
              <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wider">
                Bản ghi hội thoại {!isListening && hasTranscript && '(có thể sửa trước khi phân tích)'}
              </label>

              {isListening ? (
                <div
                  ref={liveBoxRef}
                  className="w-full max-h-40 min-h-[72px] overflow-y-auto bg-slate-950/5 border border-slate-200/50 rounded-xl p-4 shadow-inner text-sm leading-relaxed"
                >
                  <span className="font-semibold text-slate-800 whitespace-pre-wrap">{transcript}</span>
                  {interimText && (
                    <span className="text-slate-400 italic"> {interimText}</span>
                  )}
                  {!transcript && !interimText && (
                    <span className="text-slate-400 font-medium">Đang lắng nghe… hãy bắt đầu trao đổi với bệnh nhân.</span>
                  )}
                </div>
              ) : (
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={4}
                  className={`${GLASS_INPUT} w-full p-4 text-sm font-semibold text-gray-900 resize-none rounded-xl`}
                  placeholder="Bản ghi hội thoại sẽ hiển thị tại đây…"
                />
              )}
            </div>

            {/* Actions under transcript */}
            {!isListening && (hasTranscript || manualMode) && !draft && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleReset}
                  disabled={isAnalyzing}
                  className={`${GLASS_BASE} px-4 py-3 rounded-xl text-slate-600 font-bold text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50`}
                  title="Xoá bản ghi và bắt đầu lại"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !hasTranscript}
                  className="flex-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white py-3 px-5 rounded-xl font-bold text-sm tracking-tight shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/35 transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer border-none disabled:opacity-70"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI đang phân tích hội thoại…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Phân tích &amp; Soạn nháp bệnh án
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {analysisError && (
        <div className="mt-4 flex items-start gap-2.5 bg-rose-50/70 border border-rose-200/60 rounded-xl p-3.5 text-sm text-rose-700 font-medium">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {analysisError}
        </div>
      )}

      {/* Success flash after applying */}
      <AnimatePresence>
        {justApplied && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-2.5 bg-emerald-50/80 border border-emerald-200/60 rounded-xl p-3.5 text-sm text-emerald-700 font-bold"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Đã điền bản nháp AI vào bệnh án — vui lòng kiểm tra lại trước khi hoàn tất.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draft review */}
      <AnimatePresence>
        {draft && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-5 space-y-3"
          >
            <div className="flex items-center gap-2 pb-1">
              <ClipboardCheck className="w-4 h-4 text-purple-600" />
              <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">
                Bản nháp AI — chọn nội dung để điền
              </h4>
            </div>

            {draft.summary && (
              <p className="text-sm text-slate-600 font-medium bg-purple-50/60 border border-purple-200/50 rounded-xl p-3.5 leading-relaxed">
                {draft.summary}
              </p>
            )}

            {draft.symptoms && (
              <FieldCard label="Triệu chứng & Lý do khám" icon={Stethoscope} checked={!!include.symptoms} onToggle={() => toggleInclude('symptoms')}>
                {draft.symptoms}
              </FieldCard>
            )}

            {draft.medical_history && (
              <FieldCard label="Tiền sử bệnh" icon={ClipboardCheck} checked={!!include.history} onToggle={() => toggleInclude('history')}>
                {draft.medical_history}
              </FieldCard>
            )}

            {draft.assessment && (
              <FieldCard label="Đánh giá tình trạng" icon={Stethoscope} checked={!!include.assessment} onToggle={() => toggleInclude('assessment')}>
                {draft.assessment}
              </FieldCard>
            )}

            {/* Diagnosis suggestions resolved to the real ICD-10 catalogue */}
            {(draft.diagnosis_suggestions || []).length > 0 && (
              <div className={`rounded-xl border p-3.5 transition-all ${
                include.diagnosis ? 'border-emerald-300/70 bg-emerald-50/50' : 'border-slate-200/60 bg-white/40 opacity-70'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                    Gợi ý chẩn đoán (ICD-10)
                  </span>
                  <input
                    type="checkbox"
                    checked={!!include.diagnosis}
                    onChange={() => toggleInclude('diagnosis')}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>
                {dxMatches.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {dxMatches.map((d) => {
                      const label = `${d.icd10_code} - ${d.name}`;
                      const isSelected = selectedDx === label;
                      return (
                        <button
                          key={d.diagnosis_id}
                          onClick={() => setSelectedDx(label)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-500/25'
                              : 'bg-white/60 text-slate-700 border-slate-200/70 hover:border-teal-300'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-medium">
                    AI gợi ý: {(draft.diagnosis_suggestions || []).map((s) => `${s.name}${s.icd10_hint ? ` (${s.icd10_hint})` : ''}`).join(', ')} — không khớp danh mục ICD-10, vui lòng chọn thủ công.
                  </p>
                )}
              </div>
            )}

            {draft.treatment_direction && (
              <FieldCard label="Hướng điều trị" icon={ClipboardCheck} checked={!!include.treatment} onToggle={() => toggleInclude('treatment')}>
                {draft.treatment_direction}
              </FieldCard>
            )}

            {draft.follow_up && (
              <FieldCard label="Tái khám & Dặn dò" icon={ClipboardCheck} checked={!!include.followUp} onToggle={() => toggleInclude('followUp')}>
                {draft.follow_up}
              </FieldCard>
            )}

            {/* Medication suggestions — reference only, never auto-filled */}
            {(draft.medication_suggestions || []).length > 0 && (
              <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-black text-amber-700 uppercase tracking-wider mb-2">
                  <Pill className="w-3.5 h-3.5" />
                  Thuốc được nhắc tới (tham khảo — bác sĩ kê đơn thủ công ở Bước 3)
                </span>
                <ul className="space-y-1.5">
                  {draft.medication_suggestions.map((m, i) => (
                    <li key={i} className="text-sm font-semibold text-slate-700">
                      • {m.name}
                      {[m.dosage, m.frequency, m.instructions].filter(Boolean).length > 0 && (
                        <span className="text-slate-500 font-medium"> — {[m.dosage, m.frequency, m.instructions].filter(Boolean).join(', ')}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setDraft(null)}
                className={`${GLASS_BASE} px-4 py-3 rounded-xl text-slate-600 font-bold text-sm transition-all active:scale-95 cursor-pointer`}
              >
                Huỷ
              </button>
              <button
                onClick={handleApply}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-5 rounded-xl font-bold text-sm tracking-tight shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer border-none"
              >
                <CheckCircle2 className="w-4 h-4" />
                Điền vào bệnh án
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
