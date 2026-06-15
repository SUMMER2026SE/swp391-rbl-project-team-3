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

async function checkDoc() {
    const { data } = await supabase.from('users').select('user_id, full_name').ilike('full_name', '%Nguyễn Trần%');
    console.log("Docs:", data);
    if (data && data.length > 0) {
        const { data: prof } = await supabase.from('employee_profiles').select('*').eq('user_id', data[0].user_id);
        console.log("Profiles:", prof);
    }
}
checkDoc();
