import { supabase } from '../../../../lib/supabase';

export type CategoryType = {
  id: string;
  name: string;
};

export async function fetchCategories() {
  return supabase.from('categories').select('id, name').order('name');
}

export async function createCategory(name: string) {
  const res = await fetch('/api/admin/categories/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { data: null, error: new Error(data?.error ?? 'create_failed') };
  }

  return { data, error: null };
}
