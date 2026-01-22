'use client'

import { useEffect, useState, useMemo } from 'react'
import Header from '@/app/components/Header/Header'
import Footer from '@/app/components/Footer/Footer'
import { Wrapper } from '@/app/components/Header/HeaderStyles'
import { Title } from '@/app/MainPageStyles'
import { Subtitle, TitleBlock } from '../../admin/menu/AdminMenuStyles'
import { LoginButton } from '../../registration/RegistrationStyles'
import { supabase } from '../../../../../lib/supabase'
import {
  CartContainer,
  CartDesc,
  CartItem,
  CartItemImg,
  CartList,
  CartQuantity,
  CartSummary,
  BonusRow,
  BonusToggle
} from './CartStyles'

type CartItemType = {
  id: string
  name: string
  price: number
  image_url: string | null
  quantity: number
}

export default function Cart() {
  const [cart, setCart] = useState<CartItemType[]>([])
  const [userBonuses, setUserBonuses] = useState(0)
  const [useBonuses, setUseBonuses] = useState(false)

  // --- Загрузка корзины и бонусов ---
  useEffect(() => {
    const cartRaw = localStorage.getItem('cart')
    if (cartRaw) setCart(JSON.parse(cartRaw))

    // подгружаем бонусы текущего пользователя
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase
        .from('profiles')
        .select('bonus_points')
        .eq('id', data.user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile) setUserBonuses(profile.bonus_points ?? 0)
        })
    })
  }, [])

  // --- Изменение количества ---
  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const updated = prev
        .map(item =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter(item => item.quantity > 0)
      localStorage.setItem('cart', JSON.stringify(updated))
      return updated
    })
  }

  // --- Вычисление суммы ---
  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  )

  const bonusesToSpend = useMemo(() => {
    if (!useBonuses) return 0
    return Math.min(userBonuses, totalPrice)
  }, [useBonuses, userBonuses, totalPrice])

  const finalPrice = totalPrice - bonusesToSpend

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
              cart.map(item => (
                <CartItem key={item.id}>
                  <CartItemImg src={item.image_url || '/TestRecImg.svg'} />
                  <CartDesc>
                    <Subtitle style={{ fontSize: 20 }}>{item.name}</Subtitle>
                    <Subtitle style={{ fontSize: 18, fontWeight: 500 }}>
                      {item.price * item.quantity} ₽
                    </Subtitle>
                    <CartQuantity>
                      <LoginButton
                        style={{ margin: 0 }}
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        −
                      </LoginButton>
                      <span>{item.quantity}</span>
                      <LoginButton
                        style={{ margin: 0 }}
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
            <Subtitle style={{ fontSize: 24 }}>Ваш заказ</Subtitle>

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
                  onChange={() => setUseBonuses(prev => !prev)}
                  disabled={userBonuses === 0}
                />
                <span>{bonusesToSpend} ₽</span>
              </BonusToggle>
            </BonusRow>
{/*  */}
            <BonusRow style={{ fontWeight: 600 }}>
              <span>Итого</span>
              <span>{finalPrice} ₽</span>
            </BonusRow>

            <LoginButton style={{ width: '100%', marginTop: 20 }}>
              Оплатить
            </LoginButton>
          </CartSummary>
        </CartContainer>
      </Wrapper>
      <Footer />
    </>
  )
}
