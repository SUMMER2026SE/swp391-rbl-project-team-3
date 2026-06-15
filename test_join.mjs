import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const url = envLines.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim();
const key = envLines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim();

const supabase = createClient(url, key);

async function test() {
  const patientId = 'e5464b96-e7ca-4cb6-8d1f-eb6c572b8b99';
  const { data, error } = await supabase
        .from('appointments')
        .select('*, doctor:doctor_profiles(*), service:services(*)')
        .eq('patient_id', patientId);
  console.log("Error:", error);
  console.log("Count:", data ? data.length : 0);
}

test();
