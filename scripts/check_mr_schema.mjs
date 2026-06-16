import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const sb = createClient(url, key);

async function run() {
  const { data, error } = await sb.from('medical_records').select('*').limit(1);
  console.log(data);
  if (error) console.error(error);
}
run();
