import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function createServiceSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role key')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })
}

function isAuthorized(req: Request) {
  const secret = process.env.YOOKASSA_WEBHOOK_SECRET
  if (!secret) return true

  const header = req.headers.get('authorization')
  const xSecret = req.headers.get('x-webhook-secret')

  if (header === secret) return true
  if (header === `Bearer ${secret}`) return true
  if (header === `Token ${secret}`) return true
  if (header === `Api-Key ${secret}`) return true
  if (xSecret === secret) return true

  return false
}

type YooKassaNotification = {
  event?: string
  object?: {
    id?: string
    status?: string
    paid?: boolean
    amount?: { value?: string; currency?: string }
  }
}

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = (await req.json()) as YooKassaNotification
    const event = payload.event
    const payment = payload.object
    const paymentId = payment?.id

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment id' }, { status: 400 })
    }

    const supabase = createServiceSupabase()

    const status = payment?.status ?? (event?.includes('canceled') ? 'canceled' : undefined)
    const paid = payment?.paid ?? (event?.includes('succeeded') ? true : undefined)
    const amountValue = payment?.amount?.value ? Number(payment.amount.value) : undefined
    const currency = payment?.amount?.currency

    const { data: paymentRow, error: paymentUpdateError } = await supabase
      .from('payments')
      .update({
        status: status ?? null,
        paid: typeof paid === 'boolean' ? paid : null,
        amount: amountValue ?? null,
        currency: currency ?? null
      })
      .eq('yookassa_payment_id', paymentId)
      .select('order_id')
      .single()

    if (paymentUpdateError || !paymentRow) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (paid === true || event === 'payment.succeeded') {
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', paymentRow.order_id)

      if (orderUpdateError) {
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
      }
    }

    if (event === 'payment.canceled' || status === 'canceled') {
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ status: 'canceled' })
        .eq('id', paymentRow.order_id)

      if (orderUpdateError) {
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
