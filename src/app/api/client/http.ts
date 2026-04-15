import { getSession } from './auth';

type RequestJsonOptions = RequestInit & {
  auth?: boolean;
  fallbackError?: string;
};

export async function getAccessToken() {
  const {
    data: { session },
  } = await getSession();

  return session?.access_token ?? '';
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  options: RequestJsonOptions = {}
) {
  const { auth = false, fallbackError = 'request_failed', headers, ...init } = options;
  const nextHeaders = new Headers(headers);

  if (auth) {
    const token = await getAccessToken();

    if (!token) {
      return { data: null, error: new Error('missing_session') };
    }

    nextHeaders.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(input, {
    ...init,
    headers: nextHeaders,
    cache: init.cache ?? (auth ? 'no-store' : undefined),
  });

  const data = (await res.json().catch(() => ({}))) as T & { error?: string };

  if (!res.ok) {
    return {
      data: null,
      error: new Error(data?.error ?? fallbackError),
    };
  }

  return { data, error: null };
}
