import { NextResponse } from 'next/server'
import YooKassa from 'yookassa'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const yooKassa = new YooKassa({
  shopId: process.env.YOOKASSA_SHOP_ID!,
  secretKey: process.env.YOOKASSA_SECRET_KEY!
})

function createAuthedSupabase(accessToken: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase env vars')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  })
}

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

export async function POST(req: Request) {
  try {
    const { paymentId, accessToken } = await req.json()
    console.log('Confirm payment: start', { paymentId, hasAccessToken: Boolean(accessToken) })

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment id' }, { status: 400 })
    }

    const payment = await (yooKassa as any).getPayment(paymentId)
    console.log('Confirm payment: YooKassa status', {
      status: payment?.status,
      paid: payment?.paid
    })
    const supabase = supabaseServiceKey
      ? createServiceSupabase()
      : accessToken
        ? createAuthedSupabase(accessToken)
        : null

    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const paidValue = typeof payment.paid === 'boolean'
      ? payment.paid
      : payment.status === 'succeeded'

    const { data: paymentRow, error: paymentUpdateError } = await supabase
      .from('payments')
      .update({
        status: payment.status,
        paid: paidValue
      })
      .eq('yookassa_payment_id', paymentId)
      .select('order_id')
      .single()

    if (paymentUpdateError || !paymentRow) {
      console.error('Confirm payment: failed to update payment', paymentUpdateError)
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
    }

    if (payment.status === 'succeeded' && paidValue) {
      console.log('Confirm payment: updating order to paid', { orderId: paymentRow.order_id })
      const { data: orderUpdate, error: orderUpdateError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', paymentRow.order_id)
        .neq('status', 'paid')
        .select('id')
        .maybeSingle()

      if (orderUpdateError) {
        console.error('Confirm payment: failed to update order', orderUpdateError)
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
      }

      console.log('Confirm payment: applying bonus updates', { orderId: paymentRow.order_id })
      await applyBonusUpdates(supabase, paymentRow.order_id)
    }

    if (payment.status === 'canceled') {
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ status: 'canceled' })
        .eq('id', paymentRow.order_id)

      if (orderUpdateError) {
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
      }
    }

    return NextResponse.json({
      status: payment.status,
      paid: payment.paid ?? false,
      orderId: paymentRow.order_id
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Payment confirmation failed' }, { status: 500 })
  }
}
