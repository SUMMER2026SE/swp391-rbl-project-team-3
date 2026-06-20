import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const url = envLines.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim();
const key = envLines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim();

const supabase = createClient(url, key);

async function test() {
  const patientId = '07147b19-b99e-4ea7-bb15-298d4abbc310';
  
  console.log("Testing service_tickets select...");
  const { data: tickets, error: ticketErr } = await supabase
    .from('service_tickets')
    .select(`
      id,
      service_name,
      status,
      result_notes,
      result_image_url,
      created_at,
      updated_at,
      appointment:appointments!inner (
        patient_id
      )
    `)
    .eq('appointment.patient_id', patientId);

  console.log("Query 1 result:", tickets, "Error:", ticketErr);

  console.log("Testing simpler service_tickets query...");
  const { data: tickets2, error: ticketErr2 } = await supabase
    .from('service_tickets')
    .select('*, appointment:appointments(*)');
  console.log("Query 2 first row:", tickets2 ? tickets2[0] : null, "Error:", ticketErr2);
}
test();
