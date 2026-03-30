import { NextResponse } from 'next/server';
import { authenticateRequest, createServiceSupabase } from '@/app/api/server/supabaseService';

type PushSubscriptionBody = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function POST(req: Request) {
  try {
    const { user, profile } = await authenticateRequest(req);

    if (profile?.isAdmin || profile?.isCourer || profile?.isManager) {
      return NextResponse.json({ error: 'Only customer accounts can subscribe' }, { status: 403 });
    }

    const body = (await req.json()) as PushSubscriptionBody;
    const endpoint = body.endpoint?.trim();
    const p256dh = body.keys?.p256dh?.trim();
    const auth = body.keys?.auth?.trim();

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
        expiration_time: body.expirationTime ?? null,
        user_agent: req.headers.get('user-agent') ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to save subscription';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    const { user } = await authenticateRequest(req);
    const body = (await req.json()) as { endpoint?: string };
    const endpoint = body.endpoint?.trim();

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to delete subscription';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
