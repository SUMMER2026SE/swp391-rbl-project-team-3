import { createClient } from '@supabase/supabase-js';

// A single shared anonymous client for reading public data WITHOUT the logged-in
// user's session (e.g. the public doctor list / landing page). A distinct
// storageKey + no persistence keeps it from clashing with the main authenticated
// client's auth storage — which previously triggered repeated
// "Multiple GoTrueClient instances detected" console warnings because several
// modules each created their own anon client under the default storage key.
export const anonSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'sb-derma-anon' } }
);
