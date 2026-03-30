import { supabase } from '../../../../lib/supabase';
import { getSession } from './auth';

export type OrderDeliveryAddress = {
  id: string | null;
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

export type OrderItemType = {
  id: string;
  quantity?: number;
  price_at_time?: number | null;
  menu_items: {
    id: string;
    name: string;
    price: number;
  } | null;
};

export type OrderType = {
  id: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  status?: string;
  type?: string;
  total_amount?: number | null;
  delivery_started_at?: string | null;
  delivered_at?: string | null;
  courier_status?: string | null;
  delivery_address?: OrderDeliveryAddress | null;
  items: OrderItemType[];
};

const ORDER_VISIBLE_STATUSES = ['paid', 'accepted', 'in_progress', 'ready'];

function mapOrderDeliveryAddress(order: any): OrderDeliveryAddress | null {
  if (order.type !== 'delivery') {
    return null;
  }

  return {
    id: order.delivery_address_id ? String(order.delivery_address_id) : null,
    city: order.delivery_city ? String(order.delivery_city) : null,
    street: order.delivery_street ? String(order.delivery_street) : null,
    house: order.delivery_house ? String(order.delivery_house) : null,
    entrance: order.delivery_entrance ? String(order.delivery_entrance) : null,
    apartment: order.delivery_apartment ? String(order.delivery_apartment) : null,
    floor: order.delivery_floor ? String(order.delivery_floor) : null,
    comment: order.delivery_comment ? String(order.delivery_comment) : null,
    latitude: order.delivery_latitude != null ? Number(order.delivery_latitude) : null,
    longitude: order.delivery_longitude != null ? Number(order.delivery_longitude) : null,
  };
}

function mapOrderItems(order: any): OrderItemType[] {
  return (order.order_items || []).map((item: any) => ({
    id: String(item.id),
    quantity: item.quantity != null ? Number(item.quantity) : undefined,
    price_at_time: item.price_at_time != null ? Number(item.price_at_time) : null,
    menu_items: item.menu_items
      ? {
          id: String(item.menu_items.id),
          name: String(item.menu_items.name),
          price: Number(item.menu_items.price),
        }
      : null,
  }));
}

function mapOrder(order: any): OrderType {
  return {
    id: String(order.id),
    created_at: String(order.created_at),
    updated_at: order.updated_at ? String(order.updated_at) : undefined,
    user_id: order.user_id ? String(order.user_id) : undefined,
    status: order.status ? String(order.status) : undefined,
    type: order.type ? String(order.type) : undefined,
    total_amount: order.total_amount != null ? Number(order.total_amount) : null,
    delivery_started_at: order.delivery_started_at ? String(order.delivery_started_at) : null,
    delivered_at: order.delivered_at ? String(order.delivered_at) : null,
    courier_status: order.courier_status ? String(order.courier_status) : null,
    delivery_address: mapOrderDeliveryAddress(order),
    items: mapOrderItems(order),
  };
}

const ORDERS_SELECT = `
  id,
  user_id,
  created_at,
  updated_at,
  status,
  type,
  total_amount,
  courier_status,
  delivery_started_at,
  delivered_at,
  delivery_address_id,
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
      id,
      name,
      price
    )
  )
`;

export async function fetchOrdersByUser(userId: string) {
  return supabase
    .from('orders')
    .select('id, created_at, status, type')
    .eq('user_id', userId)
    .in('status', ORDER_VISIBLE_STATUSES)
    .order('created_at', { ascending: false });
}

export async function fetchOrderItems(orderId: string) {
  return supabase
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
    .eq('order_id', orderId);
}

export async function fetchAllOrders() {
  return supabase
    .from('orders')
    .select('id, user_id, created_at, updated_at, type, status, total_amount')
    .order('created_at', { ascending: false });
}

export async function fetchOrdersWithItemsByUser(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDERS_SELECT)
    .eq('user_id', userId)
    .in('status', ORDER_VISIBLE_STATUSES)
    .order('created_at', { ascending: false });

  return {
    data: (data || []).map((order: any) => mapOrder(order)),
    error,
  };
}

export async function fetchAllOrdersWithItems() {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDERS_SELECT)
    .order('created_at', { ascending: false });

  return {
    data: (data || []).map((order: any) => mapOrder(order)),
    error,
  };
}

export async function fetchOrdersCountByUser(userId: string) {
  return supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ORDER_VISIBLE_STATUSES);
}

export async function updateOrderStatus(orderId: string, status: string) {
  const {
    data: { session },
  } = await getSession();

  if (!session?.access_token) {
    return {
      data: null,
      error: new Error('Missing session'),
    };
  }

  const res = await fetch('/api/orders/update-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ orderId, status }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error(data?.error ?? 'order_update_failed') };
  }

  return { data: data?.order ?? null, error: null };
}
