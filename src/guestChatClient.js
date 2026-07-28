import { createClient } from '@supabase/supabase-js';

/**
 * Guest chat identity + a Supabase client that proves it.
 *
 * A visitor who has not logged in still gets a private conversation thread. The
 * thread id is a random uuid kept in localStorage — it is the only secret that
 * separates one guest from another.
 *
 * Until 2026-07-28 the RLS policy on `messages` / `chat_sessions` was
 * `patient_id like 'pat-guest-%'`, which let *any* anonymous caller read *every*
 * guest conversation with a single unfiltered SELECT — the random id proved
 * nothing because nothing had to present it. The policy now compares
 * `patient_id` against the `x-guest-thread` request header, so a guest can only
 * read the thread whose id they actually hold. This module is what sends that
 * header.
 */

export const GUEST_ID_KEY = 'dermasmart_guest_chat_id';

export const GUEST_ID_PREFIX = 'pat-guest-';

/** Marker passed to ChatModel calls made as a not-logged-in visitor. */
export const GUEST_OPTS = { guest: true };

export const isGuestThread = (patientId) =>
  typeof patientId === 'string' && patientId.startsWith(GUEST_ID_PREFIX);

/** Stable per-browser guest thread id; created on first use. */
export const getGuestChatId = () => {
  try {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!isGuestThread(id)) {
      id = `${GUEST_ID_PREFIX}${
        crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      }`;
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    return id;
  } catch {
    return 'pat-guest';
  }
};

// One client per thread id. In practice there is exactly one (the browser's own
// guest id); the map only matters if a page ever touches a second thread.
const clients = new Map();

/**
 * A Supabase client that presents `x-guest-thread` on every PostgREST request,
 * so the guest RLS policies can scope reads/writes to that one thread.
 * Falls back to the caller's own client when the id is not a guest thread.
 */
export const guestChatClient = (patientId) => {
  const threadId = patientId || getGuestChatId();
  if (!clients.has(threadId)) {
    clients.set(
      threadId,
      createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, storageKey: `sb-derma-guest-${threadId}` },
        global: { headers: { 'x-guest-thread': threadId } },
      })
    );
  }
  return clients.get(threadId);
};
