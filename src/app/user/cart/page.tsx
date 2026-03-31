'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { readCart, setCartItemQuantity, subscribeCart, type CartItem as CartStorageItem } from '@/app/api/client/cart';
import Header from '@/app/components/Header/Header';
import Footer from '@/app/components/Footer/Footer';
import { Wrapper } from '@/app/components/Header/HeaderStyles';
import { Title } from '@/app/MainPageStyles';
import { Subtitle, TitleBlock } from '../../admin/menu/AdminMenuStyles';
import { LoginButton } from '@/app/components/auth/AuthStyles';
import AddressBook from '@/app/components/AddressBook/AddressBook';
import { getCurrentUser, getSession } from '@/app/api/client/auth';
import {
  formatAddressTitle,
  type DeliveryAddress,
} from '@/app/api/client/addresses';
import { fetchUserBonusPoints } from '@/app/api/client/profiles';
import { createYooKassaPayment } from '@/app/api/client/payments';
import {
  BonusRow,
  BonusToggle,
  CartContainer,
  CartDesc,
  CartItem,
  CartItemImg,
  CartList,
  CartQuantity,
  CartSummary,
} from './CartStyles';
import styles from './page.module.scss';

type CartItemType = CartStorageItem;

type OrderType = 'restaurant' | 'delivery';

export default function Cart() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userBonuses, setUserBonuses] = useState(0);
  const [useBonuses, setUseBonuses] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('restaurant');
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const syncCart = () => {
      setCart(readCart());
    };

    syncCart();

    getCurrentUser().then((user) => {
      if (!user) {
        setIsAuthChecked(true);
        router.push('/login');
        return;
      }

      setUserId(user.id);

      fetchUserBonusPoints(user.id).then(({ data: profile }) => {
        if (profile) {
          setUserBonuses(profile.bonus_points ?? 0);
        }
      });

      setIsAuthChecked(true);
    });

    return subscribeCart(syncCart);
  }, [router]);

  const updateQuantity = (id: string, delta: number) => {
    const currentItem = cart.find((item) => item.id === id);
    if (!currentItem) {
      return;
    }

    const nextQuantity = currentItem.quantity + delta;
    setCart(
      setCartItemQuantity(
        {
          id: currentItem.id,
          name: currentItem.name,
          price: currentItem.price,
          image_url: currentItem.image_url,
        },
        nextQuantity
      )
    );
  };

  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const bonusesToSpend = useMemo(() => {
    if (!useBonuses) {
      return 0;
    }

    return Math.min(userBonuses, totalPrice);
  }, [useBonuses, userBonuses, totalPrice]);

  const finalPrice = totalPrice - bonusesToSpend;
  const bonusEarned = useMemo(() => Math.floor(totalPrice * 0.1), [totalPrice]);

  const selectedAddressLabel = selectedAddress ? formatAddressTitle(selectedAddress) : 'Адрес не выбран';

  if (!isAuthChecked) {
    return null;
  }

  const handlePayment = async () => {
    if (finalPrice <= 0 || cart.length === 0 || isSubmitting) {
      return;
    }

    if (orderType === 'delivery' && !selectedAddress) {
      alert('Выберите адрес доставки перед оплатой.');
      return;
    }

    setIsSubmitting(true);

    const user = await getCurrentUser();
    const {
      data: { session },
    } = await getSession();

    if (!user || !session?.access_token) {
      setIsSubmitting(false);
      alert('Нужно войти в аккаунт');
      return;
    }

    const cartPayload = cart.map((item) => ({
      id: item.id,
      price: item.price,
      quantity: item.quantity,
    }));

    const data = await createYooKassaPayment(
      finalPrice,
      cartPayload,
      session.access_token,
      user.id,
      {
        type: orderType,
        deliveryAddress:
          orderType === 'delivery' && selectedAddress
            ? {
                id: selectedAddress.id,
                city: selectedAddress.city,
                street: selectedAddress.street,
                house: selectedAddress.house,
                entrance: selectedAddress.entrance,
                apartment: selectedAddress.apartment,
                floor: selectedAddress.floor,
                comment: selectedAddress.comment,
                latitude: selectedAddress.latitude,
                longitude: selectedAddress.longitude,
              }
            : null,
      }
    );

    if (data.paymentId && data.orderId) {
      localStorage.setItem(
        'pending_payment',
        JSON.stringify({
          paymentId: data.paymentId,
          orderId: data.orderId,
          orderType,
          deliveryAddress: selectedAddress,
        })
      );
    }

    if (data.confirmationUrl) {
      window.location.href = data.confirmationUrl;
      return;
    }

    setIsSubmitting(false);
    alert(data?.error ?? 'Ошибка оплаты');
  };

  return (
    <>
      <Header />
      <Wrapper>
        <TitleBlock>
          <Title>Корзина</Title>
        </TitleBlock>

        <CartContainer>
          <CartList>
            {cart.length === 0 ? (
              <Subtitle>Корзина пуста</Subtitle>
            ) : (
              cart.map((item) => (
                <CartItem key={item.id}>
                  <CartItemImg src={item.image_url || '/TestRecImg.svg'} />
                  <CartDesc>
                    <Subtitle className={styles.itemName}>{item.name}</Subtitle>
                    <Subtitle className={styles.itemTotal}>{item.price * item.quantity} ₽</Subtitle>
                    <CartQuantity>
                      <LoginButton
                        className={styles.quantityButton}
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        −
                      </LoginButton>
                      <span>{item.quantity}</span>
                      <LoginButton
                        className={styles.quantityButton}
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        +
                      </LoginButton>
                    </CartQuantity>
                  </CartDesc>
                </CartItem>
              ))
            )}
          </CartList>

          <CartSummary>
            <Subtitle className={styles.summaryTitle}>Ваш заказ</Subtitle>

            <div className={styles.fulfillmentBlock}>
              <p className={styles.blockTitle}>Способ получения</p>

              <div className={styles.fulfillmentSwitch}>
                <button
                  type="button"
                  className={`${styles.fulfillmentButton} ${
                    orderType === 'restaurant' ? styles.fulfillmentButtonActive : ''
                  }`}
                  onClick={() => setOrderType('restaurant')}
                >
                  В ресторане
                </button>

                <button
                  type="button"
                  className={`${styles.fulfillmentButton} ${
                    orderType === 'delivery' ? styles.fulfillmentButtonActive : ''
                  }`}
                  onClick={() => setOrderType('delivery')}
                >
                  Доставка
                </button>
              </div>

              {orderType === 'restaurant' ? (
                <p className={styles.orderTypeHint}>
                  Самовывоз. Адрес не нужен, заказ будет ждать вас в ресторане.
                </p>
              ) : userId ? (
                <div className={styles.addressSection}>
                  <div className={styles.addressSummary}>
                    <span className={styles.addressSummaryLabel}>Текущий адрес</span>
                    <span className={styles.addressSummaryValue}>{selectedAddressLabel}</span>
                  </div>

                  <AddressBook
                    compact
                    userId={userId}
                    title="Выберите адрес"
                    description="Можно выбрать сохраненный адрес, добавить новый вручную или отметить дом на карте."
                    selectedAddressId={selectedAddress?.id ?? null}
                    onSelectAddress={setSelectedAddress}
                  />
                </div>
              ) : null}
            </div>

            <BonusRow>
              <span>Все позиции</span>
              <span>{totalPrice} ₽</span>
            </BonusRow>

            <BonusRow>
              <span>Списать все баллы</span>
              <BonusToggle>
                <input
                  type="checkbox"
                  checked={useBonuses}
                  onChange={() => setUseBonuses((prev) => !prev)}
                  disabled={userBonuses === 0}
                />
                <span>{bonusesToSpend} ₽</span>
              </BonusToggle>
            </BonusRow>

            <BonusRow className={styles.summaryTotal}>
              <span>Итого</span>
              <span>{finalPrice} ₽</span>
            </BonusRow>

            {!useBonuses && bonusEarned > 0 ? (
              <BonusRow className={styles.bonusHint}>
                <span>Начислим вам {bonusEarned} бонусов</span>
              </BonusRow>
            ) : null}

            <LoginButton className={styles.payButton} onClick={handlePayment}>
              {isSubmitting ? 'Переходим к оплате...' : 'Оплатить'}
            </LoginButton>
          </CartSummary>
        </CartContainer>
      </Wrapper>
      <Footer />
    </>
  );
}
