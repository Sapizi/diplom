import type { CourierOrder } from '@/app/api/client/courier';

export function getCourierDisplayName(profile: {
  name: string | null;
  email: string;
}) {
  const profileName = profile.name?.trim();

  if (profileName) {
    return profileName;
  }

  const emailName = profile.email.split('@')[0]?.trim();
  return emailName || 'Курьер';
}

export function formatOrderShortId(orderId: string) {
  const clean = orderId.replace(/-/g, '');

  if (clean.length < 4) {
    return clean;
  }

  return `${clean.slice(0, 3)}-${clean.slice(3, 4)}`;
}

export function formatClock(value: string | null) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatHistoryDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${value}T12:00:00`));
}

export function formatWorkedTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, '0')} ч.`;
}

export function formatRub(value: number | null) {
  if (value == null) {
    return '—';
  }

  return `${Math.round(value)} ₽`;
}

export function formatOrderAge(startedAt: string, endedAt?: string | null) {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const diffMinutes = Math.max(1, Math.round((end - start) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} мин`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (minutes === 0) {
    return `${hours} ч`;
  }

  return `${hours} ч ${minutes} мин`;
}

export function formatAddressShort(order: CourierOrder) {
  return [order.address.street, order.address.house].filter(Boolean).join(', ') || 'Адрес не указан';
}

export function formatAddressFull(order: CourierOrder) {
  return [order.address.city, order.address.street, order.address.house].filter(Boolean).join(', ') || 'Адрес не указан';
}

export function getOrderPaymentLabel(order: CourierOrder) {
  return order.is_paid ? 'Оплачен' : 'Наличными';
}

export function getOrderStatusLabel(order: CourierOrder, currentCourierId: string) {
  if (!order.courier_id && order.status === 'ready') {
    return 'Можно взять';
  }

  if (order.courier_id === currentCourierId) {
    if (order.courier_status === 'assigned') {
      return 'Нужно выехать';
    }

    if (order.courier_status === 'on_the_way') {
      return 'В пути';
    }

    if (order.courier_status === 'arrived') {
      return 'На месте';
    }

    if (order.courier_status === 'delivered' || order.status === 'delivered') {
      return 'Доставлен';
    }

    return 'Мой заказ';
  }

  return 'Назначен';
}

export function getCourierPrimaryAction(order: CourierOrder, currentCourierId: string) {
  if (!order.courier_id && order.status === 'ready') {
    return {
      action: 'claim',
      label: 'Взять заказ',
      disabled: false,
    } as const;
  }

  if (order.courier_id !== currentCourierId) {
    return null;
  }

  if (!order.courier_status || order.courier_status === 'assigned') {
    return {
      action: 'start',
      label: 'В путь',
      disabled: false,
    } as const;
  }

  if (order.courier_status === 'on_the_way') {
    return {
      action: 'arrive',
      label: 'Я на месте',
      disabled: false,
    } as const;
  }

  if (order.courier_status === 'arrived') {
    return {
      action: 'complete',
      label: 'Заказ выдан',
      disabled: false,
    } as const;
  }

  if (order.courier_status === 'delivered' || order.status === 'delivered') {
    return {
      action: 'complete',
      label: 'Заказ выдан',
      disabled: true,
    } as const;
  }

  return null;
}

export function getOrderEtaLabel(order: CourierOrder) {
  if (order.estimated_delivery_at) {
    return `Довезти до ${formatClock(order.estimated_delivery_at)}`;
  }

  if (order.delivery_started_at) {
    return `В пути ${formatOrderAge(order.delivery_started_at)}`;
  }

  if (order.courier_assigned_at) {
    return `Назначен ${formatClock(order.courier_assigned_at)}`;
  }

  return `Создан ${formatClock(order.created_at)}`;
}

export function getCourierMapPreviewUrl(order: CourierOrder) {
  if (order.address.longitude == null || order.address.latitude == null) {
    return null;
  }

  const ll = `${order.address.longitude},${order.address.latitude}`;
  return `https://static-maps.yandex.ru/1.x/?lang=ru_RU&ll=${encodeURIComponent(ll)}&z=16&size=650,460&l=map&pt=${encodeURIComponent(`${ll},pm2rdm`)}`;
}

export function getCourierRouteUrl(order: CourierOrder) {
  if (order.address.longitude == null || order.address.latitude == null) {
    return null;
  }

  return `https://yandex.ru/maps/?rtext=~${order.address.latitude},${order.address.longitude}&rtt=auto`;
}
