import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/api/server/supabaseService';
import { updateCourierOrderState } from '@/app/api/server/courierWorkspace';

type Params = {
  params: Promise<{
    orderId: string;
  }>;
};

type Body = {
  action?: string;
};

export async function POST(req: Request, context: Params) {
  try {
    const { user, profile } = await authenticateRequest(req);

    if (!profile?.isCourer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await req.json()) as Body;
    const action = body.action?.trim();
    const { orderId } = await context.params;

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    const order = await updateCourierOrderState(user.id, orderId, action);
    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update courier order';
    const status =
      message === 'Missing access token' || message === 'Invalid session'
        ? 401
        : message.includes('cannot') || message.includes('unavailable') || message.includes('Unknown')
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
