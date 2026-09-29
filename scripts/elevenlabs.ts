/**
 * Shared ElevenLabs Text-to-Speech setup (server-side Node script only).
 *
 * This is the SINGLE source of truth for the narration voice, model, output
 * format and voice settings. Both consumers import from here so the batch
 * generator can never drift from the working single-recipe POC:
 *   - scripts/test-elevenlabs.ts     (one-recipe proof of concept)
 *   - scripts/generate-narration.ts  (batch generator)
 *
 * Security:
 *   - Reads ELEVENLABS_API_KEY from the gitignored .env file.
 *   - Never logs the API key or request headers.
 *   - Never exports or references an EXPO_PUBLIC_* ElevenLabs variable, so the
 *     key cannot leak into the client bundle.
 */

import * as fs from 'node:fs';

export const VOICE_ID = 'kRMdi13Pz8QNEEDACcfH';
export const MODEL_ID = 'eleven_multilingual_v2';
export const OUTPUT_FORMAT = 'mp3_44100_128';
export const API_BASE_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

/** Voice tuning, kept identical to the proven POC output. */
export const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
  use_speaker_boost: true,
} as const;

export const ENV_FILE = '.env';

/**
 * Minimal .env loader (KEY=VALUE, `#` comments, optional quotes).
 * Existing process.env values take precedence so CI/real env vars win.
 */
export function loadDotEnv(filePath: string): void {
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
export function requireApiKey(): string {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      'ERROR: ELEVENLABS_API_KEY is missing. Add it to the gitignored .env file (server-side only).',
    );
    process.exit(1);
  }
  return apiKey;
}

/**
 * Extracts the narration paragraph that follows a specific `## ` heading.
 *
 * Blockquote lines (`>`), further headings (`#`) and blank lines are ignored, so
 * the file's front-matter intro never bleeds into a recipe's narration.
 */
export function extractNarration(contents: string, headingLine: string): string {
  const lines = contents.split(/\r?\n/);

  const headingIndex = lines.findIndex((line) => line.trim() === headingLine);
  if (headingIndex === -1) {
    throw new Error(`Heading "${headingLine}" was not found in the script file.`);
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
    throw new Error(`No narration text found under "${headingLine}".`);
  }
  return narration;
}

export type SynthesisResult = {
  audio: Buffer;
  status: number;
  attempts: number;
};

export type SynthesisOptions = {
  /** Total attempts (1 = no retry). Retries only apply to 429 / 5xx. */
  attempts?: number;
  /** Base backoff in ms; grows linearly per retry. */
  backoffMs?: number;
  log?: (message: string) => void;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Calls ElevenLabs TTS and returns the raw MP3 bytes.
 *
 * Transient failures (HTTP 429 rate limit and 5xx) are retried with a growing
 * backoff — a single throttled request should not abort a long batch run.
 * Terminal failures (4xx other than 429) fail fast with the response body.
 */
export async function synthesize(
  apiKey: string,
  text: string,
  options: SynthesisOptions = {},
): Promise<SynthesisResult> {
  const totalAttempts = Math.max(1, options.attempts ?? 1);
  const backoffMs = options.backoffMs ?? 5000;
  const log = options.log ?? (() => {});

  const url = `${API_BASE_URL}/${VOICE_ID}?output_format=${OUTPUT_FORMAT}`;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
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
        voice_settings: VOICE_SETTINGS,
      }),
    });

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const audio = Buffer.from(arrayBuffer);
      if (audio.byteLength === 0) {
        throw new Error('ElevenLabs returned an empty audio payload.');
      }
      return { audio, status: response.status, attempts: attempt };
    }

    const details = await response.text();
    const retryable = response.status === 429 || response.status >= 500;
    lastError = new Error(
      `ElevenLabs request failed (HTTP ${response.status}): ${details.slice(0, 300)}`,
    );

    if (!retryable || attempt === totalAttempts) {
      throw lastError;
    }

    const wait = backoffMs * attempt;
    log(`  HTTP ${response.status} — retrying in ${Math.round(wait / 1000)}s (attempt ${attempt}/${totalAttempts})`);
    await sleep(wait);
  }

  throw lastError ?? new Error('ElevenLabs request failed for an unknown reason.');
}
