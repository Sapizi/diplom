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
  items: OrderItemType[];
};

export async function fetchOrdersByUser(userId: string) {
  return supabase
    .from('orders')
    .select('id, created_at')
    .eq('user_id', userId)
    .eq('status', 'paid')
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

export async function fetchOrdersCountByUser(userId: string) {
  return supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'paid');
}
