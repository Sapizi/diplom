'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/app/api/client/auth';
import {
  fetchAllOrdersWithItems,
  updateOrderStatus,
  type OrderDeliveryAddress,
  type OrderType,
} from '@/app/api/client/orders';
import { subscribeOrdersFeed } from '@/app/api/client/realtime';
import { useManagerAccess } from '../useManagerAccess';
import styles from './page.module.scss';

const PRODUCTION_STATUSES = new Set(['paid', 'accepted', 'in_progress']);

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7H20M4 12H20M4 17H20" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 11.5L12 5L20 11.5V19H14.5V14.5H9.5V19H4V11.5Z" fill="currentColor" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3V6M17 3V6M4 9H20M6.5 5H17.5C18.8807 5 20 6.11929 20 7.5V18C20 19.3807 18.8807 20.5 17.5 20.5H6.5C5.11929 20.5 4 19.3807 4 18V7.5C4 6.11929 5.11929 5 6.5 5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function StaffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12Z"
        fill="currentColor"
      />
      <path d="M4 20C4.8 16.9 7.65 14.75 12 14.75C16.35 14.75 19.2 16.9 20 20" fill="currentColor" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 4H7C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M14 8L19 12L14 16M19 12H10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 7V12L15.5 14M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function formatClock(value: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(value);
}

function formatDay(value: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(value);
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function minutesBetween(start: string | Date, end: string | Date) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
}

function formatDurationLabel(minutes: number) {
  if (minutes < 60) {
    return `${minutes} мин`;
  }

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  if (!restMinutes) {
    return `${hours} ч`;
  }

  return `${hours} ч ${restMinutes} мин`;
}

function isToday(value: string, now: Date) {
  const date = new Date(value);

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function getOrderAmount(order: OrderType) {
  if (typeof order.total_amount === 'number') {
    return order.total_amount;
  }

  return order.items.reduce((total, item) => {
    const price = item.price_at_time ?? item.menu_items?.price ?? 0;
    return total + price * (item.quantity ?? 1);
  }, 0);
}

function getCompletionTime(order: OrderType) {
  if (order.delivered_at) {
    return order.delivered_at;
  }

  if (order.status === 'ready' && order.updated_at) {
    return order.updated_at;
  }

  return null;
}

function getStatusLabel(status?: string) {
  if (status === 'paid') return 'Новый';
  if (status === 'accepted') return 'Принят';
  if (status === 'in_progress') return 'В работе';
  if (status === 'ready') return 'Готов';
  if (status === 'delivered') return 'Доставлен';
  return status || 'Без статуса';
}

function resolveStatusKey(status?: string) {
  if (!status || status === 'paid') {
    return 'accepted';
  }

  if (status === 'accepted' || status === 'in_progress' || status === 'ready') {
    return status;
  }

  return 'accepted';
}

function getStatusTone(status?: string) {
  if (status === 'ready' || status === 'delivered') {
    return styles.statusSuccess;
  }

  if (status === 'in_progress') {
    return styles.statusWarning;
  }

  if (status === 'paid' || status === 'accepted') {
    return styles.statusNeutral;
  }

  return styles.statusMuted;
}

function formatDeliveryAddress(address: OrderDeliveryAddress | null) {
  if (!address) {
    return 'В зале';
  }

  const primary = [address.city, address.street, address.house].filter(Boolean).join(', ');
  const details = [
    address.entrance ? `подъезд ${address.entrance}` : null,
    address.apartment ? `кв. ${address.apartment}` : null,
    address.floor ? `этаж ${address.floor}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return [primary, details, address.comment].filter(Boolean).join(' • ');
}

export default function ManagerMainPage() {
  const router = useRouter();
  const { profile, isChecking } = useManagerAccess();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!profile) {
      return;
    }

    let isMounted = true;

    const loadOrders = async () => {
      const { data, error } = await fetchAllOrdersWithItems();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error('Manager orders load error:', error);
        setIsLoadingOrders(false);
        return;
      }

      setOrders((data || []).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
      setIsLoadingOrders(false);
    };

    loadOrders();

    const unsubscribe = subscribeOrdersFeed(loadOrders, `manager-orders-${profile.id}`);
    const fallbackRefresh = window.setInterval(loadOrders, 4000);

    return () => {
      isMounted = false;
      window.clearInterval(fallbackRefresh);
      unsubscribe();
    };
  }, [profile]);

  const summary = useMemo(() => {
    const todayOrders = orders.filter((order) => isToday(order.created_at, now));
    const productionOrders = orders.filter((order) => PRODUCTION_STATUSES.has(order.status || ''));
    const deliveryOrders = todayOrders.filter((order) => order.type === 'delivery');
    const hallOrders = todayOrders.filter((order) => order.type !== 'delivery');
    const completedToday = todayOrders.filter((order) => getCompletionTime(order));

    const averageProductionTime =
      completedToday.length > 0
        ? Math.round(
            completedToday.reduce((total, order) => {
              const completedAt = getCompletionTime(order);

              if (!completedAt) {
                return total;
              }

              return total + minutesBetween(order.created_at, completedAt);
            }, 0) / completedToday.length
          )
        : null;

    return {
      todayOrders: todayOrders.length,
      productionOrders: productionOrders.length,
      deliveryOrders: deliveryOrders.length,
      hallOrders: hallOrders.length,
      averageProductionTime,
    };
  }, [now, orders]);

  const displayName = useMemo(() => {
    const profileName = profile?.name?.trim();

    if (profileName) {
      return profileName;
    }

    const emailName = profile?.email.split('@')[0]?.trim();
    return emailName || 'Менеджер';
  }, [profile]);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Manager logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId);

    const { error } = await updateOrderStatus(orderId, nextStatus);

    if (error) {
      console.error('Manager order status update error:', error);
      alert(error.message ?? 'Не удалось обновить статус заказа');
      setUpdatingId(null);
      return;
    }

    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order))
    );
    setUpdatingId(null);
  };

  if (isChecking) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingState}>Проверяем доступ менеджера...</div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <main className={styles.page}>
      <button
        type="button"
        className={`${styles.overlay} ${isMenuOpen ? styles.overlayVisible : ''}`}
        onClick={() => setIsMenuOpen(false)}
        aria-label="Закрыть меню"
      />

      <aside className={`${styles.sidebar} ${isMenuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarTop}>
          <Link href="/manager/main" className={styles.logoLink}>
            <img src="/logo.svg" alt="Логотип" className={styles.logo} />
          </Link>

          <div className={styles.profileCard}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>{displayName.slice(0, 1).toUpperCase()}</div>
            )}

            <div className={styles.profileMeta}>
              <p className={styles.profileName}>{displayName}</p>
              <p className={styles.profileRole}>Менеджер смены</p>
            </div>
          </div>

          <nav className={styles.nav}>
            <Link href="/manager/main" className={`${styles.navItem} ${styles.navItemActive}`}>
              <HomeIcon />
              <span>Главная</span>
            </Link>
            <Link href="/manager/schedule" className={styles.navItem}>
              <CalendarIcon />
              <span>График</span>
            </Link>
            <Link href="/manager/staff" className={styles.navItem}>
              <StaffIcon />
              <span>Сотрудники</span>
            </Link>
          </nav>
        </div>

        <button
          type="button"
          className={styles.logoutButton}
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogoutIcon />
          <span>{isLoggingOut ? 'Выходим...' : 'Выйти'}</span>
        </button>
      </aside>

      <section className={styles.content}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setIsMenuOpen(true)}
            aria-label="Открыть меню"
          >
            <MenuIcon />
          </button>

          <div>
            <p className={styles.eyebrow}>Панель менеджера</p>
            <h1 className={styles.title}>Заказы в реальном времени</h1>
          </div>

          <div className={styles.timeCard}>
            <div className={styles.timeIcon}>
              <ClockIcon />
            </div>
            <div>
              <p className={styles.timeValue}>{formatClock(now)}</p>
              <p className={styles.timeCaption}>{formatDay(now)}</p>
            </div>
          </div>
        </header>

        <section className={styles.metrics}>
          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>За день</p>
            <p className={styles.metricValue}>{summary.todayOrders}</p>
            <p className={styles.metricHint}>Все заказы, созданные сегодня</p>
          </article>

          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>В производстве</p>
            <p className={styles.metricValue}>{summary.productionOrders}</p>
            <p className={styles.metricHint}>Новые, принятые и готовящиеся</p>
          </article>

          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>На доставку</p>
            <p className={styles.metricValue}>{summary.deliveryOrders}</p>
            <p className={styles.metricHint}>Сегодня с типом доставки</p>
          </article>

          <article className={styles.metricCard}>
            <p className={styles.metricLabel}>На зал</p>
            <p className={styles.metricValue}>{summary.hallOrders}</p>
            <p className={styles.metricHint}>Сегодня для выдачи в ресторане</p>
          </article>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Лента заказов</p>
              <h2 className={styles.panelTitle}>Сначала новые, затем старые</h2>
            </div>

            <div className={styles.panelMeta}>
              <span>{orders.length} всего</span>
              <span>
                {summary.averageProductionTime
                  ? `Среднее время готовности ${formatDurationLabel(summary.averageProductionTime)}`
                  : 'Среднее время появится после первых готовых заказов'}
              </span>
            </div>
          </div>

          {isLoadingOrders ? (
            <div className={styles.emptyState}>Загружаем заказы...</div>
          ) : orders.length === 0 ? (
            <div className={styles.emptyState}>Заказов пока нет.</div>
          ) : (
            <div className={styles.ordersList}>
              {orders.map((order) => {
                const completionTime = getCompletionTime(order);
                const leadTime = formatDurationLabel(
                  minutesBetween(order.created_at, completionTime || now)
                );
                const typeLabel = order.type === 'delivery' ? 'Доставка' : 'В зале';

                return (
                  <article key={order.id} className={styles.orderCard}>
                    <div className={styles.orderTop}>
                      <div>
                        <p className={styles.orderId}>Заказ #{order.id.slice(0, 8)}</p>
                        <p className={styles.orderCreated}>{formatCreatedAt(order.created_at)}</p>
                      </div>

                      <div className={styles.orderBadges}>
                        <span className={`${styles.badge} ${styles.typeBadge}`}>{typeLabel}</span>
                        <span className={`${styles.badge} ${getStatusTone(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                    </div>

                    <div className={styles.orderActions}>
                      <span className={styles.orderActionLabel}>Статус заказа</span>
                      <select
                        value={resolveStatusKey(order.status)}
                        onChange={(event) => handleStatusChange(order.id, event.target.value)}
                        disabled={updatingId === order.id}
                        className={styles.statusSelect}
                      >
                        <option value="accepted">Принят</option>
                        <option value="in_progress">В работе</option>
                        <option value="ready">Готов</option>
                      </select>
                    </div>

                    <div className={styles.orderStats}>
                      <div className={styles.orderStat}>
                        <span className={styles.orderStatLabel}>Сумма</span>
                        <strong>{formatCurrency(getOrderAmount(order))}</strong>
                      </div>

                      <div className={styles.orderStat}>
                        <span className={styles.orderStatLabel}>
                          {completionTime ? 'Сделан за' : 'Прошло'}
                        </span>
                        <strong>{leadTime}</strong>
                      </div>

                      <div className={styles.orderStat}>
                        <span className={styles.orderStatLabel}>Позиций</span>
                        <strong>{order.items.reduce((sum, item) => sum + (item.quantity ?? 1), 0)}</strong>
                      </div>
                    </div>

                    <p className={styles.addressLine}>
                      {order.type === 'delivery'
                        ? formatDeliveryAddress(order.delivery_address ?? null)
                        : 'Гость заберет заказ в ресторане'}
                    </p>

                    <div className={styles.itemsRow}>
                      {order.items.map((item) => (
                        <span key={item.id} className={styles.itemChip}>
                          {item.menu_items?.name ?? 'Позиция'} x {item.quantity ?? 1}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
