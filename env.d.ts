/// <reference types="node" />

// Typed EXPO_PUBLIC_* environment variables for strict TypeScript.
// These are inlined by Expo at build time; see .env.example for placeholders.
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  }
}
