import { NextResponse } from 'next/server';
import { authenticateRequest, createServiceSupabase } from '@/app/api/server/supabaseService';

export async function POST(req: Request) {
  try {
    const { profile, user } = await authenticateRequest(req);

    if (!profile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = (await req.json()) as { userId?: string };

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (userId === user.id) {
      return NextResponse.json({ error: 'Нельзя удалить собственный аккаунт администратора' }, { status: 400 });
    }

    const supabase = createServiceSupabase();

    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Delete user failed';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
