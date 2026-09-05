/// <reference types="node" />
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const envUrl =
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ??
  process.env.SUPABASE_URL ??
  '';
const envKey =
  (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ??
  process.env.SUPABASE_ANON_KEY ??
  '';

export const supabase = createClient(envUrl, envKey);
