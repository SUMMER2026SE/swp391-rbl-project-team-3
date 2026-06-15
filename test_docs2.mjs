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

async function check() {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select(`
          user_id,
          full_name,
          avatar_url,
          employee_profiles (
            experience_years,
            specialization,
            work_schedule
          ),
          doctor_profiles (
            description,
            consultation_fee,
            rating,
            reviews_count
          )
        `)
        .eq('role_id', 2)
        .eq('status', 'ACTIVE');
        
    console.log("Error:", fetchError);
    console.log("Data length:", data?.length);
}
check();
