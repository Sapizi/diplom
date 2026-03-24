'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import { Wrapper } from "@/app/components/Header/HeaderStyles";
import { Title } from "@/app/MainPageStyles";
import { Subtitle, TitleBlock } from "../../admin/menu/AdminMenuStyles";
import { LoginButton } from "@/app/components/auth/AuthStyles";
import { getCurrentUser, getSession } from "@/app/api/client/auth";
import { fetchUserBonusPoints } from "@/app/api/client/profiles";
import { createYooKassaPayment } from "@/app/api/client/payments";
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
} from "./CartStyles";
import styles from "./page.module.scss";

type CartItemType = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
};

export default function Cart() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [userBonuses, setUserBonuses] = useState(0);
  const [useBonuses, setUseBonuses] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const cartRaw = localStorage.getItem("cart");
    if (cartRaw) setCart(JSON.parse(cartRaw));

    getCurrentUser().then((user) => {
      if (!user) {
        setIsAuthChecked(true);
        router.push("/login");
        return;
      }

      fetchUserBonusPoints(user.id).then(({ data: profile }) => {
        if (profile) setUserBonuses(profile.bonus_points ?? 0);
      });

      setIsAuthChecked(true);
    });
  }, [router]);

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      const updated = prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0);
      localStorage.setItem("cart", JSON.stringify(updated));
      return updated;
    });
  };

  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const bonusesToSpend = useMemo(() => {
    if (!useBonuses) return 0;
    return Math.min(userBonuses, totalPrice);
  }, [useBonuses, userBonuses, totalPrice]);

  const finalPrice = totalPrice - bonusesToSpend;
  const bonusEarned = useMemo(() => Math.floor(totalPrice * 0.1), [totalPrice]);

  if (!isAuthChecked) return null;

  const handlePayment = async () => {
    if (finalPrice <= 0) return;

    const user = await getCurrentUser();
    const {
      data: { session },
    } = await getSession();

    if (!user || !session?.access_token) {
      alert("Нужно войти в аккаунт");
      return;
    }

    const cartPayload = cart.map((item) => ({
      id: item.id,
      price: item.price,
      quantity: item.quantity,
    }));

    const data = await createYooKassaPayment(finalPrice, cartPayload, session.access_token, user.id);

    if (data.paymentId && data.orderId) {
      localStorage.setItem(
        "pending_payment",
        JSON.stringify({ paymentId: data.paymentId, orderId: data.orderId }),
      );
    }

    if (data.confirmationUrl) {
      window.location.href = data.confirmationUrl;
    } else {
      alert("Ошибка оплаты");
    }
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
                  <CartItemImg src={item.image_url || "/TestRecImg.svg"} />
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

            {!useBonuses && bonusEarned > 0 && (
              <BonusRow className={styles.bonusHint}>
                <span>Начислим вам {bonusEarned} бонусов</span>
              </BonusRow>
            )}

            <LoginButton className={styles.payButton} onClick={handlePayment}>
              Оплатить
            </LoginButton>
          </CartSummary>
        </CartContainer>
      </Wrapper>
      <Footer />
    </>
  );
}
