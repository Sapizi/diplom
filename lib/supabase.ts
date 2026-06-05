import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserSupabase: SupabaseClient | null = null;

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

export function getSupabase() {
  if (browserSupabase) {
    return browserSupabase;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Отсутствуют переменные окружения Supabase');
  }

  browserSupabase = createClient(supabaseUrl, supabaseAnonKey);
  return browserSupabase;
}
