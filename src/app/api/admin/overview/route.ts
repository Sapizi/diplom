import { NextResponse } from 'next/server';
import { authenticateRequest, createServiceSupabase } from '@/app/api/server/supabaseService';

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const { profile } = await authenticateRequest(req);

    if (!profile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createServiceSupabase();
    const { start, end } = getTodayRange();

    const [
      { count: users, error: usersError },
      { count: employees, error: employeesError },
      { count: managers, error: managersError },
      { count: couriers, error: couriersError },
      { count: onShiftEmployees, error: onShiftError },
      { count: menu, error: menuError },
      { count: orders, error: ordersError },
      { count: todayOrders, error: todayOrdersError },
      { data: todayReviews, error: todayReviewsError },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .or('isManager.eq.true,isCourer.eq.true'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('isManager', true),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('isCourer', true),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('isOpen', true)
        .or('isManager.eq.true,isCourer.eq.true'),
      supabase.from('menu_items').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
      supabase.from('order_reviews').select('rating').gte('created_at', start).lte('created_at', end),
    ]);

    const firstError =
      usersError ??
      employeesError ??
      managersError ??
      couriersError ??
      onShiftError ??
      menuError ??
      ordersError ??
      todayOrdersError ??
      todayReviewsError;

    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 500 });
    }

    const reviewRatings = (todayReviews ?? []).map((review) => Number(review.rating)).filter((rating) => !Number.isNaN(rating));
    const todayAverageRating =
      reviewRatings.length > 0
        ? Number((reviewRatings.reduce((sum, rating) => sum + rating, 0) / reviewRatings.length).toFixed(1))
        : null;

    return NextResponse.json({
      users: users ?? 0,
      employees: employees ?? 0,
      managers: managers ?? 0,
      couriers: couriers ?? 0,
      menu: menu ?? 0,
      orders: orders ?? 0,
      todayOrders: todayOrders ?? 0,
      todayAverageRating,
      todayReviewsCount: reviewRatings.length,
      onShiftEmployees: onShiftEmployees ?? 0,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Failed to load admin overview';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
