import { NextResponse } from 'next/server';
import { authenticateRequest, createServiceSupabase } from '@/app/api/server/supabaseService';
import { fetchCourierOrder } from '@/app/api/server/courierWorkspace';

type Params = {
  params: Promise<{
    orderId: string;
  }>;
};

type Body = {
  latitude?: number;
  longitude?: number;
};

export async function POST(req: Request, context: Params) {
  try {
    const { user, profile } = await authenticateRequest(req);

    if (!profile?.isCourer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await req.json()) as Body;
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const { orderId } = await context.params;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const order = await fetchCourierOrder(user.id, orderId);

    if (order.courier_id !== user.id || (order.courier_status !== 'on_the_way' && order.courier_status !== 'arrived')) {
      return NextResponse.json({ error: 'Order cannot accept live tracking now' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const supabase = createServiceSupabase();

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        courier_latitude: latitude,
        courier_longitude: longitude,
        courier_location_updated_at: now,
        customer_tracking_enabled: true,
      })
      .eq('id', orderId)
      .eq('courier_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { error: historyError } = await supabase
      .from('courier_location_history')
      .insert({
        order_id: orderId,
        courier_id: user.id,
        latitude,
        longitude,
        created_at: now,
      });

    if (historyError) {
      return NextResponse.json({ error: historyError.message }, { status: 500 });
    }

    const updatedOrder = await fetchCourierOrder(user.id, orderId);
    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update courier location';
    const status =
      message === 'Missing access token' || message === 'Invalid session'
        ? 401
        : message === 'Courier has no access to this order' || message === 'Order not found'
          ? 404
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
