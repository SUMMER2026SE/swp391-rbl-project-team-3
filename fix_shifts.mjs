import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nmcnwoqkikfmyjxwnfer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY253b3FraWtmbXlqeHduZmVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ0MzUyNSwiZXhwIjoyMDk1MDE5NTI1fQ.k5dd8vdEiLScNfZ3wTrDE2r94iPmdlDX7mMSlefrkc0';

const supabase = createClient(supabaseUrl, supabaseKey);

function getVietnameseDayName(dateString) {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[new Date(dateString).getDay()];
}

async function fixDaysOfWeek() {
  const { data: shifts, error } = await supabase.from('doctor_shifts').select('*');
  if (error) {
    console.error('Error fetching shifts:', error);
    return;
  }
  
  for (const shift of shifts) {
    const correctDay = getVietnameseDayName(shift.work_date);
    if (shift.day_of_week !== correctDay) {
      console.log(`Fixing shift ${shift.id} from ${shift.day_of_week} to ${correctDay}`);
      await supabase.from('doctor_shifts').update({ day_of_week: correctDay }).eq('id', shift.id);
    }
  }
  console.log('Finished fixing days of week.');
}

fixDaysOfWeek();
