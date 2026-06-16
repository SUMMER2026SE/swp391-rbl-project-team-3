import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nmcnwoqkikfmyjxwnfer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY253b3FraWtmbXlqeHduZmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NDM1MjUsImV4cCI6MjA5NTAxOTUyNX0.vtQfsTnh-kvPgQukBZjbSYkjC2cZm-l7gKkgoSV1-qY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('doctor_shifts').select('*').limit(5);
  if (error) {
    console.error('Error fetching shifts:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}
run();
