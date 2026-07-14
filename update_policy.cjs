const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
require('dotenv').config();
const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    await client.query(`
      drop policy if exists "users_select" on public.users;
      create policy "users_select" on public.users
        for select using (
          auth.uid() = user_id
          or public.current_role_id() in (1, 2, 3, 4)
          or role_id in (2, 3)
        );
    `);
    console.log('Policy updated successfully');
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
