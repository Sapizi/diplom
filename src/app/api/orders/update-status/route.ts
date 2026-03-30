import { NextResponse } from 'next/server';
import { authenticateRequest, createServiceSupabase } from '@/app/api/server/supabaseService';
import { sendOrderReadyPush } from '@/app/api/server/pushNotifications';

type UpdateOrderStatusBody = {
  orderId?: string;
  status?: string;
};

export async function POST(req: Request) {
  try {
    const { profile } = await authenticateRequest(req);

    if (!profile?.isAdmin && !profile?.isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await req.json()) as UpdateOrderStatusBody;
    const orderId = body.orderId?.trim();
    const status = body.status?.trim();

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const { data: currentOrder, error: currentOrderError } = await supabase
      .from('orders')
      .select('id, user_id, status')
      .eq('id', orderId)
      .maybeSingle();

    if (currentOrderError || !currentOrder) {
      return NextResponse.json({ error: currentOrderError?.message ?? 'Order not found' }, { status: 404 });
    }

    const previousStatus = currentOrder.status ? String(currentOrder.status) : null;

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select('id, status')
      .maybeSingle();

    if (updateError || !updatedOrder) {
      return NextResponse.json(
        { error: updateError?.message ?? 'Failed to update order status' },
        { status: 500 }
      );
    }

    if (status === 'ready' && previousStatus !== 'ready' && currentOrder.user_id) {
      await sendOrderReadyPush(String(currentOrder.user_id), {
        title: 'Заказ готов',
        body: `Заказ #${orderId.slice(0, 8)} уже можно забрать.`,
        url: '/user/orders',
      });
    }

    return NextResponse.json({ order: updatedOrder });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to update order status';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
