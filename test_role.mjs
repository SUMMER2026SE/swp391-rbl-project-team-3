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

async function check() {
    const { data, error } = await supabase
        .from('users')
        .select('role_id')
        .limit(1);
    console.log("Error:", error);
    console.log("Role ID typeof:", typeof data?.[0]?.role_id);
}
check();
