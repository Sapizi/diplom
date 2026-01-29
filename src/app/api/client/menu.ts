import { supabase } from '../../../../lib/supabase';

export type MenuItemType = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category_id?: string;
};

export async function fetchMenuItems(sort: 'asc' | 'desc' | '' = '') {
  let query = supabase.from('menu_items').select('*');
  if (sort === 'asc') query = query.order('price', { ascending: true });
  if (sort === 'desc') query = query.order('price', { ascending: false });
  return query;
}

export async function fetchAdminMenuItems() {
  return supabase
    .from('menu_items')
    .select('*')
    .order('created_at', { ascending: false });
}

export async function createMenuItem(payload: {
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string | null;
}) {
  const res = await fetch('/api/admin/menu-items/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error(data?.error ?? 'create_failed') };
  }

  return { data, error: null };
}

export async function updateMenuItem(
  id: string,
  payload: {
    name: string;
    description: string;
    price: number;
    category_id: string;
    image_url: string | null;
  }
) {
  const res = await fetch('/api/admin/menu-items/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, payload }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error(data?.error ?? 'update_failed') };
  }

  return { data, error: null };
}

export async function deleteMenuItem(id: string) {
  const res = await fetch('/api/admin/menu-items/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error(data?.error ?? 'delete_failed') };
  }

  return { data, error: null };
}

export async function uploadMenuImage(fileName: string, file: File) {
  return supabase.storage.from('menu-images').upload(fileName, file);
}

export function getMenuImagePublicUrl(fileName: string) {
  return supabase.storage.from('menu-images').getPublicUrl(fileName);
}
