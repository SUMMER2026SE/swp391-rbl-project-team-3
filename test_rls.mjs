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

async function checkRLS() {
    // Authenticate as admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@dermasmart.vn',
        password: 'password123' // guessing password or we can just try to fetch anonymously
    });
    
    // Fetch users anonymously
    const { data: anonData, error: anonError } = await supabase
        .from('users')
        .select('*');
        
    console.log("Anon Fetch Data Length:", anonData?.length);
    console.log("Anon Fetch Error:", anonError);
}

checkRLS();
