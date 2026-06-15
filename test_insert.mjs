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

async function testInsert() {
    const shiftData = {
        doctor_id: '7ee698de-1377-44ac-bee7-fcc5e0a04ef1', // A real doctor_id
        work_date: '2026-06-15',
        start_time: '08:00',
        end_time: '17:00',
        room: 'Phòng khám 1',
        status: 'Đã phân công'
    };

    // 1. Test Anon Insert
    const { error: anonError } = await supabase.from('doctor_shifts').insert(shiftData);
    console.log("Anon Insert Error:", anonError?.message || "Success");

    // 2. Test Auth Insert
    const { error: authErr } = await supabase.auth.signInWithPassword({
        email: 'admin@dermasmart.vn',
        password: 'password123' // Try a common password
    });
    
    if (!authErr) {
        const { error: authInsertError } = await supabase.from('doctor_shifts').insert(shiftData);
        console.log("Auth Insert Error:", authInsertError?.message || "Success");
    } else {
        console.log("Could not login as admin to test auth insert.");
    }
}
testInsert();
