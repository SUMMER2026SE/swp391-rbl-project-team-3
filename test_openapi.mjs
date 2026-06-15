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
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Raw text snippet:", text.substring(0, 500));
    try {
      const json = JSON.parse(text);
      console.log("JSON Keys:", Object.keys(json));
      if (json.definitions) {
        console.log("Definitions keys:", Object.keys(json.definitions));
      }
    } catch (e) {
      console.log("Error parsing:", e.message);
    }
}

getOpenAPI();
