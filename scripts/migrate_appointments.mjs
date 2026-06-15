import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const url = envLines.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim();
const key = envLines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim();

const supabase = createClient(url, key);

async function migrate() {
  console.log("Fetching all appointments...");
  const { data: apps, error: fetchErr } = await supabase.from('appointments').select('*');
  
  if (fetchErr) {
    console.error("Fetch error:", fetchErr);
    return;
  }
  
  console.log(`Found ${apps.length} appointments to check.`);
  
  let updatedCount = 0;
  for (const apt of apps) {
    const updates = {};
    let needsUpdate = false;
    
    // Copy date -> appointment_date if appointment_date is null
    if (!apt.appointment_date && apt.date) {
      updates.appointment_date = apt.date;
      needsUpdate = true;
    }
    
    // Copy time -> start_time and end_time if they are null
    if (!apt.start_time && apt.time) {
      updates.start_time = apt.time;
      needsUpdate = true;
    }
    if (!apt.end_time && apt.time) {
      updates.end_time = apt.time;
      needsUpdate = true;
    }
    
    // Copy notes -> reason if reason is null
    if (!apt.reason && apt.notes) {
      updates.reason = apt.notes;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      console.log(`Updating appointment ${apt.appointment_id}...`);
      const { error: updateErr } = await supabase.from('appointments').update(updates).eq('appointment_id', apt.appointment_id);
      if (updateErr) {
        console.error(`Failed to update ${apt.appointment_id}:`, updateErr);
      } else {
        updatedCount++;
      }
    }
  }
  
  console.log(`Migration complete! Updated ${updatedCount} appointments.`);
}

migrate();
