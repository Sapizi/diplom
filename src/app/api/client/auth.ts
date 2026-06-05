import { getSupabase, getSupabaseOrNull, SUPABASE_ENV_ERROR_MESSAGE } from '../../../../lib/supabase';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

type SessionResult = Awaited<ReturnType<ReturnType<typeof getSupabase>['auth']['getSession']>>;
type PasswordSignInResult = Awaited<
  ReturnType<ReturnType<typeof getSupabase>['auth']['signInWithPassword']>
>;
type SignUpResult = Awaited<ReturnType<ReturnType<typeof getSupabase>['auth']['signUp']>>;
type ResetPasswordResult = Awaited<
  ReturnType<ReturnType<typeof getSupabase>['auth']['resetPasswordForEmail']>
>;
type UpdatePasswordResult = Awaited<ReturnType<ReturnType<typeof getSupabase>['auth']['updateUser']>>;
type SignOutResult = Awaited<ReturnType<ReturnType<typeof getSupabase>['auth']['signOut']>>;
type AuthStateChangeResult = ReturnType<ReturnType<typeof getSupabase>['auth']['onAuthStateChange']>;

let cachedSession: Session | null | undefined;
let sessionRequest: Promise<SessionResult> | null = null;

function setCachedSession(session: Session | null) {
  cachedSession = session;
}

function createMissingEnvError() {
  return new Error(SUPABASE_ENV_ERROR_MESSAGE);
}

function getAuthClientOrNull() {
  return getSupabaseOrNull()?.auth ?? null;
}

export async function getSession() {
  const auth = getAuthClientOrNull();

  if (!auth) {
    return {
      data: { session: null },
      error: createMissingEnvError(),
    } as unknown as SessionResult;
  }

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
    sessionRequest = auth
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
  const auth = getAuthClientOrNull();

  if (!auth) {
    return {
      data: { user: null, session: null },
      error: createMissingEnvError(),
    } as unknown as PasswordSignInResult;
  }

  return auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(
  email: string,
  password: string,
  options?: { name?: string; phone?: string }
) {
  const auth = getAuthClientOrNull();

  if (!auth) {
    return {
      data: { user: null, session: null },
      error: createMissingEnvError(),
    } as unknown as SignUpResult;
  }

  return auth.signUp({
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
  const auth = getAuthClientOrNull();

  if (!auth) {
    return {
      data: {},
      error: createMissingEnvError(),
    } as unknown as ResetPasswordResult;
  }

  return auth.resetPasswordForEmail(email, { redirectTo });
}

export async function updatePassword(password: string) {
  const auth = getAuthClientOrNull();

  if (!auth) {
    return {
      data: { user: null },
      error: createMissingEnvError(),
    } as unknown as UpdatePasswordResult;
  }

  return auth.updateUser({ password });
}

export async function signOut() {
  const auth = getAuthClientOrNull();

  if (!auth) {
    return {
      error: createMissingEnvError(),
    } as unknown as SignOutResult;
  }

  return auth.signOut();
}

export function redirectToHome() {
  if (typeof window !== 'undefined') {
    window.location.replace('/');
  }
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void | Promise<void>
) {
  const auth = getAuthClientOrNull();

  if (!auth) {
    return {
      data: {
        subscription: {
          unsubscribe() {},
        },
      },
      error: createMissingEnvError(),
    } as unknown as AuthStateChangeResult;
  }

  return auth.onAuthStateChange((event, session) => {
    setCachedSession(session);
    return callback(event, session);
  });
}
