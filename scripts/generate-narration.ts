/**
 * Batch narration generator (server-side Node script only).
 *
 * Generates one MP3 per recipe from voice-scripts-egyptian-story.md into
 * output/<recipe-id>.mp3, so each file maps directly onto public.recipes.id.
 *
 * Reuses the shared ElevenLabs setup in scripts/elevenlabs.ts (same voice,
 * model, output format and voice_settings as the working POC), so narration
 * stays consistent across every recipe.
 *
 * This script GENERATES FILES ONLY. It does not touch Supabase, does not
 * insert into audio_urls, and does not upload anywhere.
 *
 * Behaviours:
 *   - Queues the first RECIPES_TO_PROCESS scripts, in file order, whose recipe
 *     already has narration (see NARRATED_RECIPE_IDS) skipped up front.
 *   - Resumable: an existing output/<id>.mp3 is skipped, never re-generated, so
 *     re-running after an interruption costs nothing for finished recipes.
 *   - Polite: sleeps DELAY_MS between requests, and retries 429/5xx with
 *     backoff so one throttled call cannot abort the batch.
 *
 * Run from the project root:
 *   node scripts/generate-narration.ts
 *   node scripts/generate-narration.ts --dry-run   # validate mappings, no API calls
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  ENV_FILE,
  MODEL_ID,
  VOICE_ID,
  extractNarration,
  loadDotEnv,
  requireApiKey,
  synthesize,
} from './elevenlabs.ts';

const SCRIPT_FILE = 'voice-scripts-egyptian-story.md';
const OUTPUT_DIR = 'output';
const RECIPES_TO_PROCESS = 20;

/** Pause between real API calls. Override with NARRATION_DELAY_MS. */
const DELAY_MS = Number(process.env.NARRATION_DELAY_MS ?? 1200);

/** Retries for 429/5xx; the batch is resumable, so this stays modest. */
const MAX_ATTEMPTS = 3;

/**
 * Recipes that ALREADY have a real row in public.audio_urls (verified against
 * the live catalog) — skipped so we never pay to re-narrate existing audio.
 * NOTE: every one of these URLs is currently an example.com placeholder, so
 * this list should be revised once real narration is uploaded.
 */
const NARRATED_RECIPE_IDS: ReadonlySet<string> = new Set([
  'molokhia',
  'oxtail',
  'koshary',
  'potatoChicken',
  'chickenPotato',
]);

/**
 * Ordered map of the script file's `## <n>. <Arabic title>` headings onto
 * public.recipes.id. Order matches the file, which is what "the first 20"
 * refers to. Titles must match public.recipes.title exactly.
 */
const SCRIPT_RECIPES: readonly { id: string; title: string }[] = [
  { id: 'ful-medames', title: 'فول مدمس' },
  { id: 'taameya', title: 'الطعمية المصرية' },
  { id: 'koshari', title: 'الكشري المصري' },
  { id: 'molokhia', title: 'الملوخية المصرية' },
  { id: 'hawawshi', title: 'الحواوشي المصري' },
  { id: 'kebda-iskandarani', title: 'الكبدة الإسكندراني' },
  { id: 'mesa3a', title: 'المسقعة باللحمة المفرومة' },
  { id: 'mahshi-mix', title: 'المحشي المشكل المصري' },
  { id: 'mahshi-cabbage', title: 'محشي الكرنب' },
  { id: 'mahshi-grape-leaves', title: 'محشي ورق العنب' },
  { id: 'mombar', title: 'الممبار المصري' },
  { id: 'fatta-meat', title: 'الفتة المصرية باللحمة' },
  { id: 'roqaq', title: 'الرقاق باللحمة المفرومة' },
  { id: 'bamia-meat', title: 'طاجن البامية باللحمة' },
  { id: 'sayadeya', title: 'أرز الصيادية بالسمك' },
  { id: 'roz-meammar', title: 'الأرز المعمر' },
  { id: 'feteer-meshaltet', title: 'الفطير المشلتت' },
  { id: 'egyptian-shakshuka', title: 'الشكشوكة المصرية' },
  { id: 'besara', title: 'البصارة المصرية' },
  { id: 'macarona-bechamel', title: 'المكرونة بالبشاميل' },
  { id: 'egyptian-lentil-soup', title: 'شوربة العدس المصرية' },
  { id: 'bamia-tomato', title: 'البامية بالصلصة' },
  { id: 'om-ali', title: 'أم علي' },
  { id: 'lokmet-adi', title: 'لقمة القاضي' },
  { id: 'roz-bel-laban', title: 'الأرز باللبن' },
  { id: 'lasagna', title: 'لازانيا باللحم والجبن' },
  { id: 'spaghetti-carbonara', title: 'سباجيتي كاربونارا' },
  { id: 'bolognese', title: 'سباجيتي بولونيز' },
  { id: 'chicken-parmesan', title: 'دجاج بارميزان' },
  { id: 'beef-stroganoff', title: 'بيف ستروجانوف' },
  { id: 'risotto-mushroom', title: 'ريزوتو بالمشروم' },
  { id: 'paella', title: 'باييلا بالدجاج والمأكولات البحرية' },
  { id: 'ratatouille', title: 'راتاتوي' },
  { id: 'shepherds-pie', title: 'فطيرة الراعي' },
  { id: 'chicken-pot-pie', title: 'فطيرة الدجاج والخضروات' },
  { id: 'fish-and-chips', title: 'فيش آند تشيبس' },
  { id: 'margherita-pizza', title: 'بيتزا مارجريتا' },
  { id: 'mac-and-cheese', title: 'ماك آند تشيز' },
  { id: 'chicken-alfredo', title: 'دجاج ألفريدو' },
  { id: 'shrimp-scampi', title: 'جمبري سكامبي' },
  { id: 'chicken-marsala', title: 'دجاج مارسالا' },
  { id: 'chicken-piccata', title: 'دجاج بيكاتا' },
  { id: 'pesto-pasta', title: 'مكرونة بستو' },
  { id: 'gnocchi-tomato', title: 'نيوكي بصلصة الطماطم' },
  { id: 'chicken-fajitas', title: 'فاهيتا الدجاج' },
  { id: 'beef-tacos', title: 'تاكو اللحم' },
  { id: 'quesadillas', title: 'كيساديلا الدجاج والجبن' },
  { id: 'chili-con-carne', title: 'تشيلي كون كارني' },
  { id: 'greek-salad', title: 'السلطة اليونانية' },
  { id: 'tiramisu', title: 'تيراميسو' },
];

type Outcome = 'generated' | 'already-present' | 'failed';

type Result = {
  id: string;
  title: string;
  outcome: Outcome;
  bytes?: number;
  characters?: number;
  reason?: string;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  loadDotEnv(path.join(process.cwd(), ENV_FILE));
  const apiKey = dryRun ? '' : requireApiKey();

  console.log('ElevenLabs batch narration');
  console.log(`Model: ${MODEL_ID}`);
  console.log(`Voice ID: ${VOICE_ID}`);
  console.log(`Delay between requests: ${DELAY_MS}ms`);
  console.log('');

  const scriptPath = path.join(process.cwd(), SCRIPT_FILE);
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Script file not found: ${SCRIPT_FILE}`);
  }
  const contents = fs.readFileSync(scriptPath, 'utf8');

  const outputDir = path.join(process.cwd(), OUTPUT_DIR);
  fs.mkdirSync(outputDir, { recursive: true });

  // 1. Build the work queue: file order, minus recipes that already have audio.
  const skippedForAudio = SCRIPT_RECIPES.filter((r) => NARRATED_RECIPE_IDS.has(r.id));
  const queue = SCRIPT_RECIPES.filter((r) => !NARRATED_RECIPE_IDS.has(r.id)).slice(
    0,
    RECIPES_TO_PROCESS,
  );

  if (skippedForAudio.length > 0) {
    console.log(`Skipped (already has narration in audio_urls): ${skippedForAudio.map((r) => r.id).join(', ')}`);
  }
  console.log(`Queue: ${queue.length} recipes`);
  console.log('');

  // Dry run: validate every heading maps to narration text, spending nothing.
  if (dryRun) {
    let problems = 0;
    for (const [index, recipe] of queue.entries()) {
      const outputPath = path.join(outputDir, `${recipe.id}.mp3`);
      const exists = fs.existsSync(outputPath);
      try {
        const headingLine = contents
          .split(/\r?\n/)
          .find((line) => line.startsWith('## ') && line.includes(recipe.title));
        if (!headingLine) {
          throw new Error(`heading for "${recipe.title}" not found`);
        }
        const narration = extractNarration(contents, headingLine);
        console.log(
          `  [${index + 1}] ${recipe.id.padEnd(24)} ${narration.length} chars` +
            (exists ? '  (file exists — will skip)' : ''),
        );
      } catch (error: unknown) {
        problems += 1;
        const reason = error instanceof Error ? error.message : String(error);
        console.log(`  [${index + 1}] ${recipe.id.padEnd(24)} PROBLEM: ${reason}`);
      }
    }
    console.log('');
    console.log(`Dry run complete. ${queue.length - problems}/${queue.length} recipes mapped cleanly.`);
    if (problems > 0) {
      process.exitCode = 1;
    }
    return;
  }

  const results: Result[] = [];
  let apiCalls = 0;

  for (const [index, recipe] of queue.entries()) {
    const label = `[${index + 1}/${queue.length}] ${recipe.id}`;
    const outputPath = path.join(outputDir, `${recipe.id}.mp3`);

    // 2. Resume support: never re-generate a file we already have.
    if (fs.existsSync(outputPath)) {
      const existing = fs.statSync(outputPath);
      console.log(`${label} — SKIP (file already exists, ${existing.size} bytes)`);
      results.push({ id: recipe.id, title: recipe.title, outcome: 'already-present', bytes: existing.size });
      continue;
    }

    try {
      const headingLine = contents
        .split(/\r?\n/)
        .find((line) => line.startsWith('## ') && line.includes(recipe.title));

      if (!headingLine) {
        throw new Error(`heading for "${recipe.title}" not found in ${SCRIPT_FILE}`);
      }

      const narration = extractNarration(contents, headingLine);

      if (apiCalls > 0) {
        await sleep(DELAY_MS);
      }

      const result = await synthesize(apiKey, narration, {
        attempts: MAX_ATTEMPTS,
        backoffMs: 5000,
        log: (message) => console.log(`${label}${message}`),
      });
      apiCalls += 1;

      fs.writeFileSync(outputPath, result.audio);

      console.log(`${label} — OK (${narration.length} chars, ${result.audio.byteLength} bytes)`);
      results.push({
        id: recipe.id,
        title: recipe.title,
        outcome: 'generated',
        bytes: result.audio.byteLength,
        characters: narration.length,
      });
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      console.log(`${label} — FAILED: ${reason}`);
      results.push({ id: recipe.id, title: recipe.title, outcome: 'failed', reason });
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  const generated = results.filter((r) => r.outcome === 'generated');
  const already = results.filter((r) => r.outcome === 'already-present');
  const failed = results.filter((r) => r.outcome === 'failed');

  console.log('');
  console.log('════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('════════════════════════════════════════');
  console.log(`Queued:              ${queue.length}`);
  console.log(`Generated:           ${generated.length}`);
  console.log(`Already present:     ${already.length}`);
  console.log(`Failed:              ${failed.length}`);
  console.log(`API calls made:      ${apiCalls}`);
  console.log('');

  console.log('Processed recipes:');
  for (const r of results) {
    const detail =
      r.outcome === 'failed'
        ? `FAILED — ${r.reason}`
        : `${r.outcome}${r.bytes ? ` (${r.bytes} bytes)` : ''}`;
    console.log(`  ${r.id.padEnd(24)} ${r.title} — ${detail}`);
  }

  if (failed.length > 0) {
    console.log('');
    console.log('Failures:');
    for (const r of failed) {
      console.log(`  ${r.id}: ${r.reason}`);
    }
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failure: ${message}`);
  process.exitCode = 1;
});
