import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nmcnwoqkikfmyjxwnfer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY253b3FraWtmbXlqeHduZmVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ0MzUyNSwiZXhwIjoyMDk1MDE5NTI1fQ.k5dd8vdEiLScNfZ3wTrDE2r94iPmdlDX7mMSlefrkc0'; // service_role

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const proxyGuestId = '18504773-0f51-405a-aa32-70cae403be6e';
  const { data, error } = await supabase
    .from('employee_profiles')
    .select('*')
    .eq('employee_id', proxyGuestId)
    .maybeSingle();

  if (error) {
    console.error('Error looking up employee profile for Nguyễn Thu:', error);
  } else {
    console.log('Nguyễn Thu in employee_profiles:', data);
  }
}

run();
