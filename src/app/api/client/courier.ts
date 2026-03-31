import { getSession } from './auth';

export type CourierCoworker = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  isOpen: boolean | null;
  start_time: string;
  end_time: string;
  isCurrentCourier: boolean;
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
  courier_latitude: number | null;
  courier_longitude: number | null;
  courier_location_updated_at: string | null;
  customer_tracking_enabled: boolean;
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
  items: {
    id: string;
    quantity: number;
    price_at_time: number | null;
    menu_item_name: string;
  }[];
};

export type CourierHistoryEntry = {
  id: string;
  created_at: string;
  delivered_at: string | null;
  total_amount: number | null;
  street: string | null;
  house: string | null;
  is_paid: boolean;
};

async function getAccessToken() {
  const {
    data: { session },
  } = await getSession();

  return session?.access_token ?? '';
}

async function authedFetch(path: string, init?: RequestInit) {
  const token = await getAccessToken();

  if (!token) {
    return { data: null, error: new Error('missing_session') };
  }

  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error(data?.error ?? 'request_failed') };
  }

  return { data, error: null };
}

export async function fetchCourierWorkspace() {
  const res = await authedFetch('/api/courier/workspace');

  if (res.error) {
    return { data: null, error: res.error };
  }

  return {
    data: {
      coworkers: (res.data?.coworkers ?? []) as CourierCoworker[],
      orders: (res.data?.orders ?? []) as CourierOrder[],
    },
    error: null,
  };
}

export async function fetchCourierOrder(orderId: string) {
  const res = await authedFetch(`/api/courier/orders/${orderId}`);

  if (res.error) {
    return { data: null, error: res.error };
  }

  return {
    data: res.data?.order as CourierOrder,
    error: null,
  };
}

export async function updateCourierOrderAction(orderId: string, action: string) {
  const res = await authedFetch(`/api/courier/orders/${orderId}/action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action }),
  });

  if (res.error) {
    return { data: null, error: res.error };
  }

  return {
    data: res.data?.order as CourierOrder,
    error: null,
  };
}

export async function updateCourierOrderLocation(orderId: string, payload: {
  latitude: number;
  longitude: number;
}) {
  const res = await authedFetch(`/api/courier/orders/${orderId}/location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (res.error) {
    return { data: null, error: res.error };
  }

  return {
    data: res.data?.order as CourierOrder,
    error: null,
  };
}

export async function fetchCourierHistory(shiftDate: string) {
  const res = await authedFetch(`/api/courier/history?date=${encodeURIComponent(shiftDate)}`);

  if (res.error) {
    return { data: null, error: res.error };
  }

  return {
    data: {
      orders: (res.data?.orders ?? []) as CourierHistoryEntry[],
      stats: res.data?.stats as {
        total: number;
        cash: number;
        cashless: number;
        workedMinutes: number;
      },
    },
    error: null,
  };
}
