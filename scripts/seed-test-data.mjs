// Idempotent test-data seed for DermaSmart (uses anon key + open signups).
// Creates real role_id=2 doctors (users + doctor_profiles) and a receptionist
// login account so internal dashboards have real data to render.
// employee_profiles is RLS-locked for anon, so specialties/schedule fall back
// to defaults in the useDoctors normalizer — doctors still render by name/fee.
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const PASSWORD = 'DermaTest#2026';

const DOCTORS = [
  { email: 'doctor1@dermatest.local', full_name: 'BS. CKII. Phạm Thanh Hà',  avatar: 'https://i.pravatar.cc/600?img=32', fee: 500000, rating: 4.9, reviews: 312, bio: 'Chuyên gia da liễu thẩm mỹ, điều trị nám và trẻ hóa da công nghệ cao.' },
  { email: 'doctor2@dermatest.local', full_name: 'ThS. BS. Đỗ Quang Huy',    avatar: 'https://i.pravatar.cc/600?img=13', fee: 350000, rating: 4.8, reviews: 248, bio: 'Điều trị mụn trứng cá, sẹo rỗ và viêm da cơ địa theo phác đồ cá nhân hóa.' },
  { email: 'doctor3@dermatest.local', full_name: 'BS. CKI. Vũ Khánh Linh',   avatar: 'https://i.pravatar.cc/600?img=44', fee: 300000, rating: 4.9, reviews: 196, bio: 'Soi da AI, chăm sóc da chuyên sâu và điều trị các vấn đề sắc tố.' },
];

const RECEPTIONIST = { email: 'receptionist@dermatest.local', full_name: 'Lễ tân Nguyễn Thu', role: 'RECEPTIONIST', role_id: 4 };

// Stray probe users to deactivate so they don't pollute the doctor list.
const PROBE_CLEANUP = [
  { email: 'claude_probe_1781429830234@dermatest.local', password: 'TestDoctor#2026' },
];

async function freshClient() {
  return createClient(url, key, { auth: { persistSession: false } });
}

async function ensureSession(sb, email, password, metadata) {
  let r = await sb.auth.signUp({ email, password, options: { data: metadata } });
  if (r.error && /already|registered/i.test(r.error.message)) {
    r = await sb.auth.signInWithPassword({ email, password });
  }
  if (r.error) throw new Error(`auth ${email}: ${r.error.message}`);
  if (!r.data.session) throw new Error(`no session for ${email}`);
  return r.data.user.id;
}

const results = [];

async function seedDoctor(d) {
  const sb = await freshClient();
  const uid = await ensureSession(sb, d.email, PASSWORD, { full_name: d.full_name, role: 'DOCTOR' });
  const u = await sb.from('users').update({ role_id: 2, status: 'ACTIVE', full_name: d.full_name, avatar_url: d.avatar }).eq('user_id', uid).select();
  const dp = await sb.from('doctor_profiles').upsert({ doctor_id: uid, description: d.bio, consultation_fee: d.fee, rating: d.rating, reviews_count: d.reviews }, { onConflict: 'doctor_id' }).select();
  results.push({ doctor: d.full_name, uid, usersUpdate: u.error?.message || 'ok', doctorProfile: dp.error?.message || 'ok' });
}

async function seedReceptionist() {
  const sb = await freshClient();
  const uid = await ensureSession(sb, RECEPTIONIST.email, PASSWORD, { full_name: RECEPTIONIST.full_name, role: RECEPTIONIST.role });
  const u = await sb.from('users').update({ role_id: RECEPTIONIST.role_id, status: 'ACTIVE', full_name: RECEPTIONIST.full_name }).eq('user_id', uid).select();
  results.push({ receptionist: RECEPTIONIST.full_name, uid, usersUpdate: u.error?.message || 'ok' });
}

async function deactivateProbes() {
  for (const p of PROBE_CLEANUP) {
    try {
      const sb = await freshClient();
      const r = await sb.auth.signInWithPassword({ email: p.email, password: p.password });
      if (r.error || !r.data.session) { results.push({ probeCleanup: p.email, status: 'skip: ' + (r.error?.message || 'no session') }); continue; }
      const uid = r.data.user.id;
      const u = await sb.from('users').update({ status: 'INACTIVE' }).eq('user_id', uid).select();
      results.push({ probeCleanup: p.email, status: u.error?.message || 'deactivated' });
    } catch (e) { results.push({ probeCleanup: p.email, status: 'err: ' + e.message }); }
  }
}

async function run() {
  for (const d of DOCTORS) await seedDoctor(d);
  await seedReceptionist();
  await deactivateProbes();

  // Final verification as the receptionist: read active doctors
  const sb = await freshClient();
  await sb.auth.signInWithPassword({ email: RECEPTIONIST.email, password: PASSWORD });
  const docs = await sb.from('users').select('full_name, role_id, status, doctor_profiles(consultation_fee, rating)').eq('role_id', 2).eq('status', 'ACTIVE');
  results.push({ verifyAsReceptionist: { error: docs.error?.message || null, count: docs.data?.length, names: (docs.data || []).map(x => x.full_name) } });

  console.log(JSON.stringify({ results, login: { receptionist: { email: RECEPTIONIST.email, password: PASSWORD }, doctorPassword: PASSWORD } }, null, 2));
}
run().catch(e => { console.error('FATAL', e.message); process.exit(1); });
