'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/app/api/client/auth'
import { fetchOrdersWithItemsByUser } from '@/app/api/client/orders'

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
import { LoginButton } from '@/app/components/auth/AuthStyles'

/* ===================== TYPES ===================== */

type OrderItemType = {
  id: string
  quantity?: number
  price_at_time?: number | null
  menu_items: {
    id: string
    name: string
    price: number
  } | null
}

type OrderType = {
  id: string
  created_at: string
  status?: string
  items: OrderItemType[]
}

/* ===================== COMPONENT ===================== */

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<OrderType[]>([])
  const [loading, setLoading] = useState(true)

  const resolveStatusKey = (status?: string) => {
    if (!status || status === 'paid') return 'accepted'
    if (status === 'accepted' || status === 'in_progress' || status === 'ready') return status
    return 'accepted'
  }

  const getStatusLabel = (status?: string) => {
    const key = resolveStatusKey(status)
    if (key === 'accepted') return 'Принят'
    if (key === 'in_progress') return 'В работе'
    if (key === 'ready') return 'Готов'
    return 'Принят'
  }

  const getStatusColor = (status?: string) => {
    const key = resolveStatusKey(status)
    if (key === 'accepted') return '#9E9E9E'
    if (key === 'in_progress') return '#F28C28'
    if (key === 'ready') return '#2E7D32'
    return '#9E9E9E'
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)

    const user = await getCurrentUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data: ordersData, error } = await fetchOrdersWithItemsByUser(user.id)

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    setOrders((ordersData as OrderType[]) || [])
    setLoading(false)
  }

  const calcTotal = (items: OrderItemType[]) =>
    items.reduce((sum, item) => {
      const price = item.price_at_time ?? item.menu_items?.price ?? 0
      const qty = item.quantity ?? 1
      return sum + price * qty
    }, 0)

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
                <Description>Статус: <span style={{ color: getStatusColor(order.status), fontWeight: 600 }}>{getStatusLabel(order.status)}</span></Description>

                <Description>Позиции:</Description>

                {order.items.length === 0 ? (
                  <Description>Нет позиций</Description>
                ) : (
                  order.items.map((item) => (
                    <div key={item.id} style={{ paddingLeft: 15 }}>
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
