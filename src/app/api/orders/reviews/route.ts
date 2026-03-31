import { NextResponse } from 'next/server';
import { authenticateRequest, createServiceSupabase } from '@/app/api/server/supabaseService';

type CreateReviewBody = {
  orderId?: string;
  rating?: number;
  comment?: string;
};

const REVIEWABLE_STATUSES = new Set(['ready', 'delivered']);

function normalizeIds(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isMissingReviewTable(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes('order_reviews');
}

export async function GET(req: Request) {
  try {
    const { user, profile } = await authenticateRequest(req);
    const { searchParams } = new URL(req.url);
    const orderIds = normalizeIds(searchParams.get('orderIds'));

    if (!orderIds.length) {
      return NextResponse.json({ reviews: [] });
    }

    const supabase = createServiceSupabase();
    let allowedOrderIds = orderIds;

    if (!profile?.isAdmin && !profile?.isManager) {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .in('id', orderIds);

      if (ordersError) {
        return NextResponse.json({ error: ordersError.message }, { status: 500 });
      }

      allowedOrderIds = (orders ?? []).map((order) => String(order.id));
    }

    if (!allowedOrderIds.length) {
      return NextResponse.json({ reviews: [] });
    }

    const { data: reviews, error } = await supabase
      .from('order_reviews')
      .select('id, order_id, user_id, rating, comment, created_at, updated_at')
      .in('order_id', allowedOrderIds)
      .order('updated_at', { ascending: false });

    if (error) {
      if (isMissingReviewTable(new Error(error.message))) {
        return NextResponse.json({ reviews: [] });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reviews: reviews ?? [] });
  } catch (error) {
    if (isMissingReviewTable(error)) {
      return NextResponse.json({ reviews: [] });
    }

    const message = error instanceof Error ? error.message : 'Failed to load order reviews';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const { user, profile } = await authenticateRequest(req);

    if (profile?.isAdmin || profile?.isManager) {
      return NextResponse.json({ error: 'Managers cannot create reviews' }, { status: 403 });
    }

    const body = (await req.json()) as CreateReviewBody;
    const orderId = body.orderId?.trim();
    const rating = Number(body.rating);
    const comment = body.comment?.trim() || null;

    if (!orderId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid review payload' }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, status')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message ?? 'Order not found' }, { status: 404 });
    }

    if (String(order.user_id) !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!REVIEWABLE_STATUSES.has(String(order.status ?? ''))) {
      return NextResponse.json({ error: 'Review is available only for completed orders' }, { status: 400 });
    }

    const { data: review, error } = await supabase
      .from('order_reviews')
      .upsert(
        {
          order_id: orderId,
          user_id: user.id,
          rating,
          comment,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'order_id,user_id' }
      )
      .select('id, order_id, user_id, rating, comment, created_at, updated_at')
      .maybeSingle();

    if (error || !review) {
      const message = error?.message ?? 'Failed to save review';
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save order review';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
