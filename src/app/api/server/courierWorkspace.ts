import { createServiceSupabase } from './supabaseService';

export type CourierCoworker = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  isOpen: boolean | null;
  start_time: string;
  end_time: string;
  isCurrentCourier: boolean;
};

export type CourierOrderItem = {
  id: string;
  quantity: number;
  price_at_time: number | null;
  menu_item_name: string;
};

export type CourierOrder = {
  id: string;
  created_at: string;
  updated_at: string | null;
  status: string | null;
  total_amount: number | null;
  courier_id: string | null;
  courier_status: string | null;
  courier_assigned_at: string | null;
  delivery_started_at: string | null;
  delivered_at: string | null;
  estimated_delivery_at: string | null;
  is_paid: boolean;
  customer: {
    id: string | null;
    name: string | null;
    phone: string | null;
  };
  address: {
    city: string | null;
    street: string | null;
    house: string | null;
    entrance: string | null;
    apartment: string | null;
    floor: string | null;
    comment: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  items: CourierOrderItem[];
};

function toNumber(value: unknown) {
  if (value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getLocalDateValue(date = new Date()) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 10);
}

function mapCourierOrder(order: any, customer?: { id: string; name: string | null; phone: string | null } | null): CourierOrder {
  const payments = Array.isArray(order.payments) ? order.payments : [];
  const isPaid = payments.some((payment: any) => Boolean(payment?.paid) || payment?.status === 'succeeded');

  return {
    id: String(order.id),
    created_at: String(order.created_at),
    updated_at: order.updated_at ? String(order.updated_at) : null,
    status: order.status ? String(order.status) : null,
    total_amount: toNumber(order.total_amount),
    courier_id: order.courier_id ? String(order.courier_id) : null,
    courier_status: order.courier_status ? String(order.courier_status) : null,
    courier_assigned_at: order.courier_assigned_at ? String(order.courier_assigned_at) : null,
    delivery_started_at: order.delivery_started_at ? String(order.delivery_started_at) : null,
    delivered_at: order.delivered_at ? String(order.delivered_at) : null,
    estimated_delivery_at: order.estimated_delivery_at ? String(order.estimated_delivery_at) : null,
    is_paid: isPaid,
    customer: {
      id: customer?.id ?? (order.user_id ? String(order.user_id) : null),
      name: customer?.name ?? null,
      phone: customer?.phone ?? null,
    },
    address: {
      city: order.delivery_city ? String(order.delivery_city) : null,
      street: order.delivery_street ? String(order.delivery_street) : null,
      house: order.delivery_house ? String(order.delivery_house) : null,
      entrance: order.delivery_entrance ? String(order.delivery_entrance) : null,
      apartment: order.delivery_apartment ? String(order.delivery_apartment) : null,
      floor: order.delivery_floor ? String(order.delivery_floor) : null,
      comment: order.delivery_comment ? String(order.delivery_comment) : null,
      latitude: toNumber(order.delivery_latitude),
      longitude: toNumber(order.delivery_longitude),
    },
    items: (order.order_items ?? []).map((item: any) => ({
      id: String(item.id),
      quantity: Number(item.quantity ?? 1),
      price_at_time: toNumber(item.price_at_time),
      menu_item_name: item.menu_items?.name ? String(item.menu_items.name) : 'Позиция',
    })),
  };
}

async function loadCustomersMap(supabase: ReturnType<typeof createServiceSupabase>, orders: any[]) {
  const userIds = Array.from(
    new Set(
      orders
        .map((order) => (order?.user_id ? String(order.user_id) : ''))
        .filter(Boolean)
    )
  );

  const customersMap = new Map<string, { id: string; name: string | null; phone: string | null }>();

  if (userIds.length === 0) {
    return customersMap;
  }

  const { data: customers, error } = await supabase
    .from('profiles')
    .select('id, name, phone')
    .in('id', userIds);

  if (error) {
    throw new Error(error.message);
  }

  (customers ?? []).forEach((customer) => {
    customersMap.set(String(customer.id), {
      id: String(customer.id),
      name: customer.name ? String(customer.name) : null,
      phone: customer.phone ? String(customer.phone) : null,
    });
  });

  return customersMap;
}

export async function fetchCourierWorkspace(userId: string) {
  const supabase = createServiceSupabase();
  const today = getLocalDateValue();

  const { data: shifts, error: shiftsError } = await supabase
    .from('employee_shifts')
    .select('employee_id, start_time, end_time')
    .eq('shift_date', today)
    .order('start_time', { ascending: true });

  if (shiftsError) {
    throw new Error(shiftsError.message);
  }

  const employeeIds = Array.from(new Set((shifts ?? []).map((shift) => String(shift.employee_id))));
  const employeesMap = new Map<string, any>();

  if (employeeIds.length > 0) {
    const { data: employees, error: employeesError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, "isOpen"')
      .in('id', employeeIds);

    if (employeesError) {
      throw new Error(employeesError.message);
    }

    (employees ?? []).forEach((employee) => {
      employeesMap.set(String(employee.id), employee);
    });
  }

  const coworkers: CourierCoworker[] = (shifts ?? [])
    .map((shift) => {
      const employee = employeesMap.get(String(shift.employee_id));

      return {
        id: String(shift.employee_id),
        name: employee?.name ? String(employee.name) : null,
        avatar_url: employee?.avatar_url ? String(employee.avatar_url) : null,
        isOpen: employee?.isOpen ?? null,
        start_time: String(shift.start_time),
        end_time: String(shift.end_time),
        isCurrentCourier: String(shift.employee_id) === userId,
      };
    })
    .filter((employee) => employee.isOpen || employee.isCurrentCourier);

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(
      `
        id,
        user_id,
        created_at,
        updated_at,
        status,
        total_amount,
        courier_id,
        courier_status,
        courier_assigned_at,
        delivery_started_at,
        delivered_at,
        estimated_delivery_at,
        delivery_city,
        delivery_street,
        delivery_house,
        delivery_entrance,
        delivery_apartment,
        delivery_floor,
        delivery_comment,
        delivery_latitude,
        delivery_longitude,
        order_items (
          id,
          quantity,
          price_at_time,
          menu_items (
            name
          )
        ),
        payments (
          id,
          status,
          paid
        )
      `
    )
    .eq('type', 'delivery')
    .neq('status', 'canceled')
    .order('created_at', { ascending: false })
    .limit(50);

  if (ordersError) {
    throw new Error(ordersError.message);
  }

  const customersMap = await loadCustomersMap(supabase, orders ?? []);

  const visibleOrders = (orders ?? [])
    .map((order) => mapCourierOrder(order, order.user_id ? customersMap.get(String(order.user_id)) ?? null : null))
    .filter((order) => {
      const belongsToCourier =
        order.courier_id === userId &&
        order.courier_status !== 'delivered' &&
        order.courier_status !== 'cancelled' &&
        order.status !== 'delivered';

      const availableToTake = !order.courier_id && order.status === 'ready';

      return belongsToCourier || availableToTake;
    })
    .sort((left, right) => {
      const leftPriority = left.courier_id === userId ? 0 : 1;
      const rightPriority = right.courier_id === userId ? 0 : 1;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return +new Date(right.created_at) - +new Date(left.created_at);
    });

  return {
    coworkers,
    orders: visibleOrders,
  };
}

export async function fetchCourierOrder(userId: string, orderId: string) {
  const supabase = createServiceSupabase();
  const { data: order, error } = await supabase
    .from('orders')
    .select(
      `
        id,
        user_id,
        created_at,
        updated_at,
        status,
        total_amount,
        courier_id,
        courier_status,
        courier_assigned_at,
        delivery_started_at,
        delivered_at,
        estimated_delivery_at,
        delivery_city,
        delivery_street,
        delivery_house,
        delivery_entrance,
        delivery_apartment,
        delivery_floor,
        delivery_comment,
        delivery_latitude,
        delivery_longitude,
        order_items (
          id,
          quantity,
          price_at_time,
          menu_items (
            name
          )
        ),
        payments (
          id,
          status,
          paid
        )
      `
    )
    .eq('id', orderId)
    .maybeSingle();

  if (error || !order) {
    throw new Error(error?.message ?? 'Order not found');
  }

  const customersMap = await loadCustomersMap(supabase, [order]);
  const mappedOrder = mapCourierOrder(order, order.user_id ? customersMap.get(String(order.user_id)) ?? null : null);
  const hasAccess =
    mappedOrder.courier_id === userId || (!mappedOrder.courier_id && mappedOrder.status === 'ready');

  if (!hasAccess) {
    throw new Error('Courier has no access to this order');
  }

  return mappedOrder;
}

export async function updateCourierOrderState(userId: string, orderId: string, action: string) {
  const supabase = createServiceSupabase();
  const order = await fetchCourierOrder(userId, orderId);
  const now = new Date().toISOString();

  if (action === 'claim') {
    if (order.courier_id || order.status !== 'ready') {
      throw new Error('Order is unavailable for claim');
    }

    const { count, error: countError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('courier_id', userId)
      .neq('status', 'delivered')
      .not('courier_status', 'in', '("delivered","cancelled")');

    if (countError) {
      throw new Error(countError.message);
    }

    if ((count ?? 0) >= 3) {
      throw new Error('Courier already has 3 active orders');
    }

    const { error } = await supabase
      .from('orders')
      .update({
        courier_id: userId,
        courier_status: 'assigned',
        courier_assigned_at: now,
      })
      .eq('id', orderId)
      .is('courier_id', null);

    if (error) {
      throw new Error(error.message);
    }
  } else if (action === 'start') {
    if (order.courier_id !== userId || (order.courier_status && order.courier_status !== 'assigned')) {
      throw new Error('Order cannot be started');
    }

    const { error } = await supabase
      .from('orders')
      .update({
        courier_status: 'on_the_way',
        delivery_started_at: now,
        customer_tracking_enabled: true,
      })
      .eq('id', orderId)
      .eq('courier_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  } else if (action === 'arrive') {
    if (order.courier_id !== userId || order.courier_status !== 'on_the_way') {
      throw new Error('Order cannot be marked as arrived');
    }

    const { error } = await supabase
      .from('orders')
      .update({
        courier_status: 'arrived',
      })
      .eq('id', orderId)
      .eq('courier_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  } else if (action === 'complete') {
    if (
      order.courier_id !== userId ||
      (order.courier_status !== 'arrived' && order.courier_status !== 'on_the_way')
    ) {
      throw new Error('Order cannot be completed');
    }

    const { error } = await supabase
      .from('orders')
      .update({
        courier_status: 'delivered',
        delivered_at: now,
        status: 'delivered',
      })
      .eq('id', orderId)
      .eq('courier_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    throw new Error('Unknown courier action');
  }

  return fetchCourierOrder(userId, orderId).catch(async () => {
    if (action === 'complete') {
      const { data: updatedOrder } = await supabase
        .from('orders')
        .select(
          'id, user_id, created_at, updated_at, status, total_amount, courier_id, courier_status, courier_assigned_at, delivery_started_at, delivered_at, estimated_delivery_at, delivery_city, delivery_street, delivery_house, delivery_entrance, delivery_apartment, delivery_floor, delivery_comment, delivery_latitude, delivery_longitude'
        )
        .eq('id', orderId)
        .maybeSingle();

      if (!updatedOrder) {
        return order;
      }

      const customersMap = await loadCustomersMap(supabase, [updatedOrder]);
      return mapCourierOrder(
        { ...updatedOrder, order_items: [], payments: [] },
        updatedOrder.user_id ? customersMap.get(String(updatedOrder.user_id)) ?? null : null
      );
    }

    throw new Error('Failed to refresh courier order');
  });
}

export async function fetchCourierHistory(userId: string, shiftDate: string) {
  const supabase = createServiceSupabase();
  const dateStart = `${shiftDate}T00:00:00`;
  const dateEnd = `${shiftDate}T23:59:59`;

  const [{ data: orders, error: ordersError }, { data: shifts, error: shiftsError }] = await Promise.all([
    supabase
      .from('orders')
      .select(
        `
          id,
          created_at,
          delivered_at,
          total_amount,
          delivery_street,
          delivery_house,
          payments (
            status,
            paid
          )
        `
      )
      .eq('courier_id', userId)
      .eq('courier_status', 'delivered')
      .gte('delivered_at', dateStart)
      .lte('delivered_at', dateEnd)
      .order('delivered_at', { ascending: false }),
    supabase
      .from('employee_shifts')
      .select('start_time, end_time')
      .eq('employee_id', userId)
      .eq('shift_date', shiftDate),
  ]);

  if (ordersError) {
    throw new Error(ordersError.message);
  }

  if (shiftsError) {
    throw new Error(shiftsError.message);
  }

  const historyOrders = (orders ?? []).map((order) => ({
    id: String(order.id),
    created_at: String(order.created_at),
    delivered_at: order.delivered_at ? String(order.delivered_at) : null,
    total_amount: toNumber(order.total_amount),
    street: order.delivery_street ? String(order.delivery_street) : null,
    house: order.delivery_house ? String(order.delivery_house) : null,
    is_paid: (order.payments ?? []).some((payment: any) => Boolean(payment?.paid) || payment?.status === 'succeeded'),
  }));

  const workedMinutes = (shifts ?? []).reduce((total, shift) => {
    const [startHour, startMinute] = String(shift.start_time).slice(0, 5).split(':').map(Number);
    const [endHour, endMinute] = String(shift.end_time).slice(0, 5).split(':').map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    return total + Math.max(0, end - start);
  }, 0);

  return {
    orders: historyOrders,
    stats: {
      total: historyOrders.length,
      cash: historyOrders.filter((order) => !order.is_paid).length,
      cashless: historyOrders.filter((order) => order.is_paid).length,
      workedMinutes,
    },
  };
}
