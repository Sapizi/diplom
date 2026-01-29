'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchAllOrdersWithItems, updateOrderStatus } from "@/app/api/client/orders"
import { getSession, onAuthStateChange } from "@/app/api/client/auth"
import { getIsAdmin } from "@/app/api/client/profiles"
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
  status?: string
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
  const router = useRouter()
  const [orders, setOrders] = useState<OrderType[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

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
    return '??????'
  }

  const getStatusColor = (status?: string) => {
    const key = resolveStatusKey(status)
    if (key === 'accepted') return '#9E9E9E'
    if (key === 'in_progress') return '#F28C28'
    if (key === 'ready') return '#2E7D32'
    return '#9E9E9E'
  }

  const fetchOrders = async () => {
    setLoading(true)

    // 1. Получаем все заказы
    const { data: ordersData, error: ordersError } = await fetchAllOrdersWithItems()

    if (ordersError) {
      console.error(ordersError)
      setLoading(false)
      return
    }

    setOrders((ordersData as OrderType[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    let isMounted = true
    let unsubscribe: null | (() => void) = null

    const checkAdmin = async (session: any) => {
      const { data: profile, error: profileError } = await getIsAdmin(session.user.id)

      if (!isMounted) return

      if (profileError || !profile?.isAdmin) {
        setIsChecking(false)
        router.push('/')
        return
      }

      setIsReady(true)
      setIsChecking(false)
    }

    const init = async () => {
      const { data: { session }, error } = await getSession()

      if (session) {
        await checkAdmin(session)
        return
      }

      if (error) {
        setIsChecking(false)
        router.push('/pages/login')
        return
      }

      const { data: authListener } = onAuthStateChange(async (_event, nextSession) => {
        if (!isMounted) return
        if (nextSession) {
          await checkAdmin(nextSession)
        } else {
          setIsChecking(false)
          router.push('/pages/login')
        }
      })

      unsubscribe = () => authListener.subscription.unsubscribe()
    }

    init()

    return () => {
      isMounted = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [router])

  useEffect(() => {
    if (!isReady) return
    fetchOrders()
  }, [isReady])

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId)
    const { error } = await updateOrderStatus(orderId, nextStatus)
    if (error) {
      console.error(error)
      alert(error.message ?? 'Failed to update order status')
      setUpdatingId(null)
      return
    }
    setOrders(prev =>
      prev.map(order => (order.id === orderId ? { ...order, status: nextStatus } : order))
    )
    setUpdatingId(null)
  }

  if (isChecking) return <p>Loading...</p>

  return (
    <>
      <Header/>
      <Wrapper>
        <TitleBlock>
          <Title>Все заказы</Title>
          <div style={{ marginTop: 12 }}>
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Поиск по ID заказа"
              style={{
                width: 320,
                height: 40,
                padding: '0 12px',
                border: '1px solid #ddd',
                borderRadius: 8
              }}
            />
          </div>
        </TitleBlock>

        {loading ? (
          <Description>Загрузка...</Description>
        ) : orders.length === 0 ? (
          <Description>Заказов нет</Description>
        ) : (
          orders
            .filter(order =>
              searchTerm
                ? order.id.toLowerCase().includes(searchTerm.toLowerCase())
                : true
            )
            .map(order => (
            <div key={order.id} style={{ borderBottom: '1px solid #ccc', padding: '10px 0' }}>
              <Description>ID заказа: {order.id}</Description>
              <Description>Пользователь ID: {order.user_id}</Description>
              <Description>Дата: {order.created_at.split('T')[0]}</Description>
              <div style={{ marginTop: 6, marginBottom: 6, display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ color: getStatusColor(order.status), fontWeight: 600 }}>
                  {getStatusLabel(order.status)}
                </span>
                <select
                  value={resolveStatusKey(order.status)}
                  onChange={e => handleStatusChange(order.id, e.target.value)}
                  disabled={updatingId === order.id}
                  style={{ height: 32, borderRadius: 6, border: '1px solid #ddd', padding: '0 8px' }}
                >
                  <option value="accepted">Принят</option>
                  <option value="in_progress">В работе</option>
                  <option value="ready">Готов</option>
                </select>
              </div>
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