import { createServiceSupabase } from './supabaseService';

type SupabaseClient = ReturnType<typeof createServiceSupabase>;

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

export type OrderReviewType = {
  id: string;
  order_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderType = {
  id: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  status?: string;
  type?: string;
  total_amount?: number | null;
  courier_id?: string | null;
  delivery_started_at?: string | null;
  delivered_at?: string | null;
  courier_status?: string | null;
  courier_latitude?: number | null;
  courier_longitude?: number | null;
  courier_location_updated_at?: string | null;
  customer_tracking_enabled?: boolean;
  estimated_delivery_at?: string | null;
  delivery_address?: OrderDeliveryAddress | null;
  items: OrderItemType[];
  review?: OrderReviewType | null;
};

export const ORDER_VISIBLE_STATUSES = ['paid', 'accepted', 'in_progress', 'ready', 'delivered'];

export const ORDERS_SELECT = `
  id,
  user_id,
  created_at,
  updated_at,
  status,
  type,
  total_amount,
  courier_id,
  courier_status,
  courier_latitude,
  courier_longitude,
  courier_location_updated_at,
  customer_tracking_enabled,
  estimated_delivery_at,
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

export function mapOrderItems(items: any[]): OrderItemType[] {
  return (items || []).map((item: any) => ({
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

export function mapOrderReview(review: any): OrderReviewType {
  return {
    id: String(review.id),
    order_id: String(review.order_id),
    user_id: String(review.user_id),
    rating: Number(review.rating),
    comment: review.comment ? String(review.comment) : null,
    created_at: String(review.created_at),
    updated_at: String(review.updated_at),
  };
}

export function mapOrder(order: any): OrderType {
  return {
    id: String(order.id),
    created_at: String(order.created_at),
    updated_at: order.updated_at ? String(order.updated_at) : undefined,
    user_id: order.user_id ? String(order.user_id) : undefined,
    status: order.status ? String(order.status) : undefined,
    type: order.type ? String(order.type) : undefined,
    total_amount: order.total_amount != null ? Number(order.total_amount) : null,
    courier_id: order.courier_id ? String(order.courier_id) : null,
    delivery_started_at: order.delivery_started_at ? String(order.delivery_started_at) : null,
    delivered_at: order.delivered_at ? String(order.delivered_at) : null,
    courier_status: order.courier_status ? String(order.courier_status) : null,
    courier_latitude: order.courier_latitude != null ? Number(order.courier_latitude) : null,
    courier_longitude: order.courier_longitude != null ? Number(order.courier_longitude) : null,
    courier_location_updated_at: order.courier_location_updated_at
      ? String(order.courier_location_updated_at)
      : null,
    customer_tracking_enabled: Boolean(order.customer_tracking_enabled),
    estimated_delivery_at: order.estimated_delivery_at ? String(order.estimated_delivery_at) : null,
    delivery_address: mapOrderDeliveryAddress(order),
    items: mapOrderItems(order.order_items || []),
    review: null,
  };
}

function isMissingReviewTable(error: unknown) {
  return error instanceof Error && error.message.includes('order_reviews');
}

export async function attachReviewsToOrders(
  supabase: SupabaseClient,
  orders: OrderType[]
) {
  if (!orders.length) {
    return orders;
  }

  const orderIds = orders.map((order) => order.id);
  const { data, error } = await supabase
    .from('order_reviews')
    .select('id, order_id, user_id, rating, comment, created_at, updated_at')
    .in('order_id', orderIds)
    .order('updated_at', { ascending: false });

  if (error) {
    if (!isMissingReviewTable(new Error(error.message))) {
      console.warn('Order reviews load error:', error.message);
    }

    return orders;
  }

  const reviewsByOrderId = new Map(
    ((data ?? []) as any[]).map((review) => {
      const mappedReview = mapOrderReview(review);
      return [mappedReview.order_id, mappedReview] as const;
    })
  );

  return orders.map((order) => ({
    ...order,
    review: reviewsByOrderId.get(order.id) ?? null,
  }));
}
