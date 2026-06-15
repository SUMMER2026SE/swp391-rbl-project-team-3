import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const url = envLines.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim();
const key = envLines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim();

const supabase = createClient(url, key);

async function generateShifts() {
  const { data: users, error: fetchErr } = await supabase
    .from('users')
    .select('user_id')
    .eq('role_id', 2); // doctors

  if (fetchErr) {
    console.error("Error fetching doctors:", fetchErr);
    return;
  }

  const shiftsToInsert = [];
  const today = new Date();
  
  // Generate shifts for next 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    for (const doc of users) {
      shiftsToInsert.push({
        doctor_id: doc.id || doc.user_id,
        work_date: dateStr,
        start_time: '08:00',
        end_time: '17:00',
        status: 'Đã phân công'
      });
    }
  }

  const { error: insertErr } = await supabase.from('doctor_shifts').insert(shiftsToInsert);
  
  if (insertErr) {
    console.error("Failed to insert shifts:", insertErr);
  } else {
    console.log("Successfully generated shifts for next 7 days in Supabase!");
  }
}

generateShifts();
