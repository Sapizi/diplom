import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserSupabase: SupabaseClient | null = null;
let missingEnvWarningShown = false;

export const SUPABASE_ENV_ERROR_MESSAGE = 'Отсутствуют переменные окружения Supabase';

function getSupabaseEnv() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  };
}

export function hasSupabaseEnv() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseOrNull() {
  if (!hasSupabaseEnv()) {
    if (!missingEnvWarningShown && typeof window !== 'undefined') {
      console.warn(SUPABASE_ENV_ERROR_MESSAGE);
      missingEnvWarningShown = true;
    }

    return null;
  }

  return getSupabase();
}

export function getSupabase() {
  if (browserSupabase) {
    return browserSupabase;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(SUPABASE_ENV_ERROR_MESSAGE);
  }

  browserSupabase = createClient(supabaseUrl, supabaseAnonKey);
  return browserSupabase;
}
