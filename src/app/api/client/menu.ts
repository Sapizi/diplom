import { supabase } from '../../../../lib/supabase';
import { requestJson } from './http';

export type MenuItemType = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category_id: string;
  calories?: number | null;
  is_available?: boolean | null;
};

export async function fetchMenuItems(sort: 'asc' | 'desc' | '' = '') {
  const params = new URLSearchParams();

  if (sort) {
    params.set('sort', sort);
  }

  const query = params.toString();
  const { data, error } = await requestJson<{ items: MenuItemType[] }>(
    query ? `/api/menu?${query}` : '/api/menu',
    {
      fallbackError: 'menu_failed',
    }
  );

  return {
    data: data?.items ?? [],
    error,
  };
}

export async function fetchAdminMenuItems() {
  const { data, error } = await requestJson<{ items: MenuItemType[] }>('/api/admin/menu-items', {
    auth: true,
    fallbackError: 'admin_menu_failed',
  });

  return {
    data: data?.items ?? [],
    error,
  };
}

export async function createMenuItem(payload: {
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string | null;
  calories?: number | null;
  is_available?: boolean;
}) {
  const { data, error } = await requestJson('/api/admin/menu-items/create', {
    method: 'POST',
    auth: true,
    fallbackError: 'create_failed',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload }),
  });

  return { data, error };
}

export async function updateMenuItem(
  id: string,
  payload: {
    name: string;
    description: string;
    price: number;
    category_id: string;
    image_url: string | null;
    calories?: number | null;
    is_available?: boolean;
  }
) {
  const { data, error } = await requestJson('/api/admin/menu-items/update', {
    method: 'POST',
    auth: true,
    fallbackError: 'update_failed',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, payload }),
  });

  return { data, error };
}

export async function deleteMenuItem(id: string) {
  const { data, error } = await requestJson('/api/admin/menu-items/delete', {
    method: 'POST',
    auth: true,
    fallbackError: 'delete_failed',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  return { data, error };
}

export async function uploadMenuImage(fileName: string, file: File) {
  return supabase.storage.from('menu-images').upload(fileName, file);
}

export function getMenuImagePublicUrl(fileName: string) {
  return supabase.storage.from('menu-images').getPublicUrl(fileName);
}
