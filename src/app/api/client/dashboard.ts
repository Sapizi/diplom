import { supabase } from '../../../../lib/supabase';
import { getSession } from './auth';

export type AdminOverviewStats = {
  users: number;
  employees: number;
  managers: number;
  couriers: number;
  menu: number;
  orders: number;
  todayOrders: number;
  todayAverageRating: number | null;
  todayReviewsCount: number;
  onShiftEmployees: number;
};

export async function fetchDashboardCounts() {
  const { count: users } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: menu } = await supabase
    .from('menu_items')
    .select('*', { count: 'exact', head: true });

  const { count: orders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  return { users: users ?? 0, menu: menu ?? 0, orders: orders ?? 0 };
}

async function getAccessToken() {
  const {
    data: { session },
  } = await getSession();

  return session?.access_token ?? '';
}

export async function fetchAdminOverview() {
  const token = await getAccessToken();

  if (!token) {
    return { data: null, error: new Error('missing_session') };
  }

  const res = await fetch('/api/admin/overview', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error(data?.error ?? 'admin_overview_failed') };
  }

  return {
    data: {
      users: Number(data?.users ?? 0),
      employees: Number(data?.employees ?? 0),
      managers: Number(data?.managers ?? 0),
      couriers: Number(data?.couriers ?? 0),
      menu: Number(data?.menu ?? 0),
      orders: Number(data?.orders ?? 0),
      todayOrders: Number(data?.todayOrders ?? 0),
      todayAverageRating:
        data?.todayAverageRating == null ? null : Number(data.todayAverageRating),
      todayReviewsCount: Number(data?.todayReviewsCount ?? 0),
      onShiftEmployees: Number(data?.onShiftEmployees ?? 0),
    } satisfies AdminOverviewStats,
    error: null,
  };
}
