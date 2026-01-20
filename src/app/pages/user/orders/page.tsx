'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../../../lib/supabase'

import Header from '@/app/components/Header/Header'
import Footer from '@/app/components/Footer/Footer'
import { Wrapper } from '@/app/components/Header/HeaderStyles'
import { Title } from '@/app/MainPageStyles'

import {
  Description,
  MenuList,
  Subtitle,
  TitleBlock
} from '../../admin/menu/AdminMenuStyles'

import { UserOrder } from './UserOrdersStyles'
import { LoginButton } from '../../registration/RegistrationStyles'

/* ===================== TYPES ===================== */

type OrderItemType = {
  id: string
  menu_items: {
    id: string
    name: string
    price: number
  } | null
}

type OrderType = {
  id: string
  created_at: string
  items: OrderItemType[]
}

/* ===================== COMPONENT ===================== */

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<OrderType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    const ordersWithItems: OrderType[] = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select(`
            id,
            menu_items (
              id,
              name,
              price
            )
          `)
          .eq('order_id', order.id)

        return {
          ...order,
          items: (itemsData as unknown as OrderItemType[]) ?? []
        }
      })
    )

    setOrders(ordersWithItems)
    setLoading(false)
  }

  const calcTotal = (items: OrderItemType[]) =>
    items.reduce((sum, item) => sum + (item.menu_items?.price ?? 0), 0)

  /* ===================== RENDER ===================== */

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
                <Description>
                  Дата: {order.created_at.split('T')[0]}
                </Description>

                <Description>Позиции:</Description>

                {order.items.length === 0 ? (
                  <Description>Нет позиций</Description>
                ) : (
                  order.items.map((item) => (
                    <div key={item.id} style={{ paddingLeft: 15 }}>
                      <Description>
                        • {item.menu_items?.name ?? 'Товар'} —{' '}
                        {item.menu_items?.price ?? 0} ₽
                      </Description>
                    </div>
                  ))
                )}

                <Description>
                  Сумма заказа: <b>{calcTotal(order.items)} ₽</b>
                </Description>

                <LoginButton style={{ marginTop: 10 }}>
                  Написать в поддержку
                </LoginButton>
              </UserOrder>
            ))}
          </MenuList>
        )}
      </Wrapper>

      <Footer />
    </>
  )
}
