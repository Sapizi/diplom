'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getCurrentUser } from '@/app/api/client/auth';
import {
  fetchOrdersWithItemsByUser,
  upsertOrderReview,
  type OrderDeliveryAddress,
  type OrderItemType,
  type OrderType,
} from '@/app/api/client/orders';
import { subscribeOrdersFeed } from '@/app/api/client/realtime';

import Header from '@/app/components/Header/Header';
import Footer from '@/app/components/Footer/Footer';
import PageLoader from '@/app/components/PageLoader/PageLoader';
import { Wrapper } from '@/app/components/Header/HeaderStyles';
import { Title } from '@/app/MainPageStyles';
import { TitleBlock } from '../../admin/menu/AdminMenuStyles';
import { UserOrder } from './UserOrdersStyles';
import OrderTrackingMap from './OrderTrackingMap';
import styles from './page.module.scss';

type ReviewDraft = {
  rating: number;
  comment: string;
};

const SUPPORT_TELEGRAM_URL = process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM_URL || 'https://web.telegram.org/';

function formatDeliveryAddress(address: OrderDeliveryAddress | null) {
  if (!address) {
    return 'Самовывоз из ресторана';
  }

  const firstLine = [
    address.city,
    address.street ? `ул. ${address.street}` : null,
    address.house ? `д. ${address.house}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  const secondLine = [
    address.entrance ? `подъезд ${address.entrance}` : null,
    address.apartment ? `кв. ${address.apartment}` : null,
    address.floor ? `этаж ${address.floor}` : null,
    address.comment,
  ]
    .filter(Boolean)
    .join(', ');

  return [firstLine, secondLine].filter(Boolean).join(' | ');
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTrackingTime(value: string | null | undefined) {
  if (!value) {
    return 'нет данных';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

function calcTotal(items: OrderItemType[]) {
  return items.reduce((sum, item) => {
    const price = item.price_at_time ?? item.menu_items?.price ?? 0;
    const qty = item.quantity ?? 1;
    return sum + price * qty;
  }, 0);
}

function resolveStatusKey(status?: string) {
  if (!status || status === 'paid') return 'accepted';
  if (status === 'accepted' || status === 'in_progress' || status === 'ready' || status === 'delivered') {
    return status;
  }
  return 'accepted';
}

function getStatusLabel(status?: string) {
  const key = resolveStatusKey(status);
  if (key === 'accepted') return 'Принят';
  if (key === 'in_progress') return 'В работе';
  if (key === 'ready') return 'Готов';
  if (key === 'delivered') return 'Доставлен';
  return 'Принят';
}

function getStatusClassName(status?: string) {
  const key = resolveStatusKey(status);
  if (key === 'in_progress') return styles.statusInProgress;
  if (key === 'ready') return styles.statusReady;
  if (key === 'delivered') return styles.statusDelivered;
  return styles.statusAccepted;
}

function isReviewable(order: OrderType) {
  return order.status === 'ready' || order.status === 'delivered';
}

function getInitialDraft(order: OrderType): ReviewDraft {
  return {
    rating: order.review?.rating ?? 5,
    comment: order.review?.comment ?? '',
  };
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (index < rating ? '★' : '☆')).join('');
}

function getTrackingLabel(order: OrderType) {
  if (order.type !== 'delivery') {
    return 'Самовывоз из ресторана';
  }

  if (order.delivered_at || order.courier_status === 'delivered') {
    return 'Заказ уже доставлен';
  }

  if (order.courier_status === 'arrived') {
    return 'Курьер уже на месте';
  }

  if (order.customer_tracking_enabled && order.courier_latitude != null && order.courier_longitude != null) {
    return 'Курьер в пути, карта обновляется в реальном времени';
  }

  if (order.delivery_started_at) {
    return 'Курьер выехал, ожидаем первую точку маршрута';
  }

  if (order.courier_id) {
    return 'Курьер назначен, скоро сможете следить за движением';
  }

  return 'Доставка ещё готовится';
}

export default function UserOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [savingReviewId, setSavingReviewId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      const user = await getCurrentUser();
      if (!isMounted) return;

      if (!user) {
        setIsAuthorized(false);
        setLoading(false);
        router.push('/login');
        return;
      }

      setUserId(user.id);
      setIsAuthorized(true);

      const { data: ordersData, error } = await fetchOrdersWithItemsByUser(user.id);
      if (!isMounted) return;

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const nextOrders = ordersData || [];
      setOrders(nextOrders);
      setReviewDrafts(
        Object.fromEntries(nextOrders.map((order) => [order.id, getInitialDraft(order)]))
      );
      setLoading(false);
    };

    setLoading(true);
    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isMounted = true;

    const refreshOrders = async () => {
      const { data, error } = await fetchOrdersWithItemsByUser(userId);

      if (!isMounted || error) {
        if (error) {
          console.error('User orders refresh error:', error);
        }
        return;
      }

      const nextOrders = data || [];
      setOrders(nextOrders);
      setReviewDrafts((prev) => ({
        ...Object.fromEntries(nextOrders.map((order) => [order.id, getInitialDraft(order)])),
        ...prev,
      }));
    };

    const unsubscribe = subscribeOrdersFeed(refreshOrders, `user-orders-${userId}`);
    const fallbackRefresh = window.setInterval(refreshOrders, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(fallbackRefresh);
      unsubscribe();
    };
  }, [userId]);

  const handleDraftChange = (orderId: string, patch: Partial<ReviewDraft>) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] ?? { rating: 5, comment: '' }),
        ...patch,
      },
    }));
  };

  const handleSaveReview = async (order: OrderType) => {
    const draft = reviewDrafts[order.id] ?? getInitialDraft(order);

    setSavingReviewId(order.id);

    const { data, error } = await upsertOrderReview({
      orderId: order.id,
      rating: draft.rating,
      comment: draft.comment,
    });

    if (error) {
      console.error(error);
      alert(error.message ?? 'Не удалось сохранить отзыв');
      setSavingReviewId(null);
      return;
    }

    setOrders((prev) =>
      prev.map((item) => (item.id === order.id ? { ...item, review: data } : item))
    );
    setReviewDrafts((prev) => ({
      ...prev,
      [order.id]: {
        rating: data?.rating ?? draft.rating,
        comment: data?.comment ?? '',
      },
    }));
    setSavingReviewId(null);
  };

  if (!loading && !isAuthorized) return null;
  if (loading) {
    return (
      <>
        <Header />
        <Wrapper>
          <TitleBlock>
            <Title>Ваши заказы</Title>
          </TitleBlock>
          <PageLoader label="Загружаем заказы..." />
        </Wrapper>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <Wrapper>
        <TitleBlock>
          <Title>Ваши заказы</Title>
        </TitleBlock>

        {orders.length === 0 ? (
          <div className={styles.emptyState}>У вас пока нет заказов</div>
        ) : (
          <div className={styles.ordersGrid}>
            {orders.map((order) => {
              const reviewDraft = reviewDrafts[order.id] ?? getInitialDraft(order);
              const total = calcTotal(order.items);

              return (
                <UserOrder key={order.id}>
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.orderCode}>Заказ #{order.id.slice(0, 8)}</p>
                      <p className={styles.orderDate}>{formatOrderDate(order.created_at)}</p>
                    </div>

                    <div className={styles.badges}>
                      <span className={styles.typeBadge}>
                        {order.type === 'delivery' ? 'Доставка' : 'Самовывоз'}
                      </span>
                      <span className={`${styles.statusBadge} ${getStatusClassName(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                      <span className={styles.statLabel}>Сумма</span>
                      <strong>{formatMoney(total)}</strong>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statLabel}>Позиций</span>
                      <strong>{order.items.reduce((sum, item) => sum + (item.quantity ?? 1), 0)}</strong>
                    </div>
                  </div>

                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Адрес</span>
                    <p className={styles.infoValue}>{formatDeliveryAddress(order.delivery_address ?? null)}</p>
                  </div>

                  {order.type === 'delivery' ? (
                    <div className={styles.trackingCard}>
                      <div className={styles.trackingHeader}>
                        <div>
                          <p className={styles.trackingEyebrow}>Отслеживание курьера</p>
                          <h3 className={styles.trackingTitle}>{getTrackingLabel(order)}</h3>
                        </div>
                        <div className={styles.trackingMeta}>
                          <span>Обновлено: {formatTrackingTime(order.courier_location_updated_at)}</span>
                          <span>
                            {order.estimated_delivery_at
                              ? `Ожидаем до ${formatTrackingTime(order.estimated_delivery_at)}`
                              : 'Время прибытия уточняется'}
                          </span>
                        </div>
                      </div>

                      <OrderTrackingMap
                        addressLine={formatDeliveryAddress(order.delivery_address ?? null)}
                        deliveryLatitude={order.delivery_address?.latitude ?? null}
                        deliveryLongitude={order.delivery_address?.longitude ?? null}
                        courierLatitude={order.courier_latitude ?? null}
                        courierLongitude={order.courier_longitude ?? null}
                        trackingEnabled={Boolean(order.customer_tracking_enabled)}
                      />
                    </div>
                  ) : null}

                  <div className={styles.itemsSection}>
                    <p className={styles.sectionTitle}>Состав заказа</p>
                    <div className={styles.itemsList}>
                      {order.items.length === 0 ? (
                        <div className={styles.emptyItems}>Позиции скоро подтянутся</div>
                      ) : (
                        order.items.map((item) => (
                          <div key={item.id} className={styles.itemRow}>
                            <div>
                              <strong>{item.menu_items?.name ?? 'Товар'}</strong>
                              <span>x{item.quantity ?? 1}</span>
                            </div>
                            <span>{formatMoney(item.price_at_time ?? item.menu_items?.price ?? 0)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {isReviewable(order) ? (
                    <div className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <span className={styles.reviewTitle}>
                          {order.review ? 'Ваш отзыв' : 'Оцените заказ'}
                        </span>
                        {order.review ? (
                          <span className={styles.reviewValue}>{renderStars(order.review.rating)}</span>
                        ) : null}
                      </div>

                      {order.review?.comment ? (
                        <p className={styles.reviewPreview}>{order.review.comment}</p>
                      ) : null}

                      <div className={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`${styles.starButton} ${reviewDraft.rating >= star ? styles.starButtonActive : ''}`}
                            onClick={() => handleDraftChange(order.id, { rating: star })}
                            aria-label={`Оценка ${star}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>

                      <textarea
                        className={styles.reviewTextarea}
                        value={reviewDraft.comment}
                        onChange={(event) => handleDraftChange(order.id, { comment: event.target.value })}
                        placeholder="Что понравилось или что можно улучшить"
                        rows={4}
                      />

                      <button
                        type="button"
                        className={styles.reviewButton}
                        onClick={() => handleSaveReview(order)}
                        disabled={savingReviewId === order.id}
                      >
                        {savingReviewId === order.id
                          ? 'Сохраняем...'
                          : order.review
                            ? 'Обновить отзыв'
                            : 'Оставить отзыв'}
                      </button>
                    </div>
                  ) : null}

                  <div className={styles.actionsRow}>
                    <a
                      href={SUPPORT_TELEGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.supportButton}
                    >
                      Поддержка в Telegram
                    </a>
                  </div>
                </UserOrder>
              );
            })}
          </div>
        )}
      </Wrapper>
      <Footer />
    </>
  );
}
