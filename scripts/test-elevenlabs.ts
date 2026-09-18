/**
 * ElevenLabs Text-to-Speech proof-of-concept (server-side Node script only).
 *
 * Generates ONE Arabic Egyptian narration for the recipe "فول مدمس" and saves
 * it as a local MP3 for evaluation. This is intentionally a single-recipe test:
 * it does not touch Supabase, the database schema, audio_urls, or the client.
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

const VOICE_ID = 'kRMdi13Pz8QNEEDACcfH';
const MODEL_ID = 'eleven_multilingual_v2';
const OUTPUT_FORMAT = 'mp3_44100_128';
const API_BASE_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

const RECIPE_NAME = 'فول مدمس';
const SCRIPT_FILE = 'voice-scripts-egyptian-story.md';
const OUTPUT_FILE = path.join('scripts', 'output', 'ful-medames-test.mp3');

const ENV_FILE = '.env';

/**
 * Minimal .env loader (KEY=VALUE, `#` comments, optional quotes).
 * Existing process.env values take precedence so CI/real env vars win.
 */
function loadDotEnv(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }

    const separator = line.indexOf('=');
    if (separator <= 0) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    if (key.length === 0 || process.env[key] !== undefined) {
      continue;
    }

    let value = line.slice(separator + 1).trim();
    const isDoubleQuoted = value.startsWith('"') && value.endsWith('"');
    const isSingleQuoted = value.startsWith("'") && value.endsWith("'");
    if (value.length >= 2 && (isDoubleQuoted || isSingleQuoted)) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

/** Returns the API key or exits safely without ever echoing its value. */
function requireApiKey(): string {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      'ERROR: ELEVENLABS_API_KEY is missing. Add it to the gitignored .env file (server-side only).',
    );
    process.exit(1);
  }
  return apiKey;
}

/** Extracts the narration paragraph for a specific recipe heading from the markdown file. */
function readRecipeNarration(scriptPath: string, recipeName: string): string {
  const contents = fs.readFileSync(scriptPath, 'utf8');
  const lines = contents.split(/\r?\n/);

  const headingIndex = lines.findIndex(
    (line) => line.startsWith('## ') && line.includes(recipeName),
  );
  if (headingIndex === -1) {
    throw new Error(`Recipe "${recipeName}" was not found in ${SCRIPT_FILE}.`);
  }

  const paragraph: string[] = [];
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith('## ')) {
      break;
    }
    const trimmed = line.trim();
    if (trimmed.length > 0 && !trimmed.startsWith('>') && !trimmed.startsWith('#')) {
      paragraph.push(trimmed);
    }
  }

  const narration = paragraph.join(' ').replace(/\s+/g, ' ').trim();
  if (narration.length === 0) {
    throw new Error(`No narration text found under "${recipeName}".`);
  }
  return narration;
}

/** Calls ElevenLabs TTS and returns the raw MP3 bytes. */
async function synthesize(apiKey: string, text: string): Promise<Buffer> {
  const url = `${API_BASE_URL}/${VOICE_ID}?output_format=${OUTPUT_FORMAT}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0,
        use_speaker_boost: true,
      },
    }),
  });

  console.log(`HTTP status: ${response.status}`);

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `ElevenLabs request failed (HTTP ${response.status}): ${details.slice(0, 500)}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main(): Promise<void> {
  loadDotEnv(path.join(process.cwd(), ENV_FILE));
  const apiKey = requireApiKey();

  console.log('ElevenLabs request started');
  console.log(`Recipe: ${RECIPE_NAME}`);

  const scriptPath = path.join(process.cwd(), SCRIPT_FILE);
  const narration = readRecipeNarration(scriptPath, RECIPE_NAME);

  console.log(`Model: ${MODEL_ID}`);
  console.log(`Voice ID: ${VOICE_ID}`);
  console.log(`Narration characters: ${narration.length}`);

  const audio = await synthesize(apiKey, narration);
  if (audio.byteLength === 0) {
    throw new Error('ElevenLabs returned an empty audio payload.');
  }

  const outputPath = path.join(process.cwd(), OUTPUT_FILE);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, audio);

  console.log(`Output file: ${OUTPUT_FILE}`);
  console.log(`File size: ${audio.byteLength} bytes`);
  console.log('Success: MP3 generated');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failure: ${message}`);
  process.exitCode = 1;
});
