import { requestJson } from './http';

export type CategoryType = {
  id: string;
  name: string;
};

export async function fetchCategories() {
  const { data, error } = await requestJson<{ categories: CategoryType[] }>('/api/categories', {
    fallbackError: 'categories_failed',
  });

  return {
    data: data?.categories ?? [],
    error,
  };
}

export async function createCategory(name: string) {
  const { data, error } = await requestJson('/api/admin/categories/create', {
    method: 'POST',
    auth: true,
    fallbackError: 'create_failed',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  return { data, error };
}
