'use client'

import { useEffect, useState } from "react"
import { fetchAllOrders, fetchOrderItems } from "@/app/api/client/orders"
import Footer from "@/app/components/Footer/Footer";
import Header from "@/app/components/Header/Header";
import { Wrapper } from "@/app/components/Header/HeaderStyles";
import { TitleBlock } from "../menu/AdminMenuStyles";
import { Title } from "@/app/MainPageStyles";
import { Description } from "../menu/AdminMenuStyles";

type OrderType = {
  id: string
  user_id: string
  created_at: string
  items: {
    id: string
    quantity?: number
    price_at_time?: number | null
    menu_items: {
      id: string
      name: string
      price: number
    }
  }[]
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    setLoading(true)

    // 1. Получаем все заказы
    const { data: ordersData, error: ordersError } = await fetchAllOrders()

    if (ordersError) {
      console.error(ordersError)
      setLoading(false)
      return
    }

    // 2. Для каждого заказа подтягиваем позиции с menu_items
    const ordersWithItems: OrderType[] = await Promise.all(
  (ordersData || []).map(async order => {
    const { data: itemsData, error: itemsError } = await fetchOrderItems(order.id)

    if (itemsError) {
      console.error(itemsError)
      return { ...order, items: [] } as OrderType
    }

    // Приводим типы вручную
    const formattedItems = (itemsData || []).map((item: any) => ({
      id: String(item.id),
      quantity: Number(item.quantity ?? 1),
      price_at_time: item.price_at_time != null ? Number(item.price_at_time) : null,
      menu_items: {
        id: String(item.menu_items.id),
        name: String(item.menu_items.name),
        price: Number(item.menu_items.price),
      },
    }))

    return {
      id: String(order.id),
      user_id: String(order.user_id),
      created_at: String(order.created_at),
      items: formattedItems,
    }
  })
)


    setOrders(ordersWithItems)
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  return (
    <>
      <Header/>
      <Wrapper>
        <TitleBlock>
          <Title>Все заказы</Title>
        </TitleBlock>

        {loading ? (
          <Description>Загрузка...</Description>
        ) : orders.length === 0 ? (
          <Description>Заказов нет</Description>
        ) : (
          orders.map(order => (
            <div key={order.id} style={{ borderBottom: '1px solid #ccc', padding: '10px 0' }}>
              <Description>ID заказа: {order.id}</Description>
              <Description>Пользователь ID: {order.user_id}</Description>
              <Description>Дата: {order.created_at.split('T')[0]}</Description>
              <Description>Позиции:</Description>
              {order.items.length === 0 ? (
                <Description>Нет позиций</Description>
              ) : (
                order.items.map(item => (
                  <div key={item.id} style={{ paddingLeft: '15px' }}>
                    <Description>• {item.menu_items.name} x{item.quantity ?? 1} — {item.price_at_time ?? item.menu_items.price} ₽</Description>
                  </div>
                ))
              )}
            </div>
          ))
        )}
      </Wrapper>
      <Footer/>
    </>
  )
}
