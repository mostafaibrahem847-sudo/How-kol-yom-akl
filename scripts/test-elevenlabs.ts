/**
 * ElevenLabs Text-to-Speech proof-of-concept (server-side Node script only).
 *
 * Generates ONE Arabic Egyptian narration for the recipe "فول مدمس" and saves
 * it as a local MP3 for evaluation. This is intentionally a single-recipe test:
 * it does not touch Supabase, the database schema, audio_urls, or the client.
 *
 * Voice/model/settings come from scripts/elevenlabs.ts — the same shared
 * configuration the batch generator uses, so the two can never drift apart.
 *
 * Security:
 *   - Reads ELEVENLABS_API_KEY from the gitignored .env file.
 *   - Never logs the API key or request headers.
 *   - Never exports or references an EXPO_PUBLIC_* ElevenLabs variable.
 *
 * Run from the project root:
 *   node scripts/test-elevenlabs.ts
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

const RECIPE_NAME = 'فول مدمس';
const SCRIPT_FILE = 'voice-scripts-egyptian-story.md';
const OUTPUT_FILE = path.join('scripts', 'output', 'ful-medames-test.mp3');

async function main(): Promise<void> {
  loadDotEnv(path.join(process.cwd(), ENV_FILE));
  const apiKey = requireApiKey();

  console.log('ElevenLabs request started');
  console.log(`Recipe: ${RECIPE_NAME}`);

  const scriptPath = path.join(process.cwd(), SCRIPT_FILE);
  const contents = fs.readFileSync(scriptPath, 'utf8');
  const headingLine = contents
    .split(/\r?\n/)
    .find((line) => line.startsWith('## ') && line.includes(RECIPE_NAME));

  if (!headingLine) {
    throw new Error(`Recipe "${RECIPE_NAME}" was not found in ${SCRIPT_FILE}.`);
  }

  const narration = extractNarration(contents, headingLine);

  console.log(`Model: ${MODEL_ID}`);
  console.log(`Voice ID: ${VOICE_ID}`);
  console.log(`Narration characters: ${narration.length}`);

  const result = await synthesize(apiKey, narration);
  console.log(`HTTP status: ${result.status}`);

  const outputPath = path.join(process.cwd(), OUTPUT_FILE);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, result.audio);

  console.log(`Output file: ${OUTPUT_FILE}`);
  console.log(`File size: ${result.audio.byteLength} bytes`);
  console.log('Success: MP3 generated');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failure: ${message}`);
  process.exitCode = 1;
});
