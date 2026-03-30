'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchCourierHistory, type CourierHistoryEntry } from '@/app/api/client/courier';
import { subscribeCourierWorkspace } from '@/app/api/client/realtime';
import CourierMenu, { CourierMenuButton } from '../CourierMenu';
import frameStyles from '../courierFrame.module.scss';
import { formatClock, formatHistoryDate, formatOrderShortId, formatWorkedTime } from '../courierHelpers';
import { useCourerAccess } from '../useCourerAccess';
import styles from './page.module.scss';

function getTodayValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 10);
}

export default function CourerHistoryPage() {
  const { profile, isChecking } = useCourerAccess();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayValue);
  const [orders, setOrders] = useState<CourierHistoryEntry[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    cash: 0,
    cashless: 0,
    workedMinutes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) {
      return;
    }

    let isMounted = true;

    const loadHistory = async () => {
      const { data, error } = await fetchCourierHistory(selectedDate);

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error('Courier history load error:', error);
        setErrorMessage('Не удалось загрузить историю смены');
        setIsLoading(false);
        return;
      }

      setOrders(data?.orders ?? []);
      setStats(
        data?.stats ?? {
          total: 0,
          cash: 0,
          cashless: 0,
          workedMinutes: 0,
        }
      );
      setErrorMessage(null);
      setIsLoading(false);
    };

    setIsLoading(true);
    loadHistory();

    const unsubscribe = subscribeCourierWorkspace(profile.id, loadHistory, `courier-history-${profile.id}`);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [profile?.id, selectedDate]);

  const ordersPerHour = useMemo(() => {
    if (!stats.workedMinutes) {
      return '0.0';
    }

    return (stats.total / (stats.workedMinutes / 60)).toFixed(1);
  }, [stats]);

  if (isChecking) {
    return (
      <main className={frameStyles.page}>
        <div className={frameStyles.viewport}>
          <div className={frameStyles.loadingState}>Открываем историю смены...</div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <main className={frameStyles.page}>
      <div className={frameStyles.viewport}>
        <CourierMenuButton onClick={() => setIsMenuOpen(true)} />

        <section className={`${frameStyles.scrollable} ${styles.content}`}>
          <header className={styles.header}>
            <h1 className={styles.title}>История</h1>
            <label className={styles.dateLabel}>
              <span>{formatHistoryDate(selectedDate)}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className={styles.dateInput}
              />
            </label>
          </header>

          <div className={styles.statsGrid}>
            <article className={styles.statCard}>
              <span className={styles.statName}>Всего</span>
              <strong className={styles.statValue}>{stats.total}</strong>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statName}>Наличными</span>
              <strong className={styles.statValue}>{stats.cash}</strong>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statName}>Безнал</span>
              <strong className={styles.statValue}>{stats.cashless}</strong>
            </article>
            <article className={styles.statCardWide}>
              <span className={styles.statName}>Время смены</span>
              <strong className={styles.statValue}>{formatWorkedTime(stats.workedMinutes)}</strong>
            </article>
            <article className={styles.statCardWide}>
              <span className={styles.statName}>Заказов в час</span>
              <strong className={styles.statValue}>{ordersPerHour}</strong>
            </article>
          </div>

          {isLoading ? (
            <div className={styles.emptyState}>Загружаем историю...</div>
          ) : errorMessage ? (
            <div className={styles.emptyState}>{errorMessage}</div>
          ) : orders.length === 0 ? (
            <div className={styles.emptyState}>За выбранную дату доставок пока нет.</div>
          ) : (
            <div className={styles.ordersList}>
              {orders.map((order) => (
                <article key={order.id} className={styles.orderCard}>
                  <h2 className={styles.orderCode}>{formatOrderShortId(order.id)}</h2>
                  <p className={styles.orderAddress}>
                    {[order.street, order.house].filter(Boolean).join(', ') || 'Адрес не указан'}
                  </p>
                  <div className={styles.orderMeta}>
                    <span>{formatClock(order.delivered_at || order.created_at)}</span>
                    <span>{order.is_paid ? 'Безнал' : 'Наличные'}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <CourierMenu profile={profile} isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} active="history" />
      </div>
    </main>
  );
}
