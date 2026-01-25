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
  const [message, setMessage] = useState('\u041f\u0440\u043e\u0432\u0435\u0440\u044f\u0435\u043c \u043e\u043f\u043b\u0430\u0442\u0443...')
  const [details, setDetails] = useState<string | null>(null)

  useEffect(() => {
    let attempts = 0
    const maxAttempts = 8
    const intervalMs = 2000

    const confirmPayment = async () => {
      const pendingRaw = localStorage.getItem('pending_payment')
      if (!pendingRaw) {
        setStatus('failed')
        setMessage('\u041d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d \u043f\u043b\u0430\u0442\u0435\u0436 \u0434\u043b\u044f \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u044f')
        return true
      }

      const pending = JSON.parse(pendingRaw) as { paymentId?: string; orderId?: string }
      if (!pending.paymentId) {
        setStatus('failed')
        setMessage('\u041d\u0435\u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0435 \u0434\u0430\u043d\u043d\u044b\u0435 \u043f\u043b\u0430\u0442\u0435\u0436\u0430')
        return true
      }

      const { data: { session } } = await getSession()
      if (!session?.access_token) {
        setStatus('failed')
        setMessage('\u041d\u0443\u0436\u043d\u043e \u0432\u043e\u0439\u0442\u0438 \u0432 \u0430\u043a\u043a\u0430\u0443\u043d\u0442')
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
        setMessage('\u041e\u043f\u043b\u0430\u0442\u0430 \u043f\u0440\u043e\u0448\u043b\u0430 \u0443\u0441\u043f\u0435\u0448\u043d\u043e. \u0417\u0430\u043a\u0430\u0437 \u043f\u043e\u044f\u0432\u0438\u0442\u0441\u044f \u0432 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0435.')
        return true
      }

      if (result?.status === 'canceled') {
        setStatus('failed')
        setMessage('\u041f\u043b\u0430\u0442\u0435\u0436 \u043e\u0442\u043c\u0435\u043d\u0435\u043d')
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
        setMessage('\u041e\u043f\u043b\u0430\u0442\u0430 \u0435\u0449\u0435 \u043d\u0435 \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0430. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u043e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0443 \u043f\u043e\u0437\u0436\u0435.')
        return
      }

      setStatus('loading')
      setMessage('\u041e\u0436\u0438\u0434\u0430\u0435\u043c \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u044f \u043e\u043f\u043b\u0430\u0442\u044b...')
      setTimeout(tick, intervalMs)
    }

    tick()
  }, [])

  return (
    <>
      <Header />
      <Wrapper>
        <Title>\u0421\u0442\u0430\u0442\u0443\u0441 \u043e\u043f\u043b\u0430\u0442\u044b</Title>
        <div style={{ marginTop: 20, fontSize: 18 }}>
          {message}
        </div>
        {details && (
          <div style={{ marginTop: 8, fontSize: 14, color: '#666' }}>
            {details}
          </div>
        )}
        {status === 'success' && (
          <div style={{ marginTop: 12 }}>
            <a href="/pages/user/orders">\u041f\u0435\u0440\u0435\u0439\u0442\u0438 \u0432 \u0437\u0430\u043a\u0430\u0437\u044b</a>
          </div>
        )}
      </Wrapper>
      <Footer />
    </>
  )
}
