import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const url = envLines.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim();
const key = envLines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim();

const supabase = createClient(url, key);

async function test() {
  const { data: adminSchedules, error } = await supabase
        .from('doctor_shifts')
        .select('*');

  const { data: users } = await supabase
        .from('users')
        .select(`
          user_id,
          employee_profiles (
            specialization
          )
        `)
        .eq('role_id', 2);

  const doctors = users.map(user => {
    const emp = user.employee_profiles ? (Array.isArray(user.employee_profiles) ? user.employee_profiles[0] : user.employee_profiles) : {};
    let specialties = [];
    if (emp?.specialization) {
       specialties = emp.specialization.split(',').map(s => s.trim());
    } else {
       specialties = ['cat-01'];
    }
    return {
      id: user.user_id,
      specialties
    };
  });

  const selectedDate = '2026-06-16';
  const selectedCategory = 'cat-01';

  const workingDocs = doctors.filter(doc => {
    if (!doc.specialties.includes(selectedCategory)) return false;
    return adminSchedules.some(s => String(s.doctor_id || s.doctorId) === String(doc.user_id || doc.id) && (s.work_date === selectedDate || s.date === selectedDate));
  });

  console.log("adminSchedules count:", adminSchedules ? adminSchedules.length : 0);
  console.log("doctors count:", doctors.length);
  console.log("workingDocs count:", workingDocs.length);
  
  if (workingDocs.length === 0 && doctors.length > 0) {
      console.log("Why is working docs 0?");
      const doc = doctors[0];
      console.log("Doc id:", doc.id);
      console.log("Doc specialties:", doc.specialties);
      console.log("Schedules for doc:", adminSchedules.filter(s => s.doctor_id === doc.id));
      console.log("Match date?", adminSchedules.some(s => s.work_date === selectedDate));
  }
}

test();
