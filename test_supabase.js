import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Test 1: getAll with fkey hint
  const { data: d1, error: e1 } = await supabase.from('feedbacks').select('feedback_id, patient:users!feedbacks_patient_id_fkey(full_name)').limit(2);
  console.log('Test 1 (fkey hint) error:', e1?.message);
  console.log('Test 1 data:', d1);

  // Test 2: without fkey hint
  const { data: d2, error: e2 } = await supabase.from('feedbacks').select('feedback_id, patient:users(full_name)').limit(2);
  console.log('Test 2 (no hint) error:', e2?.message);
  console.log('Test 2 data:', d2);

  // Test 3: just raw feedbacks
  const { data: d3, error: e3 } = await supabase.from('feedbacks').select('feedback_id, patient_id, rating').limit(3);
  console.log('Test 3 (raw) error:', e3?.message);
  console.log('Test 3 data:', d3);
}

test();
