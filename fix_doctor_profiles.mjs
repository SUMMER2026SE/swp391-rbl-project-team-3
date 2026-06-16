import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nmcnwoqkikfmyjxwnfer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY253b3FraWtmbXlqeHduZmVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ0MzUyNSwiZXhwIjoyMDk1MDE5NTI1fQ.k5dd8vdEiLScNfZ3wTrDE2r94iPmdlDX7mMSlefrkc0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMissingDoctorProfiles() {
  // Find all doctors in users table
  const { data: doctors, error } = await supabase.from('users').select('*').eq('role_id', 2);
  if (error) {
    console.error('Error fetching doctors:', error);
    return;
  }

  for (const doctor of doctors) {
    const doctorId = doctor.user_id;

    // Check if employee_profiles exists
    const { data: emp, error: empErr } = await supabase.from('employee_profiles').select('*').eq('employee_id', doctorId);
    if (!emp || emp.length === 0) {
      console.log(`Inserting missing employee_profiles for doctor ${doctorId}`);
      await supabase.from('employee_profiles').insert([{ 
        employee_id: doctorId,
        experience_years: 5,
        specialization: 'Da liễu tổng quát',
        work_schedule: 'Thứ Hai - Thứ Sáu'
      }]);
    }

    // Check if doctor_profiles exists
    const { data: doc, error: docErr } = await supabase.from('doctor_profiles').select('*').eq('doctor_id', doctorId);
    if (!doc || doc.length === 0) {
      console.log(`Inserting missing doctor_profiles for doctor ${doctorId}`);
      await supabase.from('doctor_profiles').insert([{ 
        doctor_id: doctorId,
        consultation_fee: 300000,
        description: 'Bác sĩ chuyên khoa da liễu',
        rating: 5.0,
        reviews_count: 0
      }]);
    }
  }

  console.log('Finished fixing missing doctor profiles.');
}

fixMissingDoctorProfiles();
