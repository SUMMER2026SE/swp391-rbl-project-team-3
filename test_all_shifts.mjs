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

async function checkAllShifts() {
    console.log("Fetching all shifts...");
    const { data, error } = await supabase
        .from('doctor_shifts')
        .select('*');
        
    console.log("Error:", error);
    console.log("All Shifts found:", data);
}
checkAllShifts();
