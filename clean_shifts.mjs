import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const url = envLines.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim();
const key = envLines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim();

const supabase = createClient(url, key);

async function cleanDuplicates() {
  const { data: shifts, error } = await supabase.from('doctor_shifts').select('*');
  if (error) {
    console.error("Error fetching shifts:", error);
    return;
  }

  const seen = new Set();
  const toDelete = [];

  for (const shift of shifts) {
    const key = `${shift.doctor_id}-${shift.work_date}-${shift.start_time}`;
    if (seen.has(key)) {
      toDelete.push(shift.id);
    } else {
      seen.add(key);
    }
  }

  if (toDelete.length > 0) {
    console.log(`Found ${toDelete.length} duplicates. Deleting...`);
    const { error: delErr } = await supabase.from('doctor_shifts').delete().in('id', toDelete);
    if (delErr) {
      console.error("Error deleting:", delErr);
    } else {
      console.log("Successfully deleted duplicates.");
    }
  } else {
    console.log("No duplicates found.");
  }
}

cleanDuplicates();
