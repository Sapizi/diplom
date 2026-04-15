import { NextResponse } from 'next/server';
import { authenticateRequest, createServiceSupabase } from '@/app/api/server/supabaseService';

type ProfileView = 'summary' | 'settings' | 'header' | 'role' | 'bonus' | 'is-admin';

type UpdateProfilePayload = {
  userId?: string;
  payload?: {
    name?: string | null;
    email?: string | null;
    bonus_points?: number | null;
    avatar_url?: string | null;
    phone?: string | null;
    isAdmin?: boolean | null;
    isCourer?: boolean | null;
    isManager?: boolean | null;
  };
};

const VIEW_SELECTS: Record<ProfileView, string> = {
  summary: 'name, avatar_url, bonus_points',
  settings: 'name, phone, avatar_url',
  header: 'name, "isAdmin", "isCourer", "isManager"',
  role: 'name, "isAdmin", "isCourer", "isManager", avatar_url, "isOpen"',
  bonus: 'bonus_points',
  'is-admin': 'isAdmin',
};

function resolveView(value: string | null): ProfileView {
  if (value === 'settings' || value === 'header' || value === 'role' || value === 'bonus' || value === 'is-admin') {
    return value;
  }

  return 'summary';
}

export async function GET(req: Request) {
  try {
    const { user, profile } = await authenticateRequest(req);
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId')?.trim() || user.id;
    const isSelf = requestedUserId === user.id;

    if (!isSelf && !profile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const view = resolveView(searchParams.get('view'));
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select(VIEW_SELECTS[view])
      .eq('id', requestedUserId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load profile';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const { user } = await authenticateRequest(req);
    const body = (await req.json()) as UpdateProfilePayload;
    const requestedUserId = body.userId?.trim() || user.id;
    const payload = body.payload;

    if (!payload) {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }

    if (requestedUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = {
      ...(payload.name !== undefined ? { name: payload.name?.trim() || null } : {}),
      ...(payload.email !== undefined ? { email: payload.email?.trim() || null } : {}),
      ...(payload.avatar_url !== undefined ? { avatar_url: payload.avatar_url } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone?.trim() || null } : {}),
    };

    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates }, { onConflict: 'id' })
      .select('name, phone, avatar_url, bonus_points')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
