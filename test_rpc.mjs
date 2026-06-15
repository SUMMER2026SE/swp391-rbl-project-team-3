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

async function checkRPC() {
    const res = await fetch(`${url}/rest/v1/`, { headers: { apikey: key }});
    const json = await res.json();
    console.log(Object.keys(json.paths).filter(p => p.startsWith('/rpc/')));
}
checkRPC();
