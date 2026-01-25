import { supabase } from '../../../../lib/supabase';

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
  user_id?: string;
  status?: string;
  items: OrderItemType[];
};

const ORDER_VISIBLE_STATUSES = ['paid', 'accepted', 'in_progress', 'ready'];

export async function fetchOrdersByUser(userId: string) {
  return supabase
    .from('orders')
    .select('id, created_at, status')
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
    .select('id, user_id, created_at')
    .order('created_at', { ascending: false });
}

export async function fetchOrdersWithItemsByUser(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      created_at,
      status,
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
    `
    )
    .eq('user_id', userId)
    .in('status', ORDER_VISIBLE_STATUSES)
    .order('created_at', { ascending: false });

  return {
    data: (data || []).map((order: any) => ({
      id: String(order.id),
      created_at: String(order.created_at),
      status: order.status ? String(order.status) : undefined,
      items: (order.order_items || []).map((item: any) => ({
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
      })),
    })),
    error,
  };
}

export async function fetchAllOrdersWithItems() {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      user_id,
      created_at,
      status,
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
    `
    )
    .order('created_at', { ascending: false });

  return {
    data: (data || []).map((order: any) => ({
      id: String(order.id),
      user_id: String(order.user_id),
      created_at: String(order.created_at),
      status: order.status ? String(order.status) : undefined,
      items: (order.order_items || []).map((item: any) => ({
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
      })),
    })),
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
  const result = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select('id, status')
    .maybeSingle();

  if (!result.error && !result.data) {
    return {
      data: null,
      error: new Error('Order update blocked (RLS) or not found'),
    };
  }

  return result;
}
