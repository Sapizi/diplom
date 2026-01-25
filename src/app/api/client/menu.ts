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
  return supabase.from('menu_items').insert(payload);
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
  const result = await supabase
    .from('menu_items')
    .update(payload)
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (!result.error && !result.data) {
    return {
      data: null,
      error: new Error('Menu item update blocked (RLS) or not found'),
    };
  }

  return result;
}

export async function deleteMenuItem(id: string) {
  return supabase.from('menu_items').delete().eq('id', id);
}

export async function uploadMenuImage(fileName: string, file: File) {
  return supabase.storage.from('menu-images').upload(fileName, file);
}

export function getMenuImagePublicUrl(fileName: string) {
  return supabase.storage.from('menu-images').getPublicUrl(fileName);
}
