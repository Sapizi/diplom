import { NextResponse } from 'next/server';
import { authenticateRequest, createServiceSupabase } from '@/app/api/server/supabaseService';

export async function GET(req: Request) {
  try {
    const { profile } = await authenticateRequest(req);

    if (!profile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, name, email, phone, avatar_url, bonus_points, created_at, "isOpen", "isAdmin", "isCourer", "isManager"'
      )
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load users';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
