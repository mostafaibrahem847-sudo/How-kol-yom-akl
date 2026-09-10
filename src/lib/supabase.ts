import { createClient } from '@supabase/supabase-js';

// Client configuration comes from EXPO_PUBLIC_* variables (see .env.example).
// Expo inlines EXPO_PUBLIC_* into the bundle at build time, so these values are
// public by design. The anon/publishable key is safe to ship ONLY because the
// database enforces Row-Level Security (see src/db/schema.sql): anonymous access
// is read-only over the recipe catalog.
//
// Never put the service-role key in this client.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
