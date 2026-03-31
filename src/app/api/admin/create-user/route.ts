import { NextResponse } from 'next/server';
import { authenticateRequest, createServiceSupabase } from '@/app/api/server/supabaseService';

type CreateUserRequest = {
  name?: string;
  email?: string;
  password?: string;
  phone?: string | null;
  role?: 'user' | 'manager' | 'courier';
};

export async function POST(req: Request) {
  try {
    const { profile } = await authenticateRequest(req);

    if (!profile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await req.json()) as CreateUserRequest;
    const name = body.name?.trim() || '';
    const email = body.email?.trim().toLowerCase() || '';
    const password = body.password || '';
    const phone = body.phone?.trim() || null;
    const role = body.role || 'user';

    if (!name || !email || password.length < 6) {
      return NextResponse.json({ error: 'Нужно указать имя, email и пароль не короче 6 символов' }, { status: 400 });
    }

    if (!['user', 'manager', 'courier'].includes(role)) {
      return NextResponse.json({ error: 'Некорректная роль' }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        phone,
      },
    });

    if (createError || !createdUser.user) {
      return NextResponse.json({ error: createError?.message ?? 'Не удалось создать пользователя' }, { status: 500 });
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: createdUser.user.id,
      name,
      email,
      phone,
      bonus_points: 0,
      avatar_url: null,
      isAdmin: false,
      isManager: role === 'manager',
      isCourer: role === 'courier',
      isOpen: false,
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(createdUser.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: createdUser.user.id,
        email,
        role,
      },
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Create user failed';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
