const fetch = require('node-fetch');
async function test() {
  const url = 'https://nmcnwoqkikfmyjxwnfer.supabase.co/rest/v1/appointments';
  const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY253b3FraWtmbXlqeHduZmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NDM1MjUsImV4cCI6MjA5NTAxOTUyNX0.vtQfsTnh-kvPgQukBZjbSYkjC2cZm-l7gKkgoSV1-qY';
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': apikey,
      'Authorization': 'Bearer ' + apikey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      doctor_id: 1, 
      patient_id: 1, 
      service: 'Test', 
      fee: 50000, 
      status: 'Đang giữ chỗ', 
      appointment_date: '2026-06-16', 
      start_time: '16:30', 
      end_time: '17:00', 
      reason: 'Guest'
    })
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
test();
