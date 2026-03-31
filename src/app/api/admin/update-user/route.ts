import { NextResponse } from 'next/server';
import { authenticateRequest, createServiceSupabase } from '@/app/api/server/supabaseService';

type UpdateUserPayload = {
  name?: string | null;
  email?: string | null;
  bonus_points?: number | null;
  avatar_url?: string | null;
  phone?: string | null;
  isAdmin?: boolean | null;
  isCourer?: boolean | null;
  isManager?: boolean | null;
};

export async function POST(req: Request) {
  try {
    const { profile } = await authenticateRequest(req);

    if (!profile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, payload } = (await req.json()) as {
      userId?: string;
      payload?: UpdateUserPayload;
    };

    if (!userId || !payload) {
      return NextResponse.json({ error: 'Missing userId or payload' }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const trimmedEmail = payload.email?.trim() || null;
    const trimmedPhone = payload.phone?.trim() || null;
    const trimmedName = payload.name?.trim() || null;

    if (trimmedEmail) {
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        email: trimmedEmail,
        user_metadata: {
          name: trimmedName,
          phone: trimmedPhone,
        },
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 500 });
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        ...(payload.name !== undefined ? { name: trimmedName } : {}),
        ...(payload.email !== undefined ? { email: trimmedEmail } : {}),
        ...(payload.bonus_points !== undefined ? { bonus_points: payload.bonus_points } : {}),
        ...(payload.avatar_url !== undefined ? { avatar_url: payload.avatar_url } : {}),
        ...(payload.phone !== undefined ? { phone: trimmedPhone } : {}),
        ...(payload.isAdmin !== undefined ? { isAdmin: payload.isAdmin } : {}),
        ...(payload.isCourer !== undefined ? { isCourer: payload.isCourer } : {}),
        ...(payload.isManager !== undefined ? { isManager: payload.isManager } : {}),
      })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Update user failed';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
