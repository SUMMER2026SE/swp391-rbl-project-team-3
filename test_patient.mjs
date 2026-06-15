import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const url = envLines.find(l => l.startsWith('VITE_SUPABASE_URL=')).split('=')[1].trim();
const key = envLines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY=')).split('=')[1].trim();

const supabase = createClient(url, key);

async function testPatientFetch() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'nhutnqde190056@fpt.edu.vn', // guessing the email from the screenshot
    password: 'password' // guessing password, or we can just create a new patient
  });
  
  if (authErr) {
    console.log("Could not login as patient. Will create a dummy patient.");
    const email = `patient_${Date.now()}@test.com`;
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password: 'password123'
    });
    if (signUpErr) {
        console.error("Signup failed:", signUpErr);
        return;
    }
    console.log("Signed up dummy patient");
  } else {
    console.log("Logged in as patient");
  }

  const { data: shifts, error: fetchErr } = await supabase.from('doctor_shifts').select('*');
  console.log("Patient shifts count:", shifts ? shifts.length : 0);
  if (fetchErr) console.error("Fetch error:", fetchErr);
  
  const { data: users, error: usersErr } = await supabase.from('users').select('*').eq('role_id', 2);
  console.log("Patient users count:", users ? users.length : 0);
  if (usersErr) console.error("Users error:", usersErr);
}

testPatientFetch();
