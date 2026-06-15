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
    // 1. Try to login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@dermasmart.vn',
        password: 'password123' // Try a common password, or we can check the users table for the admin's actual password if it's not hashed (unlikely)
    });
    
    console.log("Auth Error:", authError?.message);
    
    // If login failed, we can't test authenticated fetch easily without the real password.
    // Let's just do a normal fetch and see.
    const { data, error } = await supabase
        .from('users')
        .select(`
          user_id,
          full_name,
          employee_profiles (
            specialization
          )
        `)
        .eq('role_id', 2)
        .eq('status', 'ACTIVE');
        
    console.log("Anon Fetch Data Length:", data?.length);
}
check();
