import { NextResponse } from 'next/server';
import { authenticateRequest, createServiceSupabase } from '@/app/api/server/supabaseService';

type Body = {
  employeeId?: string;
  isOpen?: boolean;
};

export async function POST(req: Request) {
  try {
    const { profile } = await authenticateRequest(req);

    if (!profile?.isManager && !profile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await req.json()) as Body;
    const employeeId = body.employeeId?.trim();

    if (!employeeId || typeof body.isOpen !== 'boolean') {
      return NextResponse.json({ error: 'Missing employeeId or isOpen' }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .update({ isOpen: body.isOpen })
      .eq('id', employeeId)
      .eq('isCourer', true)
      .select('id, "isOpen"')
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Employee not found' }, { status: 500 });
    }

    return NextResponse.json({ employee: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update shift state';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
