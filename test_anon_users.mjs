import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const url = envLines.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim();
const key = envLines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim();

const anonSupabase = createClient(url, key, { auth: { persistSession: false } });

async function testAnonUsers() {
  const { data, error } = await anonSupabase.from('users').select('*').eq('role_id', 2);
  console.log("Anon users count:", data ? data.length : 0, error);
}

testAnonUsers();
