import fs from 'fs';
import https from 'https';

const envLines = fs.readFileSync('.env', 'utf-8').split('\n');
let url = '', key = '';
for (const line of envLines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
}

const reqUrl = `${url}/rest/v1/?apikey=${key}`;

https.get(reqUrl, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const openapi = JSON.parse(data);
      const docSchedules = openapi.definitions?.doctor_schedules?.properties;
      console.log('doctor_schedules schema:', docSchedules);
      const appts = openapi.definitions?.appointments?.properties;
      console.log('appointments schema keys:', Object.keys(appts || {}));
    } catch(e) {
      console.log('Error parsing JSON:', e.message);
    }
  });
}).on('error', (err) => console.log('Error:', err.message));
