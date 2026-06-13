import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');

let url = '';
let key = '';
for (const line of envLines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
}

const supabase = createClient(url, key);

async function run() {
  const testId = '22222222-2222-2222-2222-222222222222';
  const { data, error } = await supabase.from('users').insert({ 
    user_id: testId, 
    role_id: 2, 
    email: 'test_doc2@test.com', 
    full_name: 'Test Doc', 
    status: 'ACTIVE' 
  }).select();
  console.log('Insert Error:', error);
  console.log('Insert Data:', data);
  if (!error) {
     await supabase.from('users').delete().eq('user_id', testId);
  }
}

run();
