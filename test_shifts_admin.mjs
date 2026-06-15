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

async function checkShiftsAdmin() {
    // We already know admin login fails from my previous test, wait.
    // In previous test I used admin@dermasmart.vn and "admin" / "admin123" and it said "Invalid login credentials".
    // Is there any other way to check? 
    // Wait! Let me just look at the response in BookAppointmentForm from my anon Supabase.
    // If the Admin created it, it's in the database. If Anon can't see it, it's an RLS issue on SELECT.
    const { data } = await supabase.from('doctor_shifts').select('*');
    console.log("Anon shifts:", data);
}
checkShiftsAdmin();
