import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/api/server/supabaseService';
import { fetchCourierOrder } from '@/app/api/server/courierWorkspace';

type Params = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function GET(req: Request, context: Params) {
  try {
    const { user, profile } = await authenticateRequest(req);

    if (!profile?.isCourer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { orderId } = await context.params;
    const order = await fetchCourierOrder(user.id, orderId);
    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load courier order';
    const status =
      message === 'Missing access token' || message === 'Invalid session'
        ? 401
        : message === 'Courier has no access to this order' || message === 'Order not found'
          ? 404
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
