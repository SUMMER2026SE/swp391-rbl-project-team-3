import { supabase } from '../supabaseClient';

const LOCAL_STORAGE_KEY = 'dermasmart_fallback_messages';

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
      const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (error) {
        if (error.code === 'PGRST205') {
          return getLocalMessages();
        }
        throw error;
      }
      return (data || []).map(mapFromDB);
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
        .order('created_at', { ascending: true });
      if (error) {
        if (error.code === 'PGRST205') {
          return getLocalMessages().filter(m => 
            (m.senderId === pId && m.receiverId === dId) || 
            (m.senderId === dId && m.receiverId === pId)
          );
        }
        throw error;
      }
      return (data || []).map(mapFromDB);
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
      const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (error) {
        if (error.code === 'PGRST205') {
          return getLocalMessages().filter(m => m.mode === 'Live' || m.mode === 'AI');
        }
        throw error;
      }
      return (data || []).map(mapFromDB);
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
        .order('created_at', { ascending: true });
      if (error) {
        if (error.code === 'PGRST205') {
          return getLocalMessages().filter(m => m.patientId === patientId);
        }
        throw error;
      }
      return (data || []).map(mapFromDB);
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
  }
};
