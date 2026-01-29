'use client'

import { useEffect, useState } from 'react'
import Header from '@/app/components/Header/Header'
import Footer from '@/app/components/Footer/Footer'
import { Wrapper } from '@/app/components/Header/HeaderStyles'
import { Title } from '@/app/MainPageStyles'
import { confirmYooKassaPayment } from '@/app/api/client/payments'
import { getSession } from '@/app/api/client/auth'

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('Проверяем оплату...')
  const [details, setDetails] = useState<string | null>(null)

  useEffect(() => {
    let attempts = 0
    const maxAttempts = 8
    const intervalMs = 2000

    const confirmPayment = async () => {
      const pendingRaw = localStorage.getItem('pending_payment')
      if (!pendingRaw) {
        setStatus('failed')
        setMessage('Не найден платеж для подтверждения')
        return true
      }

      const pending = JSON.parse(pendingRaw) as { paymentId?: string; orderId?: string }
      if (!pending.paymentId) {
        setStatus('failed')
        setMessage('Некорректные данные платежа')
        return true
      }

      const { data: { session } } = await getSession()
      if (!session?.access_token) {
        setStatus('failed')
        setMessage('Нужно войти в аккаунт')
        return true
      }

      const result = await confirmYooKassaPayment(pending.paymentId, session.access_token)
      if (result?.error) {
        setDetails(`error: ${result.error}, statusCode: ${result.statusCode ?? 'unknown'}`)
        return false
      }
      setDetails(`status: ${result?.status ?? 'unknown'}, paid: ${result?.paid ?? 'unknown'}`)

      if (result?.paid && result?.status === 'succeeded') {
        localStorage.removeItem('cart')
        localStorage.removeItem('pending_payment')
        setStatus('success')
        setMessage('Оплата прошла успешно. Заказ появится в аккаунте.')
        return true
      }

      if (result?.status === 'canceled') {
        setStatus('failed')
        setMessage('Платеж отменен')
        return true
      }

      return false
    }

    const tick = async () => {
      const done = await confirmPayment()
      if (done) return

      attempts += 1
      if (attempts >= maxAttempts) {
        setStatus('failed')
        setMessage('Оплата еще не подтверждена. Попробуйте обновить страницу позже.')
        return
      }

      setStatus('loading')
      setMessage('Ожидаем подтверждения оплаты...')
      setTimeout(tick, intervalMs)
    }

    tick()
  }, [])

  return (
    <>
      <Header />
      <Wrapper>
        <Title>Статус оплаты</Title>
        <div style={{ marginTop: 20, fontSize: 18,  }}>
          {message}
        </div>
        {details && (
          <div style={{ marginTop: 8, fontSize: 14, color: '#666' }}>
            {details}
          </div>
        )}
        {status === 'success' && (
          <div style={{ marginTop: 12 , marginBottom:580}}>
            <a href="/user/orders">Перейти в заказы</a>
          </div>
        )}
      </Wrapper>
      <Footer />
    </>
  )
}
