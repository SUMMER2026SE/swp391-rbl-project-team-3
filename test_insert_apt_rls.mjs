import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nmcnwoqkikfmyjxwnfer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY253b3FraWtmbXlqeHduZmVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ0MzUyNSwiZXhwIjoyMDk1MDE5NTI1fQ.k5dd8vdEiLScNfZ3wTrDE2r94iPmdlDX7mMSlefrkc0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  const { data: users } = await supabase.from('users').select('*').limit(2);
  console.log("Users:", users);

  const { data: doctors } = await supabase.from('users').select('*').eq('role_id', 2).limit(1);
  const doctorId = doctors[0]?.user_id;
  
  const dbPayload = {
      doctor_id: doctorId,
      patient_id: users[0]?.user_id,
      service: 'Khám da liễu tổng quát',
      fee: '300000',
      status: 'Đã xác nhận',
      appointment_date: '2026-06-29',
      start_time: '08:30:00',
      end_time: '09:00:00',
      reason: 'Khám bệnh',
  };

  const { data, error } = await supabase
    .from('appointments')
    .insert([dbPayload])
    .select();

  console.log("Insert result:", data, error);
}

checkRLS();
