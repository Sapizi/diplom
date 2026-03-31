import { NextResponse } from 'next/server';
import { authenticateRequest, createServiceSupabase } from '@/app/api/server/supabaseService';

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function toNumber(value: unknown) {
  if (value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function getWorkedMinutes(shifts: Array<{ start_time: string; end_time: string }>) {
  return shifts.reduce((total, shift) => {
    const [startHour, startMinute] = String(shift.start_time).slice(0, 5).split(':').map(Number);
    const [endHour, endMinute] = String(shift.end_time).slice(0, 5).split(':').map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    return total + Math.max(0, end - start);
  }, 0);
}

async function loadCustomersMap(supabase: ReturnType<typeof createServiceSupabase>, userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  const customersMap = new Map<string, { name: string | null; phone: string | null }>();

  if (!uniqueIds.length) {
    return customersMap;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, phone')
    .in('id', uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  (data ?? []).forEach((customer) => {
    customersMap.set(String(customer.id), {
      name: customer.name ? String(customer.name) : null,
      phone: customer.phone ? String(customer.phone) : null,
    });
  });

  return customersMap;
}

export async function GET(req: Request, context: { params: Promise<{ employeeId: string }> }) {
  try {
    const { profile } = await authenticateRequest(req);

    if (!profile?.isManager && !profile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { employeeId: rawEmployeeId } = await context.params;
    const employeeId = rawEmployeeId?.trim();

    if (!employeeId) {
      return NextResponse.json({ error: 'Missing employeeId' }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const { startDate, endDate } = getMonthRange();

    const [
      { data: employee, error: employeeError },
      { count: deliveredTotal, error: deliveredTotalError },
      { count: deliveredThisMonth, error: deliveredMonthError },
      { data: monthShifts, error: shiftsError },
      { data: recentOrders, error: recentOrdersError },
      { data: reviews, error: reviewsError },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, name, email, phone, avatar_url, "isOpen", created_at, "isCourer"')
        .eq('id', employeeId)
        .eq('isCourer', true)
        .maybeSingle(),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('courier_id', employeeId)
        .eq('courier_status', 'delivered'),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('courier_id', employeeId)
        .eq('courier_status', 'delivered')
        .gte('delivered_at', `${startDate}T00:00:00`)
        .lte('delivered_at', `${endDate}T23:59:59`),
      supabase
        .from('employee_shifts')
        .select('start_time, end_time')
        .eq('employee_id', employeeId)
        .gte('shift_date', startDate)
        .lte('shift_date', endDate),
      supabase
        .from('orders')
        .select('id, user_id, created_at, delivered_at, total_amount, delivery_street, delivery_house')
        .eq('courier_id', employeeId)
        .eq('courier_status', 'delivered')
        .order('delivered_at', { ascending: false })
        .limit(12),
      supabase
        .from('order_reviews')
        .select('order_id, rating, comment, orders!inner(courier_id, courier_status)')
        .eq('orders.courier_id', employeeId)
        .eq('orders.courier_status', 'delivered'),
    ]);

    if (employeeError || !employee) {
      return NextResponse.json({ error: employeeError?.message ?? 'Employee not found' }, { status: 404 });
    }

    if (deliveredTotalError || deliveredMonthError || shiftsError || recentOrdersError) {
      return NextResponse.json(
        {
          error:
            deliveredTotalError?.message ??
            deliveredMonthError?.message ??
            shiftsError?.message ??
            recentOrdersError?.message ??
            'Failed to load employee profile',
        },
        { status: 500 }
      );
    }

    const reviewEntries = reviewsError ? [] : ((reviews ?? []) as Array<{ order_id: string; rating: number; comment: string | null }>);
    const reviewMap = new Map(
      reviewEntries.map((review) => [
        String(review.order_id),
        {
          rating: Number(review.rating),
          comment: review.comment ? String(review.comment) : null,
        },
      ])
    );

    const customersMap = await loadCustomersMap(
      supabase,
      (recentOrders ?? []).map((order) => (order.user_id ? String(order.user_id) : ''))
    );

    const averageRating =
      reviewEntries.length > 0
        ? reviewEntries.reduce((sum, review) => sum + Number(review.rating), 0) / reviewEntries.length
        : null;

    return NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        avatar_url: employee.avatar_url,
        isOpen: employee.isOpen,
        created_at: employee.created_at,
      },
      stats: {
        deliveredTotal: deliveredTotal ?? 0,
        deliveredThisMonth: deliveredThisMonth ?? 0,
        workedMinutesThisMonth: getWorkedMinutes((monthShifts ?? []) as Array<{ start_time: string; end_time: string }>),
        averageRating: averageRating == null ? null : Number(averageRating.toFixed(1)),
        ratingsCount: reviewEntries.length,
      },
      recentOrders: (recentOrders ?? []).map((order) => {
        const customer = order.user_id ? customersMap.get(String(order.user_id)) : null;
        const review = reviewMap.get(String(order.id));

        return {
          id: String(order.id),
          created_at: String(order.created_at),
          delivered_at: order.delivered_at ? String(order.delivered_at) : null,
          total_amount: toNumber(order.total_amount),
          street: order.delivery_street ? String(order.delivery_street) : null,
          house: order.delivery_house ? String(order.delivery_house) : null,
          customer_name: customer?.name ?? null,
          customer_phone: customer?.phone ?? null,
          rating: review?.rating ?? null,
          review_comment: review?.comment ?? null,
        };
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load employee profile';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
