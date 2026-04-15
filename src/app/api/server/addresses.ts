type AddressRow = {
  id: string;
  user_id: string;
  city: string | null;
  street?: string | null;
  house?: string | null;
  entrance?: string | null;
  apartment?: string | null;
  floor?: string | null;
  comment?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  postal_code: string | null;
  is_default: boolean | null;
  created_at: string | null;
};

type LegacyAddressMeta = {
  street: string;
  house: string;
  entrance: string;
  apartment: string;
  floor: string;
  comment: string;
  latitude: number | null;
  longitude: number | null;
};

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

const EMPTY_META: LegacyAddressMeta = {
  street: '',
  house: '',
  entrance: '',
  apartment: '',
  floor: '',
  comment: '',
  latitude: null,
  longitude: null,
};

export function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? '';
}

export function normalizeCoordinate(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Number(value.toFixed(6))
    : null;
}

function parseLegacyMeta(postalCode: string | null): LegacyAddressMeta {
  if (!postalCode) {
    return EMPTY_META;
  }

  try {
    const parsed = JSON.parse(postalCode) as Partial<LegacyAddressMeta> | null;

    if (!parsed || typeof parsed !== 'object') {
      return EMPTY_META;
    }

    return {
      street: normalizeText(parsed.street),
      house: normalizeText(parsed.house),
      entrance: normalizeText(parsed.entrance),
      apartment: normalizeText(parsed.apartment),
      floor: normalizeText(parsed.floor),
      comment: normalizeText(parsed.comment),
      latitude: normalizeCoordinate(parsed.latitude),
      longitude: normalizeCoordinate(parsed.longitude),
    };
  } catch {
    return {
      ...EMPTY_META,
      comment: normalizeText(postalCode),
    };
  }
}

export function mapAddressRow(row: AddressRow): DeliveryAddress {
  const legacy = parseLegacyMeta(row.postal_code);

  return {
    id: row.id,
    user_id: row.user_id,
    city: normalizeText(row.city),
    street: normalizeText(row.street) || legacy.street,
    house: normalizeText(row.house) || legacy.house,
    entrance: normalizeText(row.entrance) || legacy.entrance,
    apartment: normalizeText(row.apartment) || legacy.apartment,
    floor: normalizeText(row.floor) || legacy.floor,
    comment: normalizeText(row.comment) || legacy.comment,
    latitude: normalizeCoordinate(row.latitude) ?? legacy.latitude,
    longitude: normalizeCoordinate(row.longitude) ?? legacy.longitude,
    is_default: Boolean(row.is_default),
    created_at: row.created_at,
  };
}

export function toAddressInsert(userId: string, payload: DeliveryAddressInput) {
  return {
    user_id: userId,
    city: normalizeText(payload.city),
    street: normalizeText(payload.street),
    house: normalizeText(payload.house),
    entrance: normalizeText(payload.entrance),
    apartment: normalizeText(payload.apartment),
    floor: normalizeText(payload.floor),
    comment: normalizeText(payload.comment) || null,
    latitude: normalizeCoordinate(payload.latitude),
    longitude: normalizeCoordinate(payload.longitude),
    postal_code: null,
    is_default: Boolean(payload.is_default),
  };
}

export const ADDRESS_SELECT =
  'id, user_id, city, street, house, entrance, apartment, floor, comment, latitude, longitude, postal_code, is_default, created_at';
