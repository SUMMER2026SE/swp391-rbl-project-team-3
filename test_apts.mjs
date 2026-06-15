import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const url = envLines.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim();
const key = envLines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim();

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('appointments').select('*');
  console.log("Appointments error:", error);
  console.log("Appointments count:", data ? data.length : 0);
  if (data && data.length > 0) {
    console.log("Sample appointments:", data.map(a => ({ id: a.id, patient_id: a.patient_id, status: a.status })));
  }
}

test();
