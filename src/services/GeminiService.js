import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * GeminiService — wraps Google Gemini as "DermaBot", the clinic's virtual
 * receptionist. Owns the system persona, safety rules, and history mapping so
 * the UI layer (FloatingChatbot) only deals with plain strings.
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// gemini-1.5-flash is retired on the public API — use the current stable Flash.
// `gemini-flash-latest` is a safe fallback alias if this model is ever rotated.
const MODEL = 'gemini-2.5-flash';

// Sentinel phrase the model is instructed to emit when it wants the UI to hand
// the conversation off to a human. Exported so the UI can detect the intent.
export const HANDOFF_PHRASE = 'kết nối bạn với Lễ tân';

const SYSTEM_INSTRUCTION = [
  'Bạn là trợ lý AI ảo của phòng khám da liễu DermaSmart. Tên bạn là DermaBot.',
  'Nhiệm vụ: Tư vấn dịch vụ, giải đáp thắc mắc một cách nhẹ nhàng, lịch sự, ngắn gọn và thân thiện. Luôn trả lời bằng tiếng Việt.',
  'Quy tắc an toàn: KHÔNG tự ý chẩn đoán bệnh nặng và KHÔNG kê đơn thuốc. ' +
    'Nếu bệnh nhân có triệu chứng nghiêm trọng, cần tư vấn chuyên sâu, hoặc yêu cầu gặp người thật, ' +
    'hãy khuyên họ đặt lịch khám, hoặc nói chính xác câu: "Tôi sẽ kết nối bạn với Lễ tân ngay bây giờ".',
].join('\n');

// Lazily build the client once. Returns null when the key is missing so callers
// can fall back gracefully instead of throwing at import time.
let _client = null;
function getClient() {
  if (!API_KEY) return null;
  if (!_client) _client = new GoogleGenerativeAI(API_KEY);
  return _client;
}

export const FALLBACK_REPLY =
  'Hệ thống AI đang bảo trì, vui lòng bấm "Gặp Lễ tân" để được hỗ trợ.';

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
 * Generate DermaBot's reply.
 * @param {string} userMessage   The latest patient message.
 * @param {Array}  chatHistory   Prior messages ({ senderRole, text }) for context.
 * @returns {Promise<string>}    The bot's reply (or a graceful fallback).
 */
export async function generateBotReply(userMessage, chatHistory = []) {
  const client = getClient();
  if (!client) {
    console.warn('GeminiService: VITE_GEMINI_API_KEY is missing — using fallback reply.');
    return FALLBACK_REPLY;
  }

  try {
    const model = client.getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const chat = model.startChat({
      history: toGeminiHistory(chatHistory),
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    });

    const result = await chat.sendMessage(userMessage);
    const text = result?.response?.text?.();
    return (text && text.trim()) || FALLBACK_REPLY;
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
