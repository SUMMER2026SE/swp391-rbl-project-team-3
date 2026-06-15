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
    const { error } = await supabase.from('doctor_shifts').insert({
        doctor_id: '7ee698de-1377-44ac-bee7-fcc5e0a04ef1', // dummy or real id
        doctor_name: 'Test',
        work_date: '2026-06-15',
        start_time: '08:00',
        end_time: '17:00'
    });
    console.log("Insert Error:", error?.message || "Success!");
}
testInsert();
