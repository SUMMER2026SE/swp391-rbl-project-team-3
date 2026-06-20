import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const url = envLines.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim();
const key = envLines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim();

const supabase = createClient(url, key);

async function checkDatabase() {
  // Check services table
  const { data: services, error: servicesErr } = await supabase.from('services').select('*').limit(5);
  console.log('Services:', services || servicesErr);

  // Check users table for Technicians
  const { data: techs, error: techsErr } = await supabase.from('users').select('user_id, full_name, role').eq('role', 'Technician');
  console.log('Technicians:', techs || techsErr);
}

checkDatabase();
