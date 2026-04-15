import { NextResponse } from 'next/server';
import { authenticateRequest, createServiceSupabase } from '@/app/api/server/supabaseService';
import {
  ORDER_VISIBLE_STATUSES,
  ORDERS_SELECT,
  attachReviewsToOrders,
  mapOrder,
  mapOrderItems,
} from '@/app/api/server/orders';

type OrdersScope = 'mine' | 'all';
type OrdersView = 'count' | 'summary' | 'items' | 'full';

function resolveScope(value: string | null): OrdersScope {
  return value === 'all' ? 'all' : 'mine';
}

function resolveView(value: string | null): OrdersView {
  if (value === 'count' || value === 'summary' || value === 'items' || value === 'full') {
    return value;
  }

  return 'summary';
}

export async function GET(req: Request) {
  try {
    const { user, profile } = await authenticateRequest(req);
    const { searchParams } = new URL(req.url);
    const scope = resolveScope(searchParams.get('scope'));
    const view = resolveView(searchParams.get('view'));
    const requestedUserId = searchParams.get('userId')?.trim() || user.id;
    const requestedOrderId = searchParams.get('orderId')?.trim();
    const isPrivileged = Boolean(profile?.isAdmin || profile?.isManager);

    if ((scope === 'all' || requestedUserId !== user.id) && !isPrivileged) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createServiceSupabase();

    if (view === 'count') {
      let query = supabase.from('orders').select('id', { count: 'exact', head: true });

      if (scope === 'all') {
        if (requestedUserId) {
          query = query.eq('user_id', requestedUserId);
        }
      } else {
        query = query.eq('user_id', requestedUserId).in('status', ORDER_VISIBLE_STATUSES);
      }

      const { count, error } = await query;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ count: count ?? 0 });
    }

    if (view === 'items') {
      if (!requestedOrderId) {
        return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
      }

      let ownershipQuery = supabase.from('orders').select('id, user_id').eq('id', requestedOrderId);
      if (!isPrivileged) {
        ownershipQuery = ownershipQuery.eq('user_id', user.id);
      }

      const { data: order, error: orderError } = await ownershipQuery.maybeSingle();

      if (orderError || !order) {
        return NextResponse.json({ error: orderError?.message ?? 'Order not found' }, { status: 404 });
      }

      const { data, error } = await supabase
        .from('order_items')
        .select(
          `
          id,
          quantity,
          price_at_time,
          menu_items (
            id,
            name,
            price
          )
        `
        )
        .eq('order_id', requestedOrderId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ items: mapOrderItems((data ?? []) as any[]) });
    }

    if (view === 'summary') {
      let query = supabase
        .from('orders')
        .select('id, user_id, created_at, updated_at, type, status, total_amount')
        .order('created_at', { ascending: false });

      if (scope === 'all') {
        if (requestedUserId) {
          query = query.eq('user_id', requestedUserId);
        }
      } else {
        query = query.eq('user_id', requestedUserId).in('status', ORDER_VISIBLE_STATUSES);
      }

      const { data, error } = await query;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ orders: data ?? [] });
    }

    let query = supabase
      .from('orders')
      .select(ORDERS_SELECT)
      .order('created_at', { ascending: false });

    if (scope === 'all') {
      if (requestedUserId) {
        query = query.eq('user_id', requestedUserId);
      }
    } else {
      query = query.eq('user_id', requestedUserId).in('status', ORDER_VISIBLE_STATUSES);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mappedOrders = ((data ?? []) as any[]).map((order) => mapOrder(order));
    const ordersWithReviews = await attachReviewsToOrders(supabase, mappedOrders);

    return NextResponse.json({ orders: ordersWithReviews });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load orders';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
