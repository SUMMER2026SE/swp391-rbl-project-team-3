import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');

let url = '';
let key = '';
for (const line of envLines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    url = line.split('=')[1].trim();
  } else if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    key = line.split('=')[1].trim();
  }
}

const supabase = createClient(url, key);

async function checkDoc() {
  const { data, error } = await supabase.from('doctor_profiles').select('*').limit(1);
  console.log("Doctor profiles error:", error);
  console.log("Doctor profiles data:", data);
}
checkDoc();
