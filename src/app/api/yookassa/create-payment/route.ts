import { NextResponse } from 'next/server'
import YooKassa from 'yookassa'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

const yooKassa = new YooKassa({
  shopId: process.env.YOOKASSA_SHOP_ID!,
  secretKey: process.env.YOOKASSA_SECRET_KEY!
})

function resolveSiteUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000'
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl
  }
  return `https://${rawUrl}`
}

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

type CartItem = {
  id: string
  price: number
  quantity: number
}

export async function POST(req: Request) {
  try {
    const { amount, cartItems, accessToken, userId } = await req.json()

    if (!accessToken || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const totalAmount = Number(amount)

    if (!totalAmount || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const payment = await yooKassa.createPayment(
      {
        amount: {
          value: totalAmount.toFixed(2),
          currency: 'RUB'
        },
        confirmation: {
          type: 'redirect',
          return_url: `${resolveSiteUrl()}/pages/payment-success`
        },
        capture: true,
        description: '\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u0438\u0435 \u043e\u043f\u043b\u0430\u0442\u044b \u0437\u0430\u043a\u0430\u0437\u0430'
      },
      uuidv4()
    )

    const supabase = createAuthedSupabase(accessToken)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        status: 'pending',
        total_amount: totalAmount
      })
      .select('id')
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    const itemsToInsert = (cartItems as CartItem[]).map(item => ({
      order_id: order.id,
      menu_item_id: item.id,
      quantity: item.quantity,
      price_at_time: item.price
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert)

    if (itemsError) {
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
    }

    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        yookassa_payment_id: payment.id,
        status: payment.status,
        amount: totalAmount,
        currency: 'RUB',
        paid: (payment as any).paid ?? false
      })

    if (paymentError) {
      return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
    }

    return NextResponse.json({
      confirmationUrl: payment.confirmation.confirmation_url,
      paymentId: payment.id,
      orderId: order.id
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: '\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u043e\u0437\u0434\u0430\u043d\u0438\u044f \u043f\u043b\u0430\u0442\u0435\u0436\u0430' },
      { status: 500 }
    )
  }
}
