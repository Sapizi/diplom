import { createClient, type User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type ServerRoleProfile = {
  name: string | null;
  isAdmin: boolean | null;
  isCourer: boolean | null;
  isManager: boolean | null;
};

export function createServiceSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role key');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

export async function authenticateRequest(req: Request): Promise<{
  user: User;
  profile: ServerRoleProfile | null;
}> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    throw new Error('Missing access token');
  }

  const supabase = createServiceSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    throw new Error('Invalid session');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('name, "isAdmin", "isCourer", "isManager"')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    user,
    profile: profile
      ? {
          name: profile.name ?? null,
          isAdmin: profile.isAdmin ?? null,
          isCourer: profile.isCourer ?? null,
          isManager: profile.isManager ?? null,
        }
      : null,
  };
}
