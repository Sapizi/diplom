'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchCourierOrder, updateCourierOrderAction, type CourierOrder } from '@/app/api/client/courier';
import { subscribeCourierWorkspace } from '@/app/api/client/realtime';
import frameStyles from '../../courierFrame.module.scss';
import {
  formatAddressFull,
  formatClock,
  formatOrderShortId,
  formatRub,
  getCourierPrimaryAction,
  getCourierRouteUrl,
  getOrderEtaLabel,
} from '../../courierHelpers';
import { useCourerAccess } from '../../useCourerAccess';
import CourierOrderMap from './CourierOrderMap';
import SlideAction from './SlideAction';
import styles from './page.module.scss';

const ISSUE_OPTIONS = [
  'Клиент не выходит на связь',
  'Изменение адреса',
  'Ошибка в заказе',
] as const;

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7L17 17M17 7L7 17" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
    </svg>
  );
}

export default function CourierOrderPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId;
  const { profile, isChecking } = useCourerAccess();
  const [order, setOrder] = useState<CourierOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isIssueSheetOpen, setIsIssueSheetOpen] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      return;
    }

    const { data, error } = await fetchCourierOrder(orderId);

    if (error) {
      console.error('Courier order load error:', error);
      setErrorMessage('Не удалось загрузить заказ');
      setIsLoading(false);
      return;
    }

    setOrder(data ?? null);
    setErrorMessage(null);
    setIsLoading(false);
  }, [orderId]);

  useEffect(() => {
    if (!profile?.id || !orderId) {
      return;
    }

    setIsLoading(true);
    loadOrder();

    const unsubscribe = subscribeCourierWorkspace(profile.id, loadOrder, `courier-order-${profile.id}-${orderId}`);

    return () => {
      unsubscribe();
    };
  }, [loadOrder, orderId, profile?.id]);

  useEffect(() => {
    if (!order) {
      return;
    }

    setCheckedItems((current) => {
      const nextState = { ...current };

      order.items.forEach((item) => {
        if (nextState[item.id] == null) {
          nextState[item.id] = false;
        }
      });

      return nextState;
    });
  }, [order]);

  const primaryAction = useMemo(() => {
    if (!order || !profile) {
      return null;
    }

    return getCourierPrimaryAction(order, profile.id);
  }, [order, profile]);

  const routeUrl = order ? getCourierRouteUrl(order) : null;
  const allItemsChecked = useMemo(() => {
    if (!order || order.items.length === 0) {
      return true;
    }

    return order.items.every((item) => checkedItems[item.id]);
  }, [checkedItems, order]);

  const startBlockedByChecklist = primaryAction?.action === 'start' && !allItemsChecked;

  const handleAction = useCallback(async () => {
    if (!order || !primaryAction || primaryAction.disabled || isSubmitting || startBlockedByChecklist) {
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await updateCourierOrderAction(order.id, primaryAction.action);

    if (error) {
      console.error('Courier order action error:', error);
      alert(error.message ?? 'Не удалось обновить заказ');
      setIsSubmitting(false);
      return;
    }

    setOrder(data ?? order);
    setIsSubmitting(false);
  }, [isSubmitting, order, primaryAction, startBlockedByChecklist]);

  if (isChecking) {
    return (
      <main className={frameStyles.page}>
        <div className={frameStyles.viewport}>
          <div className={frameStyles.loadingState}>Открываем заказ...</div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  if (isLoading) {
    return (
      <main className={frameStyles.page}>
        <div className={frameStyles.viewport}>
          <div className={frameStyles.loadingState}>Загружаем детали заказа...</div>
        </div>
      </main>
    );
  }

  if (!order || errorMessage) {
    return (
      <main className={frameStyles.page}>
        <div className={frameStyles.viewport}>
          <div className={frameStyles.emptyState}>{errorMessage || 'Заказ недоступен'}</div>
        </div>
      </main>
    );
  }

  return (
    <main className={frameStyles.page}>
      <div className={frameStyles.viewport}>
        <section className={styles.layout}>
          <div className={styles.mapArea}>
            <CourierOrderMap
              latitude={order.address.latitude}
              longitude={order.address.longitude}
              addressLine={formatAddressFull(order)}
            />

            <Link href="/courer/main" className={styles.closeButton} aria-label="Закрыть заказ">
              <CloseIcon />
            </Link>

            <div className={styles.orderTitle}>{formatOrderShortId(order.id)}</div>

            <div className={styles.progressStrip}>
              <span className={styles.progressFill} />
              <span className={styles.progressText}>{getOrderEtaLabel(order)}</span>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.addressHead}>
              <div className={styles.pinBadge}>⌖</div>
              <div>
                <h1 className={styles.addressTitle}>{formatAddressFull(order)}</h1>
                <p className={styles.addressMeta}>
                  {formatClock(order.created_at)} · {formatRub(order.total_amount)}
                </p>
              </div>
            </div>

            {order.customer.phone ? (
              <a href={`tel:${order.customer.phone}`} className={styles.customerLink}>
                {order.customer.name || order.customer.phone}
              </a>
            ) : order.customer.name ? (
              <p className={styles.customerName}>{order.customer.name}</p>
            ) : null}

            <div className={styles.detailsGrid}>
              <div>
                <span className={styles.detailLabel}>Подъезд</span>
                <strong className={styles.detailValue}>{order.address.entrance || '—'}</strong>
              </div>
              <div>
                <span className={styles.detailLabel}>Этаж</span>
                <strong className={styles.detailValue}>{order.address.floor || '—'}</strong>
              </div>
              <div>
                <span className={styles.detailLabel}>Квартира</span>
                <strong className={styles.detailValue}>{order.address.apartment || '—'}</strong>
              </div>
              <div>
                <span className={styles.detailLabel}>Комментарий</span>
                <strong className={styles.detailValue}>{order.address.comment || '—'}</strong>
              </div>
            </div>

            <div className={styles.itemsSection}>
              <h2 className={styles.itemsTitle}>Состав заказа</h2>
              <div className={styles.itemsList}>
                {order.items.length > 0 ? (
                  order.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`${styles.itemRow} ${checkedItems[item.id] ? styles.itemRowChecked : ''}`}
                      onClick={() =>
                        setCheckedItems((current) => ({
                          ...current,
                          [item.id]: !current[item.id],
                        }))
                      }
                    >
                      <span className={styles.itemText}>
                        x{item.quantity} {item.menu_item_name}
                      </span>
                      <span className={styles.itemCheck}>{checkedItems[item.id] ? '✓' : ''}</span>
                    </button>
                  ))
                ) : (
                  <div className={styles.emptyItems}>Позиции заказа скоро подтянутся.</div>
                )}
              </div>
            </div>

            {routeUrl ? (
              <a href={routeUrl} target="_blank" rel="noreferrer" className={styles.routeLink}>
                Открыть маршрут в Яндекс Картах
              </a>
            ) : null}

            {startBlockedByChecklist ? (
              <p className={styles.checklistWarning}>Отметьте все позиции, прежде чем отправляться в путь.</p>
            ) : null}

            <SlideAction
              label={primaryAction?.label || 'Доставка завершена'}
              disabled={!primaryAction || primaryAction.disabled || startBlockedByChecklist}
              loading={isSubmitting}
              onComplete={handleAction}
            />

            {order.courier_id === profile.id && order.courier_status !== 'delivered' ? (
              <button type="button" className={styles.problemLink} onClick={() => setIsIssueSheetOpen(true)}>
                Проблема с заказом?
              </button>
            ) : null}
          </div>
        </section>

        <div className={`${styles.issueOverlay} ${isIssueSheetOpen ? styles.issueOverlayVisible : ''}`}>
          <button
            type="button"
            className={styles.issueBackdrop}
            onClick={() => setIsIssueSheetOpen(false)}
            aria-label="Закрыть окно проблем"
          />

          <section className={styles.issueSheet}>
            <div className={styles.issueHandle} />
            <h2 className={styles.issueTitle}>Отметьте проблему</h2>

            <div className={styles.issueActions}>
              {ISSUE_OPTIONS.map((label) => (
                <a key={label} href="tel:+79000848683" className={styles.issueButton}>
                  <span>{label}</span>
                  <span className={styles.issueChevron}>›</span>
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
