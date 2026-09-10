// Canonical seed runner (Phase 1 — Backend Foundation)
//
// SECURITY: this script writes to the database, so it requires the Supabase
// SERVICE ROLE key. It refuses to run with the public anon key and has no
// hard-coded fallback credentials. The service role is a server-only secret and
// must never be committed or shipped in the mobile app.
//
// Usage (PowerShell):
//   $env:SUPABASE_URL="https://<ref>.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
//   node scripts/migrate.js
//
// Schema DDL is NOT applied by this script (PostgREST cannot run DDL). Apply
// src/db/schema.sql first with the service role via the Supabase SQL editor or
// `supabase db`. This script then seeds the canonical content from
// src/db/seed.sql. Both steps use the same single source files.

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ── Minimal parser for the controlled INSERT format in src/db/seed.sql ────────

function parseTuples(body) {
  const oc = body.search(/ON CONFLICT/i);
  const valuesPart = oc >= 0 ? body.slice(0, oc) : body;
  const tuples = [];
  let i = 0;
  const n = valuesPart.length;
  while (i < n) {
    while (i < n && /[\s,]/.test(valuesPart[i])) i++;
    if (i >= n) break;
    if (valuesPart[i] !== '(') {
      i++;
      continue;
    }
    i++;
    let depth = 1;
    let inStr = false;
    let cur = '';
    while (i < n && depth > 0) {
      const c = valuesPart[i];
      if (inStr) {
        if (c === "'") {
          if (valuesPart[i + 1] === "'") {
            cur += "''";
            i += 2;
            continue;
          }
          inStr = false;
          cur += c;
          i++;
          continue;
        }
        cur += c;
        i++;
        continue;
      }
      if (c === "'") {
        inStr = true;
        cur += c;
        i++;
        continue;
      }
      if (c === '(') {
        depth++;
        cur += c;
        i++;
        continue;
      }
      if (c === ')') {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
        cur += c;
        i++;
        continue;
      }
      cur += c;
      i++;
    }
    tuples.push(cur);
  }
  return tuples;
}

function splitValues(tuple) {
  const out = [];
  let inStr = false;
  let cur = '';
  for (let i = 0; i < tuple.length; i++) {
    const c = tuple[i];
    if (inStr) {
      if (c === "'") {
        if (tuple[i + 1] === "'") {
          cur += "''";
          i++;
          continue;
        }
        inStr = false;
        cur += c;
        continue;
      }
      cur += c;
      continue;
    }
    if (c === "'") {
      inStr = true;
      cur += c;
      continue;
    }
    if (c === ',') {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

function toJs(raw) {
  const s = String(raw).trim();
  if (/^null$/i.test(s)) return null;
  if (/^true$/i.test(s)) return true;
  if (/^false$/i.test(s)) return false;
  if (/^'.*'$/.test(s)) return s.slice(1, -1).replace(/''/g, "'");
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

function parseSeed(sql) {
  const tables = {};
  const stmtRe = /INSERT INTO\s+(?:\w+\.)?(\w+)\s*\(([^)]*)\)\s*VALUES([\s\S]*?);/gi;
  let m;
  while ((m = stmtRe.exec(sql)) !== null) {
    const table = m[1].toLowerCase();
    const cols = m[2].split(',').map((c) => c.trim());
    const rows = parseTuples(m[3]).map((t) => {
      const vals = splitValues(t);
      if (vals.length !== cols.length) {
        throw new Error(
          `Malformed seed row in "${table}": expected ${cols.length} values, got ${vals.length}`
        );
      }
      const row = {};
      cols.forEach((c, idx) => {
        row[c] = toJs(vals[idx]);
      });
      return row;
    });
    tables[table] = rows;
  }
  return tables;
}

// Insert order respects the recipes foreign key.
const PLAN = [
  { table: 'recipes', onConflict: 'id' },
  { table: 'ingredients', onConflict: 'recipe_id,sort_order' },
  { table: 'steps', onConflict: 'recipe_id,sort_order' },
  { table: 'tips', onConflict: 'recipe_id,sort_order' },
  { table: 'audio_urls', onConflict: 'recipe_id' },
];

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(
      'Refusing to run: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.\n' +
        'This seeder never uses the anon key and has no hard-coded credentials.'
    );
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const seedPath = path.join(__dirname, '..', 'src', 'db', 'seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');
  const tables = parseSeed(sql);

  console.log(`Seeding from ${seedPath} using the service role...`);

  for (const { table, onConflict } of PLAN) {
    const rows = tables[table];
    if (!rows || rows.length === 0) continue;
    const { error } = await supabase.from(table).upsert(rows, { onConflict });
    if (error) {
      console.error(`  ${table}: FAILED — ${error.message}`);
      process.exitCode = 1;
    } else {
      console.log(`  ${table}: ${rows.length} row(s) upserted`);
    }
  }

  console.log('Seed complete.');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}

module.exports = { parseSeed };
