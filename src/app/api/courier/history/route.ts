import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/api/server/supabaseService';
import { fetchCourierHistory, getLocalDateValue } from '@/app/api/server/courierWorkspace';

export async function GET(req: Request) {
  try {
    const { user, profile } = await authenticateRequest(req);

    if (!profile?.isCourer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const shiftDate = searchParams.get('date') || getLocalDateValue();

    const history = await fetchCourierHistory(user.id, shiftDate);
    return NextResponse.json(history);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load courier history';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
