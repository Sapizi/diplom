import { NextResponse } from 'next/server'
import YooKassa from 'yookassa'
import { createClient } from '@supabase/supabase-js'

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

export async function POST(req: Request) {
  try {
    const { paymentId, accessToken } = await req.json()

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment id' }, { status: 400 })
    }

    const payment = await (yooKassa as any).getPayment(paymentId)
    const supabase = supabaseServiceKey
      ? createServiceSupabase()
      : accessToken
        ? createAuthedSupabase(accessToken)
        : null

    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: paymentRow, error: paymentUpdateError } = await supabase
      .from('payments')
      .update({
        status: payment.status,
        paid: payment.paid ?? false
      })
      .eq('yookassa_payment_id', paymentId)
      .select('order_id')
      .single()

    if (paymentUpdateError || !paymentRow) {
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
    }

    if (payment.status === 'succeeded' && payment.paid === true) {
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', paymentRow.order_id)

      if (orderUpdateError) {
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
      }
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
