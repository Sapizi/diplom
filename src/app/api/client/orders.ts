import { requestJson } from './http';

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

const ORDER_VISIBLE_STATUSES = ['paid', 'accepted', 'in_progress', 'ready', 'delivered'];

async function fetchOrdersRequest(params: URLSearchParams) {
  const query = params.toString();
  return requestJson<{
    orders?: OrderType[];
    items?: OrderItemType[];
    count?: number;
  }>(`/api/orders?${query}`, {
    auth: true,
    fallbackError: 'orders_failed',
  });
}

export async function fetchOrdersByUser(userId: string) {
  const params = new URLSearchParams({
    view: 'summary',
    scope: 'mine',
    userId,
  });

  const { data, error } = await fetchOrdersRequest(params);

  return {
    data:
      data?.orders?.filter((order) =>
        ORDER_VISIBLE_STATUSES.includes(String(order.status ?? ''))
      ) ?? [],
    error,
  };
}

export async function fetchOrderItems(orderId: string) {
  const params = new URLSearchParams({
    view: 'items',
    orderId,
  });

  const { data, error } = await fetchOrdersRequest(params);

  return {
    data: data?.items ?? [],
    error,
  };
}

export async function fetchAllOrders() {
  const params = new URLSearchParams({
    view: 'summary',
    scope: 'all',
  });

  const { data, error } = await fetchOrdersRequest(params);

  return {
    data: data?.orders ?? [],
    error,
  };
}

export async function fetchOrdersWithItemsByUser(
  userId: string,
  scope: 'mine' | 'all' = 'mine'
) {
  const params = new URLSearchParams({
    view: 'full',
    scope,
    userId,
  });

  const { data, error } = await fetchOrdersRequest(params);

  return {
    data: data?.orders ?? [],
    error,
  };
}

export async function fetchAllOrdersWithItems() {
  const params = new URLSearchParams({
    view: 'full',
    scope: 'all',
  });

  const { data, error } = await fetchOrdersRequest(params);

  return {
    data: data?.orders ?? [],
    error,
  };
}

export async function fetchOrdersCountByUser(userId: string) {
  const params = new URLSearchParams({
    view: 'count',
    scope: 'mine',
    userId,
  });

  const { data, error } = await fetchOrdersRequest(params);

  return {
    count: data?.count ?? 0,
    error,
  };
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { data, error } = await requestJson<{ order?: OrderType | null }>('/api/orders/update-status', {
    method: 'POST',
    auth: true,
    fallbackError: 'order_update_failed',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId, status }),
  });

  return { data: data?.order ?? null, error };
}

export async function upsertOrderReview(payload: {
  orderId: string;
  rating: number;
  comment?: string;
}) {
  const { data, error } = await requestJson<{ review?: OrderReviewType | null }>(
    '/api/orders/reviews',
    {
      method: 'POST',
      auth: true,
      fallbackError: 'order_review_upsert_failed',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  return {
    data: data?.review ?? null,
    error,
  };
}
