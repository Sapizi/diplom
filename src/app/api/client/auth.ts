import { supabase } from '../../../../lib/supabase';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export async function getSession() {
  return supabase.auth.getSession();
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Auth getUser error:', error);
    return null;
  }
  return data.user ?? null;
}

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(
  email: string,
  password: string,
  options?: { name?: string; phone?: string }
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: options?.name,
        phone: options?.phone,
      },
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void | Promise<void>
) {
  return supabase.auth.onAuthStateChange(callback);
}
