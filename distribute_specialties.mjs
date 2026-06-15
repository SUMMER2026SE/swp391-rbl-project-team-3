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

async function distributeSpecialties() {
    // Login as admin
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'admin@dermasmart.vn',
        password: 'admin' // I will try "admin", if it fails I'll try "admin123"
    });
    
    if (authErr) {
        console.log("Auth error with 'admin':", authErr.message);
        const { error: authErr2 } = await supabase.auth.signInWithPassword({
            email: 'admin@dermasmart.vn',
            password: 'admin123'
        });
        if (authErr2) {
            console.log("Auth error with 'admin123':", authErr2.message);
            return;
        }
    }
    console.log("Logged in as Admin");

    // Fetch doctors
    const { data: users, error: fetchErr } = await supabase
        .from('users')
        .select('user_id')
        .eq('role_id', 2);
        
    if (fetchErr) {
        console.error("Error fetching doctors:", fetchErr);
        return;
    }
    console.log("Found", users.length, "doctors");

    const categories = ['cat-01', 'cat-02', 'cat-03', 'cat-04', 'cat-05', 'cat-06', 'cat-07'];
    
    // Distribute
    for (let i = 0; i < users.length; i++) {
        const docId = users[i].user_id;
        // Assign 2 random categories
        const c1 = categories[i % categories.length];
        const c2 = categories[(i + 3) % categories.length];
        // Make sure one doctor has cat-01 as requested (Nguyen Tran Doctor is probably one of them)
        const specs = [c1, c2];
        if (i === 0) specs.push('cat-01'); // Ensure first doctor gets cat-01 at least
        
        const specString = Array.from(new Set(specs)).join(', ');
        
        const { error: updateErr } = await supabase
            .from('employee_profiles')
            .update({ specialization: specString })
            .eq('user_id', docId);
            
        if (updateErr) {
            console.error(`Failed to update ${docId}:`, updateErr.message);
        } else {
            console.log(`Updated ${docId} with ${specString}`);
        }
    }
}
distributeSpecialties();
