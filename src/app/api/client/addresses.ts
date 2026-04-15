import { requestJson } from './http';

export type DeliveryAddress = {
  id: string;
  user_id: string;
  city: string;
  street: string;
  house: string;
  entrance: string;
  apartment: string;
  floor: string;
  comment: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string | null;
};

export type DeliveryAddressInput = Omit<DeliveryAddress, 'id' | 'user_id' | 'created_at'>;

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? '';
}

export function getEmptyDeliveryAddress(): DeliveryAddressInput {
  return {
    city: '',
    street: '',
    house: '',
    entrance: '',
    apartment: '',
    floor: '',
    comment: '',
    latitude: null,
    longitude: null,
    is_default: false,
  };
}

export function formatAddressTitle(address: Pick<DeliveryAddress, 'city' | 'street' | 'house'>) {
  return [
    normalizeText(address.city),
    address.street ? `СѓР». ${address.street}` : '',
    address.house ? `Рґ. ${address.house}` : '',
  ]
    .filter(Boolean)
    .join(', ');
}

export function formatAddressDetails(
  address: Pick<DeliveryAddress, 'entrance' | 'apartment' | 'floor' | 'comment'>
) {
  const parts = [
    address.entrance ? `РїРѕРґСЉРµР·Рґ ${address.entrance}` : '',
    address.apartment ? `РєРІ. ${address.apartment}` : '',
    address.floor ? `СЌС‚Р°Р¶ ${address.floor}` : '',
  ].filter(Boolean);

  if (address.comment) {
    parts.push(address.comment);
  }

  return parts.join(', ');
}

export async function fetchAddressesCountByUser(userId: string) {
  const params = new URLSearchParams({
    view: 'count',
    userId,
  });

  const { data, error } = await requestJson<{ count: number }>(`/api/addresses?${params.toString()}`, {
    auth: true,
    fallbackError: 'addresses_count_failed',
  });

  return {
    count: data?.count ?? 0,
    error,
  };
}

export async function fetchAddressesByUser(userId: string) {
  const params = new URLSearchParams({
    userId,
  });

  const { data, error } = await requestJson<{ addresses: DeliveryAddress[] }>(
    `/api/addresses?${params.toString()}`,
    {
      auth: true,
      fallbackError: 'addresses_failed',
    }
  );

  return {
    data: data?.addresses ?? [],
    error,
  };
}

export async function createAddress(userId: string, payload: DeliveryAddressInput) {
  const { data, error } = await requestJson<{ address: DeliveryAddress | null }>('/api/addresses', {
    method: 'POST',
    auth: true,
    fallbackError: 'address_create_failed',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, payload }),
  });

  return {
    data: data?.address ?? null,
    error,
  };
}

export async function updateAddress(
  addressId: string,
  userId: string,
  payload: DeliveryAddressInput
) {
  const { data, error } = await requestJson<{ address: DeliveryAddress | null }>(
    `/api/addresses/${encodeURIComponent(addressId)}`,
    {
      method: 'PUT',
      auth: true,
      fallbackError: 'address_update_failed',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, payload }),
    }
  );

  return {
    data: data?.address ?? null,
    error,
  };
}

export async function deleteAddress(addressId: string, userId: string) {
  const params = new URLSearchParams({
    userId,
  });

  const { data, error } = await requestJson(
    `/api/addresses/${encodeURIComponent(addressId)}?${params.toString()}`,
    {
      method: 'DELETE',
      auth: true,
      fallbackError: 'address_delete_failed',
    }
  );

  return { data, error };
}

export async function setDefaultAddress(addressId: string, userId: string) {
  const { data, error } = await requestJson<{ address: DeliveryAddress | null }>(
    `/api/addresses/${encodeURIComponent(addressId)}/default`,
    {
      method: 'POST',
      auth: true,
      fallbackError: 'address_default_failed',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    }
  );

  return {
    data: data?.address ?? null,
    error,
  };
}
