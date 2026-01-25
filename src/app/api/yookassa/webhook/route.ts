import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

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

async function applyBonusUpdates(supabase: SupabaseClient, orderId: string) {
  const bonusSupabase = supabaseServiceKey ? createServiceSupabase() : supabase
  const { data: order, error: orderError } = await bonusSupabase
    .from('orders')
    .select('id, user_id, total_amount, bonus_applied')
    .eq('id', orderId)
    .single()

  if (orderError || !order?.user_id) {
    console.error('Bonus update: failed to load order', orderError)
    return
  }

  if (order.bonus_applied) {
    console.log('Bonus update: already applied, skip', { orderId })
    return
  }

  const { data: items, error: itemsError } = await bonusSupabase
    .from('order_items')
    .select('quantity, price_at_time')
    .eq('order_id', orderId)

  if (itemsError || !items) {
    console.error('Bonus update: failed to load items', itemsError)
    return
  }

  const itemsTotal = items.reduce((sum, item) => {
    const price = Number(item.price_at_time ?? 0)
    const qty = Number(item.quantity ?? 0)
    return sum + price * qty
  }, 0)

  const orderTotal = Number(order.total_amount ?? 0)
  const diff = Number((itemsTotal - orderTotal).toFixed(2))

  const { data: profile, error: profileError } = await bonusSupabase
    .from('profiles')
    .select('bonus_points')
    .eq('id', order.user_id)
    .single()

  if (profileError) {
    console.error('Bonus update: failed to load profile', profileError)
    return
  }

  const currentPoints = Number(profile?.bonus_points ?? 0)

  if (diff > 0.01) {
    const spend = Math.round(diff)
    const next = Math.max(0, currentPoints - spend)
    const { error: spendError } = await bonusSupabase
      .from('profiles')
      .update({ bonus_points: next })
      .eq('id', order.user_id)
    if (spendError) {
      console.error('Bonus update: failed to spend bonuses', spendError)
      return
    }

    await bonusSupabase
      .from('orders')
      .update({ bonus_applied: true })
      .eq('id', order.id)
    return
  }

  const earned = Math.floor(orderTotal * 0.1)
  if (earned <= 0) return

  const { error: earnError } = await bonusSupabase
    .from('profiles')
    .update({ bonus_points: currentPoints + earned })
    .eq('id', order.user_id)
  if (earnError) {
    console.error('Bonus update: failed to начислить бонусы', earnError)
    return
  }

  await bonusSupabase
    .from('orders')
    .update({ bonus_applied: true })
    .eq('id', order.id)
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
    console.log('Webhook: received', {
      event: payload.event,
      paymentId: payload.object?.id,
      status: payload.object?.status,
      paid: payload.object?.paid
    })
    const event = payload.event
    const payment = payload.object
    const paymentId = payment?.id

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment id' }, { status: 400 })
    }

    const supabase = createServiceSupabase()

    const status = payment?.status ?? (event?.includes('canceled') ? 'canceled' : undefined)
    const paid = typeof payment?.paid === 'boolean'
      ? payment.paid
      : (status === 'succeeded' || event?.includes('succeeded') ? true : undefined)
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
      console.error('Webhook: failed to update payment', paymentUpdateError)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (paid === true || event === 'payment.succeeded') {
      console.log('Webhook: updating order to paid', { orderId: paymentRow.order_id })
      const { data: orderUpdate, error: orderUpdateError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', paymentRow.order_id)
        .neq('status', 'paid')
        .select('id')
        .maybeSingle()

      if (orderUpdateError) {
        console.error('Webhook: failed to update order', orderUpdateError)
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
      }

      console.log('Webhook: applying bonus updates', { orderId: paymentRow.order_id })
      await applyBonusUpdates(supabase, paymentRow.order_id)
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
