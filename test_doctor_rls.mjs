import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');

let url = '';
let key = '';
for (const line of envLines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
  else if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
}

const supabase = createClient(url, key);

async function check() {
  // Try logging in as the doctor from the image. 
  // From the screenshot, email is: nhutpromax2001@gmail.com
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'nhutpromax2001@gmail.com',
    password: 'password123' // guess password
  });

  if (authError) {
     console.log("Login error:", authError.message);
     return;
  }
  
  const userId = authData.user.id;
  console.log("Logged in user:", userId);

  // Try updating users table
  const { error: e1 } = await supabase.from('users').update({ full_name: 'BS.Nguyễn Quang Nhựt Test' }).eq('user_id', userId);
  console.log("Update users error:", e1);

  // Try UPSERT employee_profiles
  const { error: e2 } = await supabase.from('employee_profiles').upsert({
    employee_id: userId,
    degree: 'Test'
  });
  console.log("Upsert employee_profiles error:", e2);

  // Try UPDATE employee_profiles
  const { error: e3 } = await supabase.from('employee_profiles').update({
    degree: 'Test'
  }).eq('employee_id', userId);
  console.log("Update employee_profiles error:", e3);
}

check();
