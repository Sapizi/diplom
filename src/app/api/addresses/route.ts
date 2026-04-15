import { NextResponse } from 'next/server';
import { authenticateRequest, createServiceSupabase } from '@/app/api/server/supabaseService';
import {
  ADDRESS_SELECT,
  mapAddressRow,
  toAddressInsert,
  type DeliveryAddressInput,
} from '@/app/api/server/addresses';

type CreateAddressBody = {
  userId?: string;
  payload?: DeliveryAddressInput;
};

export async function GET(req: Request) {
  try {
    const { user } = await authenticateRequest(req);
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId')?.trim() || user.id;

    if (requestedUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createServiceSupabase();
    const view = searchParams.get('view');

    if (view === 'count') {
      const { count, error } = await supabase
        .from('addresses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ count: count ?? 0 });
    }

    const { data, error } = await supabase
      .from('addresses')
      .select(ADDRESS_SELECT)
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      addresses: (data ?? []).map((row) => mapAddressRow(row as any)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load addresses';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await authenticateRequest(req);
    const body = (await req.json()) as CreateAddressBody;
    const requestedUserId = body.userId?.trim() || user.id;
    const payload = body.payload;

    if (!payload) {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }

    if (requestedUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from('addresses')
      .insert(toAddressInsert(user.id, payload))
      .select(ADDRESS_SELECT)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      address: data ? mapAddressRow(data as any) : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create address';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
