import { NextResponse } from 'next/server';
import { authenticateRequest, createServiceSupabase } from '@/app/api/server/supabaseService';
import { ADDRESS_SELECT, mapAddressRow } from '@/app/api/server/addresses';

type Params = {
  params: Promise<{
    addressId: string;
  }>;
};

type Body = {
  userId?: string;
};

export async function POST(req: Request, context: Params) {
  try {
    const { user } = await authenticateRequest(req);
    const { addressId } = await context.params;
    const body = (await req.json().catch(() => ({}))) as Body;
    const requestedUserId = body.userId?.trim() || user.id;

    if (requestedUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createServiceSupabase();
    const { error: resetError } = await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);

    if (resetError) {
      return NextResponse.json({ error: resetError.message }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('addresses')
      .update({ is_default: true })
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
    const message = error instanceof Error ? error.message : 'Failed to set default address';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
