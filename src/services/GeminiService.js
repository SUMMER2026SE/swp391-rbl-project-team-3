import { supabase } from '../supabaseClient';

/**
 * GeminiService — wraps Google Gemini as "DermaBot", the clinic's virtual
 * receptionist. Invokes the Supabase Edge Function to avoid exposing the API key
 * on the client-side.
 */

// Sentinel phrase the model is instructed to emit when it wants the UI to hand
// the conversation off to a human. Exported so the UI can detect the intent.
export const HANDOFF_PHRASE = 'kết nối bạn với Lễ tân';

export const FALLBACK_REPLY =
  'Hệ thống AI đang bảo trì, vui lòng bấm "Gặp Lễ tân" để được hỗ trợ.';

/* ── Clinic knowledge (anti-hallucination) ─────────────────────────────────
   The Edge Function's system prompt has NO pricing/service data, so Gemini
   invented prices (observed: quoted 250k then 300k for the same question).
   We can't redeploy the function from this machine, but its `history` input
   IS part of the model context — so we inject a grounding turn built from the
   real `services` + `doctor_profiles` tables (both anon-readable) in front of
   every conversation. Cached for 5 minutes per page load. Fail-soft: on any
   fetch error the bot just runs ungrounded as before. */

const CLINIC_CONTEXT_TTL_MS = 5 * 60 * 1000;
let clinicContextCache = { text: null, at: 0 };

const formatVND = (n) => `${Number(n).toLocaleString('vi-VN')} VNĐ`;

async function getClinicContext() {
  if (clinicContextCache.text && Date.now() - clinicContextCache.at < CLINIC_CONTEXT_TTL_MS) {
    return clinicContextCache.text;
  }
  try {
    const [{ data: services }, { data: doctors }] = await Promise.all([
      supabase.from('services').select('service_name, price, duration_minutes, status').eq('status', 'ACTIVE'),
      supabase.from('doctor_profiles').select('consultation_fee'),
    ]);

    const lines = [];
    if (services?.length) {
      lines.push('BẢNG GIÁ DỊCH VỤ (chính thức):');
      services.forEach((s) => {
        lines.push(`- ${s.service_name}: ${formatVND(s.price)} (${s.duration_minutes} phút)`);
      });
    }
    const fees = (doctors || []).map((d) => d.consultation_fee).filter(Boolean);
    if (fees.length) {
      lines.push(`- Phí khám da liễu với bác sĩ: ${formatVND(Math.min(...fees))} – ${formatVND(Math.max(...fees))} tuỳ bác sĩ.`);
    }
    lines.push('Giờ làm việc: 8h00 – 17h00, thứ 2 đến thứ 7.');

    if (lines.length <= 1) return null;

    const text = [
      '[DỮ LIỆU PHÒNG KHÁM DERMASMART — chỉ dùng đúng thông tin dưới đây khi báo giá/dịch vụ, TUYỆT ĐỐI không tự bịa giá. Nếu khách hỏi dịch vụ/giá không có trong danh sách, hãy nói sẽ nhờ Lễ tân báo giá chính xác.]',
      ...lines,
    ].join('\n');

    clinicContextCache = { text, at: Date.now() };
    return text;
  } catch (err) {
    console.warn('GeminiService: failed to load clinic context, bot runs ungrounded:', err?.message);
    return null;
  }
}

/**
 * Map our message records into Gemini's `contents` history format.
 * - PATIENT  → role 'user'
 * - BOT      → role 'model'
 * Gemini requires history to begin with a 'user' turn, so any leading 'model'
 * messages (e.g. the bot's opening greeting) are trimmed.
 */
function toGeminiHistory(chatHistory = []) {
  const mapped = (chatHistory || [])
    .filter((m) => m && m.text && (m.senderRole === 'PATIENT' || m.senderRole === 'BOT'))
    .map((m) => ({
      role: m.senderRole === 'PATIENT' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

  // Drop any leading 'model' turns — Gemini rejects history that starts on the
  // model side.
  let start = 0;
  while (start < mapped.length && mapped[start].role === 'model') start += 1;
  return mapped.slice(start);
}

/**
 * Generate DermaBot's reply using the Supabase Edge Function.
 * @param {string} userMessage   The latest patient message.
 * @param {Array}  chatHistory   Prior messages ({ senderRole, text }) for context.
 * @returns {Promise<string>}    The bot's reply (or a graceful fallback).
 */
export async function generateBotReply(userMessage, chatHistory = []) {
  try {
    const history = toGeminiHistory(chatHistory);

    // Ground the model with real clinic data. Gemini requires history to
    // alternate starting from 'user', so the context rides in as a leading
    // user turn acknowledged by a model turn.
    const clinicContext = await getClinicContext();
    if (clinicContext) {
      history.unshift(
        { role: 'user', parts: [{ text: clinicContext }] },
        { role: 'model', parts: [{ text: 'Đã ghi nhận dữ liệu phòng khám. Tôi sẽ chỉ báo giá theo bảng này.' }] },
      );
    }

    const { data, error } = await supabase.functions.invoke('chat-bot', {
      body: { message: userMessage, history },
    });

    if (error) {
      console.error('GeminiService.generateBotReply Edge Function invocation failed:', error);
      return FALLBACK_REPLY;
    }

    return (data?.text && data.text.trim()) || FALLBACK_REPLY;
  } catch (err) {
    console.error('GeminiService.generateBotReply failed:', err);
    return FALLBACK_REPLY;
  }
}

// Convenience: does a reply signal a handoff to a human?
export function isHandoffReply(text) {
  return !!text && text.toLowerCase().includes(HANDOFF_PHRASE.toLowerCase());
}

export default { generateBotReply, isHandoffReply, HANDOFF_PHRASE, FALLBACK_REPLY };
