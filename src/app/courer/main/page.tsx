'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { fetchCourierWorkspace, type CourierCoworker, type CourierOrder } from '@/app/api/client/courier';
import { subscribeCourierWorkspace } from '@/app/api/client/realtime';
import CourierMenu, { CourierMenuButton } from '../CourierMenu';
import frameStyles from '../courierFrame.module.scss';
import {
  formatAddressShort,
  formatClock,
  formatOrderAge,
  formatOrderShortId,
  formatRub,
  getCourierDisplayName,
  getOrderPaymentLabel,
  getOrderStatusLabel,
} from '../courierHelpers';
import { useCourerAccess } from '../useCourerAccess';
import styles from './page.module.scss';

const COWORKER_COLORS = ['#d3c300', '#ff2a23', '#51d1a0', '#ff9c2f', '#c27a9f', '#6c85ff'];

export default function CourerMainPage() {
  const { profile, isChecking, reloadProfile } = useCourerAccess();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [coworkers, setCoworkers] = useState<CourierCoworker[]>([]);
  const [orders, setOrders] = useState<CourierOrder[]>([]);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  const displayName = useMemo(() => {
    if (!profile) {
      return 'Курьер';
    }

    return getCourierDisplayName(profile);
  }, [profile]);

  const shiftIsOpen = Boolean(profile?.isOpen);

  useEffect(() => {
    if (!profile?.id || !shiftIsOpen) {
      setCoworkers([]);
      setOrders([]);
      setIsWorkspaceLoading(false);
      setWorkspaceError(null);
      return;
    }

    let isMounted = true;

    const loadWorkspace = async () => {
      const { data, error } = await fetchCourierWorkspace();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error('Courier workspace load error:', error);
        setWorkspaceError('Не удалось обновить рабочую смену');
        setIsWorkspaceLoading(false);
        return;
      }

      setCoworkers(data?.coworkers ?? []);
      setOrders(data?.orders ?? []);
      setWorkspaceError(null);
      setIsWorkspaceLoading(false);
    };

    setIsWorkspaceLoading(true);
    loadWorkspace();

    const unsubscribe = subscribeCourierWorkspace(profile.id, loadWorkspace, `courier-main-${profile.id}`);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [profile?.id, shiftIsOpen]);

  const visibleCoworkers = useMemo(() => {
    if (!profile) {
      return [];
    }

    if (coworkers.length > 0) {
      return coworkers;
    }

    return [
      {
        id: profile.id,
        name: profile.name,
        avatar_url: profile.avatar_url,
        isOpen: profile.isOpen,
        start_time: '00:00',
        end_time: '23:59',
        isCurrentCourier: true,
      },
    ];
  }, [coworkers, profile]);

  const activeOrders = useMemo(
    () => orders.filter((order) => order.courier_id === profile?.id),
    [orders, profile?.id]
  );

  const activeOrder = activeOrders[0] ?? null;

  if (isChecking) {
    return (
      <main className={frameStyles.page}>
        <div className={frameStyles.viewport}>
          <div className={frameStyles.loadingState}>Проверяем доступ курьера...</div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <main className={frameStyles.page}>
      <div className={`${frameStyles.viewport} ${styles.viewport}`}>
        <CourierMenuButton onClick={() => setIsMenuOpen(true)} />

        {shiftIsOpen ? (
          <section className={styles.openLayout}>
            <div className={styles.topSpacer} />

            <div className={styles.workspaceHead}>
              <div>
                <p className={styles.greeting}>Сегодня в смене</p>
                <h1 className={styles.nameTitle}>{displayName}</h1>
              </div>

              <div className={styles.statBubble}>
                <span className={styles.statValue}>{orders.length}</span>
                <span className={styles.statLabel}>заказов</span>
              </div>
            </div>

            <div className={styles.coworkersRow}>
              {visibleCoworkers.map((coworker, index) => (
                <div key={`${coworker.id}-${coworker.start_time}`} className={styles.coworkerItem}>
                  {coworker.avatar_url ? (
                    <img src={coworker.avatar_url} alt={coworker.name ?? 'Курьер'} className={styles.coworkerAvatar} />
                  ) : (
                    <div
                      className={styles.coworkerAvatarFallback}
                      style={{ backgroundColor: COWORKER_COLORS[index % COWORKER_COLORS.length] }}
                    >
                      {(coworker.name || 'К').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className={styles.coworkerName}>{coworker.isCurrentCourier ? displayName : coworker.name || 'Курьер'}</span>
                </div>
              ))}
            </div>

            {activeOrder ? (
              <Link href={`/courer/orders/${activeOrder.id}`} className={styles.activeOrderBanner}>
                <div>
                  <p className={styles.activeOrderLabel}>{activeOrders.length > 1 ? 'Активные заказы' : 'Текущий заказ'}</p>
                  <strong className={styles.activeOrderCode}>{formatOrderShortId(activeOrder.id)}</strong>
                </div>
                <div className={styles.activeOrderMeta}>
                  <span>{getOrderStatusLabel(activeOrder, profile.id)}</span>
                  <span>{activeOrders.length > 1 ? `${activeOrders.length} из 3` : formatOrderAge(activeOrder.created_at)}</span>
                </div>
              </Link>
            ) : null}

            <div className={styles.sectionHeading}>
              <h2>Доступные заказы</h2>
              <span>{orders.length}</span>
            </div>

            {isWorkspaceLoading ? (
              <div className={styles.inlineState}>Загружаем рабочую смену...</div>
            ) : workspaceError ? (
              <div className={styles.inlineState}>{workspaceError}</div>
            ) : orders.length === 0 ? (
              <div className={styles.inlineState}>Доступных заказов пока нет.</div>
            ) : (
              <div className={styles.ordersList}>
                {orders.map((order) => (
                  <article
                    key={order.id}
                    className={`${styles.orderCard} ${order.courier_id === profile.id ? styles.orderCardActive : ''}`}
                  >
                    <Link href={`/courer/orders/${order.id}`} className={styles.orderLink}>
                      <h2 className={styles.orderCode}>{formatOrderShortId(order.id)}</h2>
                      <p className={styles.orderAddress}>{formatAddressShort(order)}</p>
                      <div className={styles.orderMeta}>
                        <span>{formatClock(order.created_at)}</span>
                        <span>{formatOrderAge(order.created_at)}</span>
                      </div>
                    </Link>

                    <div className={styles.orderBottom}>
                      <span className={styles.orderBadge}>{getOrderPaymentLabel(order)}</span>
                      <span className={styles.orderPrice}>{formatRub(order.total_amount)}</span>
                    </div>
                    <p className={styles.orderStatus}>{getOrderStatusLabel(order, profile.id)}</p>

                    {order.customer.phone ? (
                      <a href={`tel:${order.customer.phone}`} className={styles.customerLink}>
                        {order.customer.name || order.customer.phone}
                      </a>
                    ) : order.customer.name ? (
                      <p className={styles.customerName}>{order.customer.name}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}

            {activeOrder ? (
              <Link href={`/courer/orders/${activeOrder.id}`} className={styles.floatingButton} aria-label="Открыть текущий заказ">
                +
              </Link>
            ) : null}
          </section>
        ) : (
          <section className={styles.stateCard}>
            <img src="/zamok.svg" alt="Смена закрыта" className={styles.lockIcon} />
            <h1 className={styles.title}>Смена не открыта</h1>
            <p className={styles.subtitle}>Обратитесь к менеджеру или дождитесь открытия смены.</p>
            <button type="button" className={styles.refreshButton} onClick={reloadProfile}>
              Обновить
            </button>
          </section>
        )}

        <CourierMenu profile={profile} isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} active="main" />
      </div>
    </main>
  );
}
