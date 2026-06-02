import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type ServerRoleProfile = {
  name: string | null;
  isAdmin: boolean | null;
  isCourer: boolean | null;
  isManager: boolean | null;
};

type AuthenticatedUser = {
  id: string;
  email: string | null;
};

type AuthenticatedRequest = {
  user: AuthenticatedUser;
  profile: ServerRoleProfile | null;
};

type AuthClaims = {
  sub?: string;
  email?: string;
};

const authRequestCache = new Map<
  string,
  {
    expiresAt: number;
    value: AuthenticatedRequest;
  }
>();
const authRequestsInFlight = new Map<string, Promise<AuthenticatedRequest>>();
const AUTH_CACHE_TTL_MS = 5_000;

export function createServiceSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role key');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

async function loadAuthenticatedRequest(token: string): Promise<AuthenticatedRequest> {
  const supabase = createServiceSupabase();
  const {
    data,
    error: claimsError,
  } = await supabase.auth.getClaims(token);

  const claims = data?.claims as AuthClaims | undefined;
  const userId = typeof claims?.sub === 'string' ? claims.sub : null;

  if (claimsError || !userId) {
    throw new Error('Invalid session');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('name, "isAdmin", "isCourer", "isManager"')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const result: AuthenticatedRequest = {
    user: {
      id: userId,
      email: typeof claims?.email === 'string' ? claims.email : null,
    },
    profile: profile
      ? {
          name: profile.name ?? null,
          isAdmin: profile.isAdmin ?? null,
          isCourer: profile.isCourer ?? null,
          isManager: profile.isManager ?? null,
        }
      : null,
  };

  authRequestCache.set(token, {
    expiresAt: Date.now() + AUTH_CACHE_TTL_MS,
    value: result,
  });

  return result;
}

export async function authenticateRequest(req: Request): Promise<AuthenticatedRequest> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    throw new Error('Missing access token');
  }

  const cachedEntry = authRequestCache.get(token);
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return cachedEntry.value;
  }

  const pendingRequest = authRequestsInFlight.get(token);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = loadAuthenticatedRequest(token).finally(() => {
    authRequestsInFlight.delete(token);
  });

  authRequestsInFlight.set(token, request);

  return request;
}
