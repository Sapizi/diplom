import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type AuthClaims = {
  sub?: string;
  email?: string;
};

function createServiceSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role key');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
    }

    const supabase = createServiceSupabase();
    const {
      data,
      error: claimsError,
    } = await supabase.auth.getClaims(token);

    const claims = data?.claims as AuthClaims | undefined;
    const userId = typeof claims?.sub === 'string' ? claims.sub : null;

    if (claimsError || !userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, "isAdmin", "isCourer", "isManager", avatar_url, "isOpen"')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: userId,
        email: typeof claims?.email === 'string' ? claims.email : '',
      },
      profile,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load profile role' }, { status: 500 });
  }
}
