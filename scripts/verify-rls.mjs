import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const PASSWORD = 'DermaTest#2026';
const c = () => createClient(url, key, { auth: { persistSession: false } });

async function as(email) {
  const sb = c();
  const r = await sb.auth.signInWithPassword({ email, password: PASSWORD });
  if (r.error) return { email, signin: r.error.message };
  const uid = r.data.user.id;
  const own = await sb.from('users').select('user_id, role_id, status, full_name').eq('user_id', uid).maybeSingle();
  const allDocs = await sb.from('users').select('user_id, full_name, role_id, status').eq('role_id', 2);
  const allUsers = await sb.from('users').select('user_id', { count: 'exact' });
  return {
    email,
    ownRow: own.error ? own.error.message : { role_id: own.data?.role_id, status: own.data?.status },
    doctorsVisible: allDocs.error ? allDocs.error.message : allDocs.data.length,
    doctorNames: (allDocs.data || []).map(d => d.full_name),
    totalUsersVisible: allUsers.error ? allUsers.error.message : allUsers.count,
  };
}
const out = [];
for (const e of ['doctor1@dermatest.local', 'receptionist@dermatest.local']) out.push(await as(e));
console.log(JSON.stringify(out, null, 2));
