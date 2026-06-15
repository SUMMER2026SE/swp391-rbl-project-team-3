import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const url = envLines.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim();
const serviceKey = envLines.find(l => l.startsWith('VITE_SUPABASE_SERVICE_ROLE_KEY='))?.split('=')[1].trim();

const supabase = createClient(url, serviceKey);

async function test() {
  const { data, error } = await supabase.from('doctor_shifts').select('*');
  console.log("Shifts error:", error);
  console.log("Shifts count:", data ? data.length : 0);
  if (data && data.length > 0) {
    console.log("Sample shift date:", data[0].work_date);
  }
}

test();
