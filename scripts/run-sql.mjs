/**
 * run-sql.mjs — apply a .sql file (or inline SQL) to the live Supabase database.
 *
 * The Supabase CLI binary is blocked in this environment, so migrations are
 * applied over a direct Postgres connection instead.
 *
 * Usage:
 *   node scripts/run-sql.mjs supabase/migrations/20260728_xxx.sql
 *   node scripts/run-sql.mjs --sql "select count(*) from public.users"
 *
 * Requires SUPABASE_DB_URL in .env.local (pooler connection string).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env.local') });

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/run-sql.mjs <file.sql> | --sql "<statement>"');
  process.exit(1);
}

const inline = args[0] === '--sql';
const sql = inline ? args.slice(1).join(' ') : fs.readFileSync(path.resolve(root, args[0]), 'utf-8');
const label = inline ? '<inline>' : args[0];

const rawUrl = process.env.SUPABASE_DB_URL;
if (!rawUrl) {
  console.error('SUPABASE_DB_URL is missing from .env.local');
  process.exit(1);
}

/* The direct host (db.<ref>.supabase.co) is IPv6-only and does not resolve from
   most local networks. Rewrite it to the session-mode pooler, which is IPv4 and
   accepts DDL. Set SUPABASE_POOLER_HOST to override the region. */
function toPoolerUrl(raw) {
  const u = new URL(raw);
  const match = /^db\.([a-z0-9]+)\.supabase\.co$/.exec(u.hostname);
  if (!match) return raw;
  const ref = match[1];
  u.hostname = process.env.SUPABASE_POOLER_HOST || 'aws-1-ap-southeast-2.pooler.supabase.com';
  u.port = '5432'; // session mode — required for DDL / multi-statement scripts
  u.username = `postgres.${ref}`;
  return u.toString();
}

const connectionString = toPoolerUrl(rawUrl);

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
// RAISE NOTICE is how DO blocks report progress — surface it instead of dropping it.
client.on('notice', (n) => console.log(`  ℹ ${n.message}`));
await client.connect();

try {
  const result = await client.query(sql);
  const results = Array.isArray(result) ? result : [result];
  for (const r of results) {
    if (r.rows?.length) console.table(r.rows);
  }
  console.log(`✅ Applied ${label}`);
} catch (err) {
  console.error(`❌ Failed on ${label}:`, err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
