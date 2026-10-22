#!/usr/bin/env node
// One-time setup of the Trinity Mark 360 Supabase database, run from your own computer:
//   1. creates the tables, access rules, live updates and document storage (supabase/migrations)
//   2. creates the six demo staff accounts (skips any that already exist; remove them later
//      in one tap from Users & access)
//   3. gives each account its portal, name and initials
//   4. prints the accounts and their starting passwords
//
// Usage (PowerShell: set each with $env:NAME="value"; macOS/Linux: export NAME=value):
//   DATABASE_URL="postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres"
//   SUPABASE_URL="https://<project>.supabase.co"
//   SUPABASE_SECRET_KEY="sb_secret_..."
//   npm run setup-db
// Put %40 in place of any @ inside the password in DATABASE_URL.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import pg from 'pg';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const PEOPLE = [
  { email: 'daniel.k@trinitymark.co.tz', role: 'ceo', name: 'Daniel K.', title: 'Managing Director', k: 'DK' },
  { email: 'grace.m@trinitymark.co.tz', role: 'staff', name: 'Grace Mrema', title: 'Field Officer', k: 'GM' },
  { email: 'rose.t@trinitymark.co.tz', role: 'finance', name: 'Rose Temba', title: 'Finance Officer', k: 'RT' },
  { email: 'reception@trinitymark.co.tz', role: 'reception', name: 'Aisha Mbwana', title: 'Front Office', k: 'AM' },
  { email: 'store@trinitymark.co.tz', role: 'store', name: 'Fatma Hassan', title: 'Storekeeper', k: 'FH' },
  { email: 'print@trinitymark.co.tz', role: 'production', name: 'Juma Ally', title: 'Print Production Lead', k: 'JA' }
];

// Readable starting password, e.g. "Trinity-7f3k9q2m" (people should change it after first sign-in).
const password = () => 'Trinity-' + randomBytes(6).toString('base64url').replace(/[-_]/g, 'x').slice(0, 8);

function need(name) {
  const v = process.env[name];
  if (!v) { console.error(`Missing ${name}. See the instructions at the top of scripts/setup-database.mjs.`); process.exit(1); }
  return v;
}

async function createUser(url, key, p) {
  const res = await fetch(url.replace(/\/$/, '') + '/auth/v1/admin/users', {
    method: 'POST',
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: p.email, password: p.password, email_confirm: true, user_metadata: { full_name: p.name } })
  });
  if (res.ok) return 'created';
  const body = await res.json().catch(() => ({}));
  const msg = body.msg || body.message || body.error_description || body.error || res.statusText;
  if (res.status === 422 || /already/i.test(msg)) return 'exists';
  throw new Error(`Could not create ${p.email}: ${res.status} ${msg}`);
}

export async function main(env = process.env) {
  const dbUrl = env.DATABASE_URL || need('DATABASE_URL');
  const url = env.SUPABASE_URL || need('SUPABASE_URL');
  const key = env.SUPABASE_SECRET_KEY || need('SUPABASE_SECRET_KEY');
  if (/@[^@/]*@/.test(dbUrl.replace(/^postgres(ql)?:\/\//, ''))) {
    console.error('DATABASE_URL has an @ inside the password. Replace that @ with %40 and run again.');
    process.exit(1);
  }

  const db = new pg.Client({ connectionString: dbUrl, ssl: env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false } });
  try {
    await db.connect();
  } catch (err) {
    console.error('Could not connect to the database: ' + err.message);
    if (/ENOTFOUND|ENETUNREACH|EHOSTUNREACH/.test(err.code || err.message)) {
      console.error('Your network may not support the direct (IPv6) address. In Supabase click Connect → "Session pooler" and use that connection string instead.');
    }
    process.exit(1);
  }

  console.log('1/3  Creating tables, access rules and storage…');
  const dir = join(ROOT, 'supabase/migrations');
  for (const f of readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
    await db.query(readFileSync(join(dir, f), 'utf8'));
    console.log('     ✓ ' + f);
  }

  console.log('2/3  Creating staff accounts…');
  const people = PEOPLE.map(p => ({ ...p, password: password() }));
  for (const p of people) {
    p.status = await createUser(url, key, p);
    console.log(`     ${p.status === 'created' ? '✓ created' : '• already existed'}  ${p.email}`);
  }

  console.log('3/3  Giving each account its portal…');
  for (const p of people) {
    await db.query(
      `insert into public.profiles (user_id, full_name) select id, $2 from auth.users where email = $1 on conflict (user_id) do nothing`,
      [p.email, p.name]
    );
    await db.query(
      `update public.profiles pr set role = $2, full_name = $3, title = $4, person_key = $5, is_demo = true from auth.users u where u.id = pr.user_id and u.email = $1`,
      [p.email, p.role, p.name, p.title, p.k]
    );
  }
  const { rows } = await db.query(
    `select u.email, p.role, p.full_name from public.profiles p join auth.users u on u.id = p.user_id order by p.created_at`
  );
  await db.end();

  const PORTAL = { ceo: 'Management', staff: 'Staff', finance: 'Finance', reception: 'Reception', store: 'Store', production: 'Printing' };
  console.log('\nDone. Accounts in the database:\n');
  console.log('  Portal       Name            Email                          Starting password');
  for (const r of rows) {
    const p = people.find(x => x.email === r.email);
    const pw = p ? (p.status === 'created' ? p.password : '(unchanged)') : '';
    console.log(`  ${(PORTAL[r.role] || r.role).padEnd(12)} ${String(r.full_name).padEnd(15)} ${r.email.padEnd(30)} ${pw}`);
  }
  console.log('\nSign in to the app as Daniel first: that loads the starting data. Ask everyone to change their password.');
  return { rows, people };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(err => { console.error(err.message || err); process.exit(1); });
}
