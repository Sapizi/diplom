import { requestJson } from './http';

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
  const { data, error } = await fetchAdminOverview();

  if (error || !data) {
    return { users: 0, menu: 0, orders: 0 };
  }

  return {
    users: data.users,
    menu: data.menu,
    orders: data.orders,
  };
}

export async function fetchAdminOverview() {
  const { data, error } = await requestJson<AdminOverviewStats>('/api/admin/overview', {
    auth: true,
    fallbackError: 'admin_overview_failed',
  });

  if (error || !data) {
    return { data: null, error };
  }

  return {
    data: {
      users: Number(data.users ?? 0),
      employees: Number(data.employees ?? 0),
      managers: Number(data.managers ?? 0),
      couriers: Number(data.couriers ?? 0),
      menu: Number(data.menu ?? 0),
      orders: Number(data.orders ?? 0),
      todayOrders: Number(data.todayOrders ?? 0),
      todayAverageRating: data.todayAverageRating == null ? null : Number(data.todayAverageRating),
      todayReviewsCount: Number(data.todayReviewsCount ?? 0),
      onShiftEmployees: Number(data.onShiftEmployees ?? 0),
    } satisfies AdminOverviewStats,
    error: null,
  };
}
