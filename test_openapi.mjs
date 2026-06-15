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

async function getOpenAPI() {
    const res = await fetch(`${url}/rest/v1/?apikey=${key}`);
    const json = await res.json();
    const tableDef = json.definitions['doctor_shifts'];
    console.log(JSON.stringify(tableDef, null, 2));
}

getOpenAPI();
