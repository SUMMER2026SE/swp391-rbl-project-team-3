import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nmcnwoqkikfmyjxwnfer.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY253b3FraWtmbXlqeHduZmVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ0MzUyNSwiZXhwIjoyMDk1MDE5NTI1fQ.k5dd8vdEiLScNfZ3wTrDE2r94iPmdlDX7mMSlefrkc0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

console.log(`Today: ${todayStr}`);
console.log('Looking for appointments with status "Đang chờ" today...\n');

// First, list them
const { data: pending, error: listErr } = await supabase
  .from('appointments')
  .select('appointment_id, patient_name, status, appointment_date, start_time')
  .eq('appointment_date', todayStr)
  .eq('status', 'Đang chờ');

if (listErr) {
  console.error('Error listing:', listErr);
  process.exit(1);
}

console.log(`Found ${pending?.length || 0} appointment(s) with status "Đang chờ":`);
pending?.forEach(a => console.log(`  - [${a.appointment_id}] ${a.patient_name} @ ${a.start_time} → status: ${a.status}`));

if (!pending?.length) {
  console.log('\nNo appointments to update.');
  process.exit(0);
}

// Update them to 'Đã xác nhận'
const ids = pending.map(a => a.appointment_id);
const { data: updated, error: updateErr } = await supabase
  .from('appointments')
  .update({ status: 'Đã xác nhận' })
  .in('appointment_id', ids)
  .select('appointment_id, patient_name, status');

if (updateErr) {
  console.error('\nError updating:', updateErr);
  process.exit(1);
}

console.log(`\nSuccessfully updated ${updated?.length || 0} appointment(s) to "Đã xác nhận":`);
updated?.forEach(a => console.log(`  ✅ [${a.appointment_id}] ${a.patient_name} → ${a.status}`));
