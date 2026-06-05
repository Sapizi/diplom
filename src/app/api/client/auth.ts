import { getSupabase } from '../../../../lib/supabase';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

type SessionResult = Awaited<ReturnType<ReturnType<typeof getSupabase>['auth']['getSession']>>;

let cachedSession: Session | null | undefined;
let sessionRequest: Promise<SessionResult> | null = null;

function setCachedSession(session: Session | null) {
  cachedSession = session;
}

export async function getSession() {
  if (cachedSession !== undefined) {
    if (cachedSession) {
      return {
        data: { session: cachedSession },
        error: null,
      } as SessionResult;
    }

    return {
      data: { session: null },
      error: null,
    } as SessionResult;
  }

  if (!sessionRequest) {
    sessionRequest = getSupabase().auth
      .getSession()
      .then((result) => {
        setCachedSession(result.data.session ?? null);
        return result;
      })
      .finally(() => {
        sessionRequest = null;
      });
  }

  return sessionRequest;
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { session },
  } = await getSession();

  return session?.user ?? null;
}

export async function signInWithPassword(email: string, password: string) {
  return getSupabase().auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(
  email: string,
  password: string,
  options?: { name?: string; phone?: string }
) {
  return getSupabase().auth.signUp({
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

export async function requestPasswordReset(email: string, redirectTo: string) {
  return getSupabase().auth.resetPasswordForEmail(email, { redirectTo });
}

export async function updatePassword(password: string) {
  return getSupabase().auth.updateUser({ password });
}

export async function signOut() {
  return getSupabase().auth.signOut();
}

export function redirectToHome() {
  if (typeof window !== 'undefined') {
    window.location.replace('/');
  }
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void | Promise<void>
) {
  return getSupabase().auth.onAuthStateChange((event, session) => {
    setCachedSession(session);
    return callback(event, session);
  });
}
