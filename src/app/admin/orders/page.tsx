'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  fetchAllOrdersWithItems,
  updateOrderStatus,
  type OrderDeliveryAddress,
  type OrderType,
} from '@/app/api/client/orders';
import PageLoader from '@/app/components/PageLoader/PageLoader';
import AdminShell from '@/app/admin/components/AdminShell/AdminShell';
import { useAdminAccess } from '@/app/admin/useAdminAccess';
import styles from './page.module.scss';

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

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function getOrderTotal(order: OrderType) {
  if (typeof order.total_amount === 'number') {
    return order.total_amount;
  }

  return order.items.reduce((total, item) => {
    const price = item.price_at_time ?? item.menu_items?.price ?? 0;
    return total + price * (item.quantity ?? 1);
  }, 0);
}

export default function AdminOrdersPage() {
  const { profile, isChecking } = useAdminAccess();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const resolveStatusKey = (status?: string) => {
    if (!status || status === 'paid') return 'accepted';
    if (status === 'accepted' || status === 'in_progress' || status === 'ready') return status;
    return 'accepted';
  };

  const getStatusLabel = (status?: string) => {
    const key = resolveStatusKey(status);
    if (key === 'accepted') return 'Принят';
    if (key === 'in_progress') return 'В работе';
    if (key === 'ready') return 'Готов';
    return 'Принят';
  };

  const getStatusClassName = (status?: string) => {
    const key = resolveStatusKey(status);
    if (key === 'in_progress') return styles.statusInProgress;
    if (key === 'ready') return styles.statusReady;
    return styles.statusAccepted;
  };

  useEffect(() => {
    if (!profile) return;

    const loadOrders = async () => {
      setLoading(true);
      const { data: ordersData, error: ordersError } = await fetchAllOrdersWithItems();

      if (ordersError) {
        console.error(ordersError);
        setLoading(false);
        return;
      }

      setOrders(ordersData || []);
      setLoading(false);
    };

    loadOrders();
  }, [profile]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) =>
        searchTerm ? order.id.toLowerCase().includes(searchTerm.toLowerCase()) : true
      ),
    [orders, searchTerm]
  );

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId);
    const { error } = await updateOrderStatus(orderId, nextStatus);

    if (error) {
      console.error(error);
      alert(error.message ?? 'Failed to update order status');
      setUpdatingId(null);
      return;
    }

    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order))
    );
    setUpdatingId(null);
  };

  if (isChecking) return <PageLoader label="Проверяем доступ..." />;
  if (!profile) return null;
  if (loading) return <PageLoader label="Загружаем заказы..." />;

  return (
    <AdminShell
      profile={profile}
      active="orders"
      title="Заказы"
      subtitle="Полный список заказов с поиском по id и быстрым обновлением статуса."
    >
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelEyebrow}>Лента заказов</p>
            <h2 className={styles.panelTitle}>Все заказы</h2>
          </div>

          <label className={styles.searchWrap}>
            <span className={styles.searchLabel}>Поиск по id</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по ID заказа"
              className={styles.searchInput}
            />
          </label>
        </div>

        {filteredOrders.length === 0 ? (
          <div className={styles.emptyState}>
            {orders.length === 0 ? 'Заказов нет' : 'По вашему запросу ничего не найдено'}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderTop}>
                <div>
                  <p className={styles.orderId}>Заказ #{order.id.slice(0, 8)}</p>
                  <p className={styles.orderMeta}>Пользователь ID: {order.user_id}</p>
                  <p className={styles.orderMeta}>Дата: {order.created_at.split('T')[0]}</p>
                </div>

                <strong className={styles.orderTotal}>{formatCurrency(getOrderTotal(order))}</strong>
              </div>

              <p className={styles.deliveryLine}>
                Тип: {order.type === 'delivery' ? 'Доставка' : 'В ресторане'}
              </p>
              <p className={styles.deliveryLine}>
                Адрес: {formatDeliveryAddress(order.delivery_address ?? null)}
              </p>

              <div className={styles.statusRow}>
                <span className={`${styles.status} ${getStatusClassName(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
                <select
                  value={resolveStatusKey(order.status)}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  disabled={updatingId === order.id}
                  className={styles.statusSelect}
                >
                  <option value="accepted">Принят</option>
                  <option value="in_progress">В работе</option>
                  <option value="ready">Готов</option>
                </select>
              </div>

              <div className={styles.orderItems}>
                {order.items.length === 0 ? (
                  <p className={styles.orderItem}>Нет позиций</p>
                ) : (
                  order.items.map((item) => (
                    <span key={item.id} className={styles.itemChip}>
                      {item.menu_items?.name ?? 'Товар'} x{item.quantity ?? 1}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </AdminShell>
  );
}
