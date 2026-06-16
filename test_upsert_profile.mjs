import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nmcnwoqkikfmyjxwnfer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY253b3FraWtmbXlqeHduZmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NDM1MjUsImV4cCI6MjA5NTAxOTUyNX0.vtQfsTnh-kvPgQukBZjbSYkjC2cZm-l7gKkgoSV1-qY'; // ANON key

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const actualPatientId = '4ec875c6-a6e0-423b-bad6-efeb65a44cc4';
  const { data, error } = await supabase.from('patient_profiles').upsert([{ patient_id: actualPatientId }], { onConflict: 'patient_id' });
  console.log("Upsert result:", data, error);
}

check();
