import { supabase } from '../../../../lib/supabase';

export type CategoryType = {
  id: string;
  name: string;
};

export async function fetchCategories() {
  return supabase.from('categories').select('id, name').order('name');
}

export async function createCategory(name: string) {
  return supabase.from('categories').insert({ name });
}
