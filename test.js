async function test() {
  const url = 'https://nmcnwoqkikfmyjxwnfer.supabase.co/rest/v1/users';
  const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tY253b3FraWtmbXlqeHduZmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NDM1MjUsImV4cCI6MjA5NTAxOTUyNX0.vtQfsTnh-kvPgQukBZjbSYkjC2cZm-l7gKkgoSV1-qY';
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': apikey,
      'Authorization': 'Bearer ' + apikey, // anon key
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      user_id: '11111111-1111-1111-1111-111111111111',
      role_id: 5,
      full_name: 'Guest User',
      email: 'guest_' + Date.now() + '@guest.com'
    })
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
test();
