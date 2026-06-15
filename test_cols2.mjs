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

async function checkCols() {
    // Intentional error to force PostgREST to return column names in the error hint or details
    const { error } = await supabase.from('doctor_shifts').insert({
        doctor_id: '7ee698de-1377-44ac-bee7-fcc5e0a04ef1', 
        INVALID_COLUMN_THAT_DOES_NOT_EXIST: 'test'
    });
    console.log("Error details:", JSON.stringify(error, null, 2));
}
checkCols();
