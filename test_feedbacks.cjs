const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  console.log('Querying feedbacks...');
  const { data, error } = await supabase.from('feedbacks').select('*, patient:users(full_name)');
  console.log('Error:', error);
  console.log('Feedbacks length:', data ? data.length : 0);
  if (data) {
     const bsFeedbacks = data.filter(d => d.doctor_id === 'mock-doc-01' || d.doctor_id === 'b9415c8e-289f-4dbd-bbab-6b7454fa6a22' || d.doctor_id === '37bdaed4-638e-49b9-bad6-81d59666838f' || d.doctor_id === '3f9f381c-d7ab-4954-a621-e0cd22cb33be');
     console.log('Feedbacks for doctor:', bsFeedbacks);
  }
}
run();
