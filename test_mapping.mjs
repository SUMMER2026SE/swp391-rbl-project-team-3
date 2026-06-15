import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const url = envLines.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim();
const key = envLines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim();

const supabase = createClient(url, key);

const mockDoctorModel = {
  getAllDoctorsSync: () => [
    { id: 'doc-01', name: 'BS.CK1 Nguyễn Trần Doctor' }
  ]
};

async function test() {
  const { data, error } = await supabase.from('appointments').select('*');
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  const mapped = data.map(row => {
    const doc = mockDoctorModel.getAllDoctorsSync().find(d => d.id === row.doctor_id);
    return {
      ...row,
      id: row.appointment_id || row.id,
      doctorName: doc ? doc.name : 'Bác sĩ',
      date: row.appointment_date || row.date,
      time: row.start_time || row.time,
    };
  });
  
  console.log("Count:", mapped.length);
  console.log("Mapped appointments:", mapped.map(a => ({ id: a.id, doctor: a.doctorName, date: a.date, time: a.time, status: a.status })));
}

test();
