import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nmcnwoqkikfmyjxwnfer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY253b3FraWtmbXlqeHduZmVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ0MzUyNSwiZXhwIjoyMDk1MDE5NTI1fQ.k5dd8vdEiLScNfZ3wTrDE2r94iPmdlDX7mMSlefrkc0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const doctorId = 'b40d9e45-105b-49b2-af92-82746f1ab43e'; // Dr. Nguyễn Quang Nhựt
  const { data, error } = await supabase.from('employee_profiles').select('*').eq('employee_id', doctorId);
  console.log("Employee profiles:", data);
  console.log("Error:", error);
}

check();
