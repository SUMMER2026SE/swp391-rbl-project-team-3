import { supabase } from './src/supabaseClient.js';

async function run() {
  const { data, error } = await supabase.from('doctor_shifts').select('*');
  if (error) {
    console.error('Error fetching shifts:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}
run();
