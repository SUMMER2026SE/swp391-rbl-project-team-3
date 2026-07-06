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
