// Seeds the 50 recipes from public/recipe.md into the canonical Supabase schema.
// recipe.md is the single source of truth for this content; this script parses it
// and upserts recipes + ingredients + steps + tips (idempotent, re-runnable).
//
// SECURITY: writes require the SERVICE ROLE key (RLS allows anon reads only).
//   $env:SUPABASE_URL="https://<ref>.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
//   node scripts/seed-from-recipe-md.js
// Or emit idempotent SQL for the Supabase SQL editor instead of connecting:
//   node scripts/seed-from-recipe-md.js --sql > src/db/seed-recipe-md.sql
//
// Per the file's own instructions: no fake image_url or audio_urls are created.

const fs = require('fs');
const path = require('path');

const MD_PATH = path.join(__dirname, '..', 'public', 'recipe.md');
const SORT_ORDER_START = 11; // existing authored catalog occupies 1..10

// ── Parsing ───────────────────────────────────────────────────────────────────

function field(block, name) {
  const m = block.match(new RegExp(`^- \\*\\*${name}:\\*\\* (.+)$`, 'm'));
  return m ? m[1].trim() : null;
}

function section(block, name) {
  const m = block.match(new RegExp(`### ${name}\\n([\\s\\S]*?)(?=\\n### |\\n## |$)`));
  return m ? m[1] : '';
}

const DIFFICULTY_MAP = { 'سهل': 'سهلة', 'متوسط': 'متوسطة', 'متقدم': 'صعبة' };

function categoryColor(category) {
  if (category === 'حلويات') return 'terracottaLight';
  if (category === 'فطور') return 'amber';
  if (['سلطات', 'شوربة', 'خضروات'].includes(category)) return 'mint';
  return 'olive';
}

// The file's steps are plain numbered sentences (no titles). Use a short
// natural prefix as the row title (the steps table requires one) and keep the
// full sentence as the body.
function stepTitle(body) {
  return body.split(/\s+/).slice(0, 4).join(' ');
}

function parseMarkdown(md) {
  const recipes = [];
  const blocks = md.split(/^## /m);
  for (const block of blocks) {
    const head = block.match(/^(\d+)\. (.+)$/m);
    if (!head || !/- \*\*ID:\*\*/.test(block)) continue; // skip file header sections

    const id = (field(block, 'ID') || '').replace(/`/g, ''); // md wraps slugs in backticks
    const title = head[2].trim();
    const category = field(block, 'التصنيف');
    const difficultyRaw = field(block, 'الصعوبة');
    const prep = field(block, 'وقت التحضير');
    const cook = field(block, 'وقت الطهي');
    const servings = field(block, 'الحصص');
    const description = field(block, 'الوصف');

    const ingredients = section(block, 'المكونات')
      .split('\n')
      .map((l) => l.replace(/^-\s*/, '').trim())
      .filter(Boolean);
    const steps = section(block, 'طريقة التحضير')
      .split('\n')
      .map((l) => l.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean);
    const tipBody = section(block, 'نصيحة')
      .split('\n')
      .map((l) => l.replace(/^-\s*/, '').trim())
      .filter(Boolean)
      .join(' ');

    recipes.push({
      id,
      title,
      category,
      difficulty: DIFFICULTY_MAP[difficultyRaw] ?? difficultyRaw,
      minutes: (parseInt(prep, 10) || 0) + (parseInt(cook, 10) || 0),
      persons: parseInt(servings, 10) || null,
      description,
      category_color: categoryColor(category),
      ingredients,
      steps,
      tipBody,
    });
  }
  return recipes;
}

function validate(recipes) {
  const errors = [];
  const seen = new Set();
  for (const r of recipes) {
    for (const key of ['id', 'title', 'category', 'description']) {
      if (!r[key]) errors.push(`${r.id || r.title || '?'}: missing ${key}`);
    }
    if (r.ingredients.length === 0) errors.push(`${r.id}: no ingredients`);
    if (r.steps.length === 0) errors.push(`${r.id}: no steps`);
    if (seen.has(r.id)) errors.push(`${r.id}: duplicate id`);
    seen.add(r.id);
  }
  return errors;
}

// ── Direct Supabase upsert (service role) ─────────────────────────────────────

async function upsertSupabase(recipes) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(
      'Refusing to run: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.\n' +
        'Writes bypass RLS and require the service role — the anon key cannot write.'
    );
    process.exit(1);
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const recipeRows = recipes.map((r, i) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    minutes: r.minutes,
    persons: r.persons,
    difficulty: r.difficulty,
    audio_available: false,
    category_color: r.category_color,
    sort_order: SORT_ORDER_START + i,
  }));

  const ingredientRows = recipes.flatMap((r) =>
    r.ingredients.map((text, i) => ({ recipe_id: r.id, text, sort_order: i + 1 }))
  );
  const stepRows = recipes.flatMap((r) =>
    r.steps.map((body, i) => ({ recipe_id: r.id, title: stepTitle(body), body, sort_order: i + 1 }))
  );
  const tipRows = recipes
    .filter((r) => r.tipBody)
    .map((r) => ({ recipe_id: r.id, title: 'نصيحة', body: r.tipBody, sort_order: 1 }));

  const plan = [
    { table: 'recipes', rows: recipeRows, onConflict: 'id' },
    { table: 'ingredients', rows: ingredientRows, onConflict: 'recipe_id,sort_order' },
    { table: 'steps', rows: stepRows, onConflict: 'recipe_id,sort_order' },
    { table: 'tips', rows: tipRows, onConflict: 'recipe_id,sort_order' },
  ];

  for (const { table, rows, onConflict } of plan) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict });
    if (error) {
      console.error(`  ${table}: FAILED — ${error.message}`);
      process.exitCode = 1;
    } else {
      console.log(`  ${table}: ${rows.length} row(s) upserted`);
    }
  }
}

// ── SQL emission (for the Supabase SQL editor) ────────────────────────────────

const esc = (s) => `'${String(s).replace(/'/g, "''")}'`;

function toSql(recipes) {
  const recipeValues = recipes.map((r, i) =>
    `  (${esc(r.id)}, ${esc(r.title)}, ${esc(r.description)}, ${esc(r.category)}, ${r.minutes}, ${r.persons ?? 'NULL'}, ${esc(r.difficulty)}, false, ${esc(r.category_color)}, ${SORT_ORDER_START + i})`
  );
  const ingredientValues = recipes.flatMap((r) =>
    r.ingredients.map((text, i) => `  (${esc(r.id)}, ${esc(text)}, ${i + 1})`)
  );
  const stepValues = recipes.flatMap((r) =>
    r.steps.map((body, i) => `  (${esc(r.id)}, ${esc(stepTitle(body))}, ${esc(body)}, ${i + 1})`)
  );
  const tipValues = recipes
    .filter((r) => r.tipBody)
    .map((r) => `  (${esc(r.id)}, ${esc('نصيحة')}, ${esc(r.tipBody)}, 1)`);

  return `-- Auto-generated from public/recipe.md (${recipes.length} recipes, sort_order ${SORT_ORDER_START}..${SORT_ORDER_START + recipes.length - 1})
-- Idempotent: safe to re-run. No image/audio URLs (per source instructions).

insert into public.recipes (id, title, description, category, minutes, persons, difficulty, audio_available, category_color, sort_order) values
${recipeValues.join(',\n')}
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  minutes = excluded.minutes,
  persons = excluded.persons,
  difficulty = excluded.difficulty,
  audio_available = excluded.audio_available,
  category_color = excluded.category_color,
  sort_order = excluded.sort_order;

insert into public.ingredients (recipe_id, text, sort_order) values
${ingredientValues.join(',\n')}
on conflict (recipe_id, sort_order) do update set text = excluded.text;

insert into public.steps (recipe_id, title, body, sort_order) values
${stepValues.join(',\n')}
on conflict (recipe_id, sort_order) do update set
  title = excluded.title,
  body = excluded.body;

insert into public.tips (recipe_id, title, body, sort_order) values
${tipValues.join(',\n')}
on conflict (recipe_id, sort_order) do update set
  title = excluded.title,
  body = excluded.body;
`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const md = fs.readFileSync(MD_PATH, 'utf8');
  const recipes = parseMarkdown(md);
  // Info logs go to stderr so `--sql` stdout redirection stays pure SQL.
  console.error(`Parsed ${recipes.length} recipes from ${path.basename(MD_PATH)}`);

  const errors = validate(recipes);
  if (errors.length) {
    console.error('Validation failed:');
    for (const e of errors) console.error('  - ' + e);
    process.exit(1);
  }
  console.error('Validation passed: every recipe has id, title, category, description, ingredients, steps.');

  if (process.argv.includes('--sql')) {
    process.stdout.write(toSql(recipes));
    return;
  }

  upsertSupabase(recipes).catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}

if (require.main === module) {
  main();
}

module.exports = { parseMarkdown, validate, stepTitle, toSql };
