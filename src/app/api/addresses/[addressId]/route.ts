import { NextResponse } from 'next/server';
import { authenticateRequest, createServiceSupabase } from '@/app/api/server/supabaseService';
import {
  ADDRESS_SELECT,
  mapAddressRow,
  toAddressInsert,
  type DeliveryAddressInput,
} from '@/app/api/server/addresses';

type Params = {
  params: Promise<{
    addressId: string;
  }>;
};

type UpdateAddressBody = {
  userId?: string;
  payload?: DeliveryAddressInput;
};

export async function PUT(req: Request, context: Params) {
  try {
    const { user } = await authenticateRequest(req);
    const { addressId } = await context.params;
    const body = (await req.json()) as UpdateAddressBody;
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
      .update(toAddressInsert(user.id, payload))
      .eq('id', addressId)
      .eq('user_id', user.id)
      .select(ADDRESS_SELECT)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      address: data ? mapAddressRow(data as any) : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update address';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: Request, context: Params) {
  try {
    const { user } = await authenticateRequest(req);
    const { addressId } = await context.params;
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId')?.trim() || user.id;

    if (requestedUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createServiceSupabase();
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete address';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
