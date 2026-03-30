import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/api/server/supabaseService';
import { fetchCourierWorkspace } from '@/app/api/server/courierWorkspace';

export async function GET(req: Request) {
  try {
    const { user, profile } = await authenticateRequest(req);

    if (!profile?.isCourer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const workspace = await fetchCourierWorkspace(user.id);
    return NextResponse.json(workspace);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load courier workspace';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
