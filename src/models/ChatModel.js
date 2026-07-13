import { supabase } from '../supabaseClient';

const LOCAL_STORAGE_KEY = 'dermasmart_fallback_messages';
const SESSION_STORAGE_KEY = 'dermasmart_fallback_chat_sessions';

// Cap every history read so long conversations never balloon the payload /
// re-render cost. We fetch the most-recent N (DESC) then flip to chronological.
const HISTORY_LIMIT = 50;

// --- Helper: Local Storage Fallback ---
const getLocalMessages = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to read fallback messages from localStorage:", e);
    return [];
  }
};

const saveLocalMessages = (msgs) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(msgs));
  } catch (e) {
    console.error("Failed to save fallback messages to localStorage:", e);
  }
};

const addLocalMessage = (msgData) => {
  const msgs = getLocalMessages();
  const newMsg = {
    ...msgData,
    id: msgData.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: msgData.timestamp || new Date().toISOString()
  };
  msgs.push(newMsg);
  saveLocalMessages(msgs);
  return newMsg;
};

// --- Helper: Image messages ---
// A photo message is a normal messages row whose text is '[IMG]<public-url>'.
// No schema change needed; every chat surface detects the prefix and renders
// an <img> instead of text. Files live in the public `clinic-assets` bucket
// (anon upload verified allowed) under chat/<patientId>/.
export const IMG_PREFIX = '[IMG]';
export const isImageMessage = (text) => typeof text === 'string' && text.startsWith(IMG_PREFIX);
export const imageUrlFromMessage = (text) =>
  isImageMessage(text) ? text.slice(IMG_PREFIX.length).trim() : null;

const CHAT_IMG_BUCKET = 'clinic-assets';
const CHAT_IMG_MAX_DIM = 1024;

// Downscale in-browser so a 12MP phone photo doesn't land as a 6MB upload.
const downscaleImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, CHAT_IMG_MAX_DIM / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Không xử lý được ảnh.'))),
        'image/jpeg',
        0.78
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('File không phải là ảnh hợp lệ.'));
    };
    img.src = url;
  });

/** Upload a chat photo; resolves to its public URL. Throws on failure. */
export async function uploadChatImage(file, patientId) {
  if (!file?.type?.startsWith('image/')) throw new Error('Vui lòng chọn file ảnh.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Ảnh quá lớn (tối đa 10MB).');
  const blob = await downscaleImage(file);
  const path = `chat/${patientId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage
    .from(CHAT_IMG_BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(CHAT_IMG_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Không lấy được đường dẫn ảnh.');
  return data.publicUrl;
}

// --- Helper: Schema Mapping ---
const mapToDB = (msg) => ({
  id: msg.id,
  sender_id: msg.senderId,
  sender_name: msg.senderName,
  sender_role: msg.senderRole,
  receiver_id: msg.receiverId,
  receiver_name: msg.receiverName,
  patient_id: msg.patientId,
  text: msg.text,
  mode: msg.mode,
  created_at: msg.timestamp || new Date().toISOString()
});

const mapFromDB = (row) => ({
  id: row.id,
  senderId: row.sender_id,
  senderName: row.sender_name,
  senderRole: row.sender_role,
  receiverId: row.receiver_id,
  receiverName: row.receiver_name,
  patientId: row.patient_id,
  text: row.text,
  mode: row.mode,
  timestamp: row.created_at
});

// --- Models ---
export const ChatModel = {
  async getAllMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT);
      if (error) {
        if (error.code === 'PGRST205') {
          return getLocalMessages();
        }
        throw error;
      }
      return (data || []).map(mapFromDB).reverse();
    } catch (e) {
      console.warn('Supabase fetch error (messages):', e.message);
      return getLocalMessages();
    }
  },

  async getMessagesBetween(pId, dId) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${pId},receiver_id.eq.${dId}),and(sender_id.eq.${dId},receiver_id.eq.${pId})`)
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT);
      if (error) {
        if (error.code === 'PGRST205') {
          return getLocalMessages().filter(m => 
            (m.senderId === pId && m.receiverId === dId) || 
            (m.senderId === dId && m.receiverId === pId)
          );
        }
        throw error;
      }
      return (data || []).map(mapFromDB).reverse();
    } catch (e) {
      console.warn('Supabase fetch error (messages between):', e.message);
      return getLocalMessages().filter(m => 
        (m.senderId === pId && m.receiverId === dId) || 
        (m.senderId === dId && m.receiverId === pId)
      );
    }
  },

  async addMessage(msgData) {
    try {
      const dbRow = mapToDB(msgData);
      // Remove id and created_at so Supabase generates them
      delete dbRow.id;
      delete dbRow.created_at;
      
      const { data, error } = await supabase.from('messages').insert([dbRow]).select();
      if (error) {
        if (error.code === 'PGRST205') {
          return addLocalMessage(msgData);
        }
        throw error;
      }
      return mapFromDB(data[0]);
    } catch (e) {
      console.warn('Supabase create error (messages):', e.message);
      return addLocalMessage(msgData);
    }
  }
};

export const ReceptionistChatModel = {
  async getAllMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT);
      if (error) {
        if (error.code === 'PGRST205') {
          return getLocalMessages().filter(m => m.mode === 'Live' || m.mode === 'AI');
        }
        throw error;
      }
      return (data || []).map(mapFromDB).reverse();
    } catch (e) {
      console.warn('Supabase fetch error (receptionist messages):', e.message);
      return getLocalMessages().filter(m => m.mode === 'Live' || m.mode === 'AI');
    }
  },

  async getMessagesForPatient(patientId) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT);
      if (error) {
        if (error.code === 'PGRST205') {
          return getLocalMessages().filter(m => m.patientId === patientId);
        }
        throw error;
      }
      return (data || []).map(mapFromDB).reverse();
    } catch (e) {
      console.warn('Supabase fetch error (receptionist messages for patient):', e.message);
      return getLocalMessages().filter(m => m.patientId === patientId);
    }
  },

  async addMessage(msgData) {
    try {
      const dbRow = mapToDB(msgData);
      delete dbRow.id;
      delete dbRow.created_at;

      const { data, error } = await supabase.from('messages').insert([dbRow]).select();
      if (error) {
        if (error.code === 'PGRST205') {
          return addLocalMessage(msgData);
        }
        throw error;
      }
      return mapFromDB(data[0]);
    } catch (e) {
      console.warn('Supabase create error (receptionist messages):', e.message);
      return addLocalMessage(msgData);
    }
  },

  // Like addMessage but PRESERVES the original timestamp — used only by the
  // guest→account history merge, where losing message order would garble the
  // conversation. No localStorage fallback: a failed import is skipped, the
  // merge is best-effort.
  async importMessage(msgData) {
    try {
      const dbRow = mapToDB(msgData);
      delete dbRow.id;
      const { data, error } = await supabase.from('messages').insert([dbRow]).select();
      if (error) throw error;
      return mapFromDB(data[0]);
    } catch (e) {
      console.warn('Supabase import error (messages):', e.message);
      return null;
    }
  }
};

/* ───────────────────────── Realtime ─────────────────────────
   Subscribe to INSERT + UPDATE on public.messages. Pass `patientId` to scope
   the channel to one conversation (patient widget) or omit it for the global
   receptionist feed. `onEvent(type, message)` fires with 'INSERT' | 'UPDATE'
   and the mapped message. Returns the channel — the caller MUST pass it to
   `unsubscribe()` in a useEffect cleanup to avoid leaked / duplicated
   subscriptions. No-ops gracefully when the table is on the localStorage
   fallback (the channel simply never receives events). */
export function subscribeToMessages({ patientId, onEvent }) {
  const scope = patientId || 'all';
  const filter = patientId ? `patient_id=eq.${patientId}` : undefined;
  const base = { schema: 'public', table: 'messages', ...(filter ? { filter } : {}) };

  const channelName = `chat-msgs-${scope}-${Date.now()}-${Math.random()}`;
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { ...base, event: 'INSERT' }, (p) => onEvent?.('INSERT', mapFromDB(p.new)))
    .on('postgres_changes', { ...base, event: 'UPDATE' }, (p) => onEvent?.('UPDATE', mapFromDB(p.new)))
    .subscribe();

  return channel;
}

/* Subscribe to chat_sessions changes (handoff status + typing flags). Scope to
   one patient or omit for all. `onEvent('INSERT'|'UPDATE', session)`. */
export function subscribeToSessions({ patientId, onEvent }) {
  const scope = patientId || 'all';
  const filter = patientId ? `patient_id=eq.${patientId}` : undefined;
  const base = { schema: 'public', table: 'chat_sessions', ...(filter ? { filter } : {}) };

  const channelName = `chat-sess-${scope}-${Date.now()}-${Math.random()}`;
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { ...base, event: 'INSERT' }, (p) => onEvent?.('INSERT', mapSessionFromDB(p.new)))
    .on('postgres_changes', { ...base, event: 'UPDATE' }, (p) => onEvent?.('UPDATE', mapSessionFromDB(p.new)))
    .subscribe();

  return channel;
}

/* Single teardown helper so call sites never reach into `supabase` directly. */
export function unsubscribe(channel) {
  if (channel) supabase.removeChannel(channel);
}

/* ───────────────────────── Chat sessions (handoff state) ─────────────────────────
   One row per patient conversation: the Bot→Human handoff state machine plus
   live typing flags and the agent's read marker. Mirrors the messages model's
   Supabase-with-localStorage-fallback pattern so the feature degrades cleanly
   when the chat_sessions table hasn't been migrated yet. */

export const CHAT_STATUS = {
  BOT: 'BOT',
  WAITING: 'WAITING_FOR_AGENT',
  WITH_AGENT: 'WITH_AGENT',
  RESOLVED: 'RESOLVED',
};

const mapSessionToDB = (s) => ({
  patient_id: s.patientId,
  patient_name: s.patientName,
  status: s.status,
  agent_id: s.agentId,
  agent_typing: s.agentTyping,
  patient_typing: s.patientTyping,
  last_read_at: s.lastReadAt,
  updated_at: new Date().toISOString(),
});

const mapSessionFromDB = (row) => ({
  patientId: row.patient_id,
  patientName: row.patient_name,
  status: row.status || CHAT_STATUS.BOT,
  agentId: row.agent_id,
  agentTyping: !!row.agent_typing,
  patientTyping: !!row.patient_typing,
  lastReadAt: row.last_read_at,
  updatedAt: row.updated_at,
});

const getLocalSessions = () => {
  try {
    const data = localStorage.getItem(SESSION_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
};

const saveLocalSessions = (map) => {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(map));
    // Notify other tabs (the storage event only fires cross-tab, not same-tab).
    window.dispatchEvent(new CustomEvent('dermasmart:sessions'));
  } catch (e) {
    console.error('Failed to save fallback chat sessions:', e);
  }
};

const upsertLocalSession = (patientId, patch) => {
  const map = getLocalSessions();
  const prev = map[patientId] || { patientId, status: CHAT_STATUS.BOT };
  const next = { ...prev, ...patch, patientId, updatedAt: new Date().toISOString() };
  map[patientId] = next;
  saveLocalSessions(map);
  return next;
};

export const ChatSessionModel = {
  async get(patientId) {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle();
      if (error) {
        if (error.code === 'PGRST205') return getLocalSessions()[patientId] || null;
        throw error;
      }
      return data ? mapSessionFromDB(data) : null;
    } catch (e) {
      console.warn('Supabase fetch error (chat session):', e.message);
      return getLocalSessions()[patientId] || null;
    }
  },

  async getAll() {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(HISTORY_LIMIT);
      if (error) {
        if (error.code === 'PGRST205') return Object.values(getLocalSessions());
        throw error;
      }
      return (data || []).map(mapSessionFromDB);
    } catch (e) {
      console.warn('Supabase fetch error (chat sessions):', e.message);
      return Object.values(getLocalSessions());
    }
  },

  // Upsert a partial session patch keyed by patientId.
  async upsert(patientId, patch) {
    const row = mapSessionToDB({ patientId, ...patch });
    // Strip undefined keys so we never null-out columns we didn't intend to set.
    Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .upsert(row, { onConflict: 'patient_id' })
        .select();
      if (error) {
        if (error.code === 'PGRST205') return upsertLocalSession(patientId, patch);
        throw error;
      }
      return data && data[0] ? mapSessionFromDB(data[0]) : null;
    } catch (e) {
      console.warn('Supabase upsert error (chat session):', e.message);
      return upsertLocalSession(patientId, patch);
    }
  },

  // ── Convenience verbs over upsert ──
  requestAgent(patientId, patientName) {
    return this.upsert(patientId, { patientName, status: CHAT_STATUS.WAITING, agentTyping: false });
  },
  claim(patientId, agentId) {
    return this.upsert(patientId, { status: CHAT_STATUS.WITH_AGENT, agentId, lastReadAt: new Date().toISOString() });
  },
  setStatus(patientId, status) {
    return this.upsert(patientId, { status });
  },
  setAgentTyping(patientId, typing) {
    return this.upsert(patientId, { agentTyping: typing });
  },
  setPatientTyping(patientId, typing) {
    return this.upsert(patientId, { patientTyping: typing });
  },
  markRead(patientId) {
    return this.upsert(patientId, { lastReadAt: new Date().toISOString() });
  },

  // Local-fallback change subscription (same-tab + cross-tab) so the UI stays
  // live even without the Supabase realtime table. Returns an unsubscribe fn.
  onLocalChange(cb) {
    const handler = () => cb(Object.values(getLocalSessions()));
    window.addEventListener('dermasmart:sessions', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('dermasmart:sessions', handler);
      window.removeEventListener('storage', handler);
    };
  },
};
