import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function seed() {
  console.log('Seeding Services...');
  const { error: e1 } = await supabase.from('services').upsert([
    { service_name: 'General Skin Consultation', description: 'Initial checkup and consultation for general skin issues.', price: 300000.00, duration_minutes: 30 },
    { service_name: 'Acne Treatment', description: 'Comprehensive acne treatment including extraction and light therapy.', price: 800000.00, duration_minutes: 60 },
    { service_name: 'Laser Hair Removal', description: 'Permanent hair reduction using advanced laser technology.', price: 1500000.00, duration_minutes: 45 },
    { service_name: 'Scar Revision Therapy', description: 'Treatment for reducing acne scars or surgical scars.', price: 2000000.00, duration_minutes: 60 }
  ], { onConflict: 'service_id', ignoreDuplicates: true });
  if (e1) console.error('Services Error:', e1.message);

  console.log('Seeding Medicines...');
  const { error: e2 } = await supabase.from('medicines').upsert([
    { medicine_name: 'Hydrocortisone 1% Cream', description: 'Mild topical steroid for inflammation' },
    { medicine_name: 'Isotretinoin 20mg', description: 'Oral medication for severe acne' },
    { medicine_name: 'Cetirizine 10mg', description: 'Antihistamine for allergy relief' }
  ], { onConflict: 'medicine_id', ignoreDuplicates: true });
  if (e2) console.error('Medicines Error:', e2.message);

  console.log('Seeding Vouchers...');
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(today.getDate() + 30);
  
  const { error: e3 } = await supabase.from('vouchers').upsert([
    { discount_type: 'PERCENTAGE', discount_value: 10.00, start_date: today.toISOString().split('T')[0], end_date: nextMonth.toISOString().split('T')[0], status: 'ACTIVE' },
    { discount_type: 'FIXED', discount_value: 50000.00, start_date: today.toISOString().split('T')[0], end_date: nextMonth.toISOString().split('T')[0], status: 'ACTIVE' }
  ], { onConflict: 'voucher_id', ignoreDuplicates: true });
  if (e3) console.error('Vouchers Error:', e3.message);

  console.log('Done!');
}
seed();
