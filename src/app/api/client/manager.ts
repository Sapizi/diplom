import { getSession } from './auth';

export type ManagerEmployee = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  isOpen: boolean | null;
};

export type ManagerEmployeeProfileOrder = {
  id: string;
  created_at: string;
  delivered_at: string | null;
  total_amount: number | null;
  street: string | null;
  house: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  rating: number | null;
  review_comment: string | null;
};

export type ManagerEmployeeProfile = {
  employee: ManagerEmployee & {
    created_at: string | null;
  };
  stats: {
    deliveredTotal: number;
    deliveredThisMonth: number;
    workedMinutesThisMonth: number;
    averageRating: number | null;
    ratingsCount: number;
  };
  recentOrders: ManagerEmployeeProfileOrder[];
};

export type ManagerShift = {
  id: string;
  employee_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  comment: string | null;
  created_at: string;
  updated_at: string;
  employee: ManagerEmployee | null;
};

async function getAccessToken() {
  const {
    data: { session },
  } = await getSession();

  return session?.access_token ?? '';
}

export async function fetchManagerEmployees() {
  const token = await getAccessToken();

  if (!token) {
    return { data: null, error: new Error('missing_session') };
  }

  const res = await fetch('/api/manager/employees', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error(data?.error ?? 'manager_employees_failed') };
  }

  return {
    data: ((data?.employees ?? []) as any[]).map((employee) => ({
      id: String(employee.id),
      name: employee.name ? String(employee.name) : null,
      email: employee.email ? String(employee.email) : null,
      phone: employee.phone ? String(employee.phone) : null,
      avatar_url: employee.avatar_url ? String(employee.avatar_url) : null,
      isOpen: employee.isOpen ?? null,
    })) as ManagerEmployee[],
    error: null,
  };
}

export async function fetchManagerEmployeeProfile(employeeId: string) {
  const token = await getAccessToken();

  if (!token) {
    return { data: null, error: new Error('missing_session') };
  }

  const res = await fetch(`/api/manager/employees/${encodeURIComponent(employeeId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error(data?.error ?? 'manager_employee_profile_failed') };
  }

  const employee = data?.employee;

  return {
    data: employee
      ? ({
          employee: {
            id: String(employee.id),
            name: employee.name ? String(employee.name) : null,
            email: employee.email ? String(employee.email) : null,
            phone: employee.phone ? String(employee.phone) : null,
            avatar_url: employee.avatar_url ? String(employee.avatar_url) : null,
            isOpen: employee.isOpen ?? null,
            created_at: employee.created_at ? String(employee.created_at) : null,
          },
          stats: {
            deliveredTotal: Number(data?.stats?.deliveredTotal ?? 0),
            deliveredThisMonth: Number(data?.stats?.deliveredThisMonth ?? 0),
            workedMinutesThisMonth: Number(data?.stats?.workedMinutesThisMonth ?? 0),
            averageRating:
              data?.stats?.averageRating == null ? null : Number(data.stats.averageRating),
            ratingsCount: Number(data?.stats?.ratingsCount ?? 0),
          },
          recentOrders: ((data?.recentOrders ?? []) as any[]).map((order) => ({
            id: String(order.id),
            created_at: String(order.created_at),
            delivered_at: order.delivered_at ? String(order.delivered_at) : null,
            total_amount: order.total_amount == null ? null : Number(order.total_amount),
            street: order.street ? String(order.street) : null,
            house: order.house ? String(order.house) : null,
            customer_name: order.customer_name ? String(order.customer_name) : null,
            customer_phone: order.customer_phone ? String(order.customer_phone) : null,
            rating: order.rating == null ? null : Number(order.rating),
            review_comment: order.review_comment ? String(order.review_comment) : null,
          })),
        } satisfies ManagerEmployeeProfile)
      : null,
    error: null,
  };
}

export async function setManagerEmployeeOpen(employeeId: string, isOpen: boolean) {
  const token = await getAccessToken();

  if (!token) {
    return { data: null, error: new Error('missing_session') };
  }

  const res = await fetch('/api/manager/employees/open-shift', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ employeeId, isOpen }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error(data?.error ?? 'manager_open_shift_failed') };
  }

  return { data: data?.employee ?? null, error: null };
}

export async function fetchManagerShifts(shiftDate: string) {
  const token = await getAccessToken();

  if (!token) {
    return { data: null, error: new Error('missing_session') };
  }

  const res = await fetch(`/api/manager/shifts?date=${encodeURIComponent(shiftDate)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error(data?.error ?? 'manager_shifts_failed') };
  }

  return {
    data: ((data?.shifts ?? []) as any[]).map((shift) => ({
      id: String(shift.id),
      employee_id: String(shift.employee_id),
      shift_date: String(shift.shift_date),
      start_time: String(shift.start_time),
      end_time: String(shift.end_time),
      comment: shift.comment ? String(shift.comment) : null,
      created_at: String(shift.created_at),
      updated_at: String(shift.updated_at),
      employee: shift.employee
        ? {
            id: String(shift.employee.id),
            name: shift.employee.name ? String(shift.employee.name) : null,
            email: shift.employee.email ? String(shift.employee.email) : null,
            phone: shift.employee.phone ? String(shift.employee.phone) : null,
            avatar_url: shift.employee.avatar_url ? String(shift.employee.avatar_url) : null,
            isOpen: shift.employee.isOpen ?? null,
          }
        : null,
    })) as ManagerShift[],
    error: null,
  };
}

export async function createManagerShift(payload: {
  employeeId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  comment?: string;
}) {
  const token = await getAccessToken();

  if (!token) {
    return { data: null, error: new Error('missing_session') };
  }

  const res = await fetch('/api/manager/shifts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error(data?.error ?? 'manager_shift_create_failed') };
  }

  return { data: data?.shifts as ManagerShift[], error: null };
}

export async function deleteManagerShift(shiftId: string) {
  const token = await getAccessToken();

  if (!token) {
    return { data: null, error: new Error('missing_session') };
  }

  const res = await fetch('/api/manager/shifts', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ shiftId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error(data?.error ?? 'manager_shift_delete_failed') };
  }

  return { data: data?.shifts as ManagerShift[], error: null };
}
