import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const url = envLines.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim();
const key = envLines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim();

const supabase = createClient(url, key);

async function checkRLS() {
  const { data, error } = await supabase.rpc('get_policies');
  if (error) {
     console.log("Could not use rpc get_policies, trying pg_policies");
  } else {
     console.log(data);
  }
}

checkRLS();
