import { NextResponse } from 'next/server';
import { authenticateRequest, createServiceSupabase } from '@/app/api/server/supabaseService';

export async function GET(req: Request) {
  try {
    const { profile } = await authenticateRequest(req);

    if (!profile?.isManager && !profile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, phone, avatar_url, "isOpen", "isCourer"')
      .eq('isCourer', true)
      .order('name', { ascending: true, nullsFirst: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ employees: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load employees';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
