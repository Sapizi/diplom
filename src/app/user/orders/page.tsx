'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getCurrentUser } from '@/app/api/client/auth';
import {
  fetchOrdersWithItemsByUser,
  type OrderDeliveryAddress,
  type OrderItemType,
  type OrderType,
} from '@/app/api/client/orders';

import Header from '@/app/components/Header/Header';
import Footer from '@/app/components/Footer/Footer';
import { Wrapper } from '@/app/components/Header/HeaderStyles';
import { Title } from '@/app/MainPageStyles';

import {
  Description,
  MenuList,
  Subtitle,
  TitleBlock,
} from '../../admin/menu/AdminMenuStyles';

import { UserOrder } from './UserOrdersStyles';
import { LoginButton } from '@/app/components/auth/AuthStyles';
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

export default function UserOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);

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
    let isMounted = true;

    const fetchOrders = async () => {
      setLoading(true);

      const user = await getCurrentUser();
      if (!isMounted) return;

      if (!user) {
        setIsAuthorized(false);
        setLoading(false);
        router.push('/login');
        return;
      }

      setIsAuthorized(true);

      const { data: ordersData, error } = await fetchOrdersWithItemsByUser(user.id);
      if (!isMounted) return;

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setOrders(ordersData || []);
      setLoading(false);
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const calcTotal = (items: OrderItemType[]) =>
    items.reduce((sum, item) => {
      const price = item.price_at_time ?? item.menu_items?.price ?? 0;
      const qty = item.quantity ?? 1;
      return sum + price * qty;
    }, 0);

  if (!loading && !isAuthorized) return null;

  return (
    <>
      <Header />
      <Wrapper>
        <TitleBlock>
          <Title>Ваши заказы</Title>
        </TitleBlock>

        {loading ? (
          <Description>Загрузка...</Description>
        ) : orders.length === 0 ? (
          <Description>У вас пока нет заказов</Description>
        ) : (
          <MenuList>
            {orders.map((order) => (
              <UserOrder key={order.id}>
                <Subtitle>Заказ №{order.id.slice(0, 3)}</Subtitle>
                <Description>Дата: {order.created_at.split('T')[0]}</Description>
                <Description>Тип: {order.type === 'delivery' ? 'Доставка' : 'В ресторане'}</Description>
                <Description className={styles.deliveryLine}>
                  Адрес: {formatDeliveryAddress(order.delivery_address ?? null)}
                </Description>
                <Description>
                  Статус:{' '}
                  <span className={`${styles.status} ${getStatusClassName(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </Description>

                <Description>Позиции:</Description>

                {order.items.length === 0 ? (
                  <Description>Нет позиций</Description>
                ) : (
                  order.items.map((item) => (
                    <div key={item.id} className={styles.orderItem}>
                      <Description>
                        • {item.menu_items?.name ?? 'Товар'} x{item.quantity ?? 1} -{' '}
                        {item.price_at_time ?? item.menu_items?.price ?? 0} ₽
                      </Description>
                    </div>
                  ))
                )}

                <Description>
                  Сумма заказа: <b>{calcTotal(order.items)} ₽</b>
                </Description>

                <LoginButton className={styles.supportButton}>
                  Написать в поддержку
                </LoginButton>
              </UserOrder>
            ))}
          </MenuList>
        )}
      </Wrapper>
      <Footer />
    </>
  );
}
