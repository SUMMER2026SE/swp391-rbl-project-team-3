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
  const dummyApt = {
    doctor_id: 'doc-01',
    patient_id: 'pat-01',
    date: '2026-06-15',
    time: '08:00',
    service: 'Khám da liễu tổng quát',
    fee: 300000,
    status: 'Đang chờ'
  };

  const { data, error } = await supabase
    .from('appointments')
    .insert([dummyApt])
    .select();

  console.log("Error:", error);
  console.log("Data:", data);
}

testInsert();
