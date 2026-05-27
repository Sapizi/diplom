import { NextResponse } from 'next/server'
import YooKassa from 'yookassa'
import { v4 as uuidv4 } from 'uuid'
import { createServiceSupabase } from '@/app/api/server/supabaseService'

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

type CartItem = {
  id: string
  price: number
  quantity: number
}

type CheckoutPayload = {
  type?: 'restaurant' | 'delivery'
  deliveryAddress?: {
    id?: string
  } | null
}

type CreatePaymentBody = {
  amount?: number
  cartItems?: CartItem[]
  accessToken?: string
  userId?: string
  checkout?: CheckoutPayload
}

function normalizeCartItems(cartItems: CartItem[]) {
  return cartItems.map((item) => ({
    id: String(item.id ?? '').trim(),
    quantity: Math.max(0, Math.floor(Number(item.quantity ?? 0))),
  }));
}

export async function POST(req: Request) {
  try {
    const { amount, cartItems, accessToken, userId, checkout } = (await req.json()) as CreatePaymentBody

    if (!accessToken || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = createServiceSupabase()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken)

    if (userError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const normalizedCartItems = normalizeCartItems(cartItems)
    if (normalizedCartItems.some((item) => !item.id || item.quantity <= 0)) {
      return NextResponse.json({ error: 'Invalid cart items' }, { status: 400 })
    }

    const menuItemIds = Array.from(new Set(normalizedCartItems.map((item) => item.id)))
    const { data: menuItems, error: menuItemsError } = await supabase
      .from('menu_items')
      .select('id, price, is_available')
      .in('id', menuItemIds)

    if (menuItemsError) {
      console.error('Create payment: failed to load menu items', menuItemsError)
      return NextResponse.json({ error: 'Failed to load menu items' }, { status: 500 })
    }

    const menuItemMap = new Map(
      (menuItems ?? []).map((item) => [
        String(item.id),
        {
          price: Number(item.price ?? 0),
          isAvailable: item.is_available !== false,
        },
      ])
    )

    if (menuItemMap.size !== menuItemIds.length) {
      return NextResponse.json({ error: 'Some items were not found' }, { status: 400 })
    }

    if (normalizedCartItems.some((item) => !menuItemMap.get(item.id)?.isAvailable)) {
      return NextResponse.json({ error: 'Some items are unavailable' }, { status: 400 })
    }

    const itemsToInsert = normalizedCartItems.map((item) => ({
      menu_item_id: item.id,
      quantity: item.quantity,
      price_at_time: menuItemMap.get(item.id)!.price,
    }))

    const itemsTotal = itemsToInsert.reduce(
      (sum, item) => sum + item.price_at_time * item.quantity,
      0
    )

    const totalAmount = Number(amount)
    const orderType = checkout?.type === 'delivery' ? 'delivery' : 'restaurant'

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const bonusSpent = Number((itemsTotal - totalAmount).toFixed(2))
    if (bonusSpent < 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    let deliveryAddress: {
      id: string
      city: string | null
      street: string | null
      house: string | null
      entrance: string | null
      apartment: string | null
      floor: string | null
      comment: string | null
      latitude: number | null
      longitude: number | null
    } | null = null

    if (orderType === 'delivery' && !checkout?.deliveryAddress?.id) {
      return NextResponse.json({ error: 'Delivery address is required' }, { status: 400 })
    }

    if (orderType === 'delivery') {
      const { data: address, error: addressError } = await supabase
        .from('addresses')
        .select(
          'id, city, street, house, entrance, apartment, floor, comment, latitude, longitude'
        )
        .eq('id', checkout?.deliveryAddress?.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (addressError) {
        console.error('Create payment: failed to load address', addressError)
        return NextResponse.json({ error: 'Failed to load delivery address' }, { status: 500 })
      }

      if (!address) {
        return NextResponse.json({ error: 'Delivery address not found' }, { status: 400 })
      }

      deliveryAddress = {
        id: String(address.id),
        city: address.city ? String(address.city) : null,
        street: address.street ? String(address.street) : null,
        house: address.house ? String(address.house) : null,
        entrance: address.entrance ? String(address.entrance) : null,
        apartment: address.apartment ? String(address.apartment) : null,
        floor: address.floor ? String(address.floor) : null,
        comment: address.comment ? String(address.comment) : null,
        latitude: address.latitude != null ? Number(address.latitude) : null,
        longitude: address.longitude != null ? Number(address.longitude) : null,
      }
    }

    if (bonusSpent > 0) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('bonus_points')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Create payment: failed to load bonus balance', profileError)
        return NextResponse.json({ error: 'Failed to load bonus balance' }, { status: 500 })
      }

      const availableBonuses = Number(profile?.bonus_points ?? 0)
      if (bonusSpent - availableBonuses > 0.01) {
        return NextResponse.json({ error: 'Not enough bonus points' }, { status: 400 })
      }
    }

    const payment = await yooKassa.createPayment(
      {
        amount: {
          value: totalAmount.toFixed(2),
          currency: 'RUB'
        },
        confirmation: {
          type: 'redirect',
          return_url: `${resolveSiteUrl()}/payment-success`
        },
        capture: true,
        description: 'Получение оплаты заказа'
      },
      uuidv4()
    )

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        total_amount: totalAmount,
        type: orderType,
        delivery_address_id: orderType === 'delivery' ? deliveryAddress?.id ?? null : null,
        delivery_city: orderType === 'delivery' ? deliveryAddress?.city ?? null : null,
        delivery_street: orderType === 'delivery' ? deliveryAddress?.street ?? null : null,
        delivery_house: orderType === 'delivery' ? deliveryAddress?.house ?? null : null,
        delivery_entrance: orderType === 'delivery' ? deliveryAddress?.entrance ?? null : null,
        delivery_apartment: orderType === 'delivery' ? deliveryAddress?.apartment ?? null : null,
        delivery_floor: orderType === 'delivery' ? deliveryAddress?.floor ?? null : null,
        delivery_comment: orderType === 'delivery' ? deliveryAddress?.comment ?? null : null,
        delivery_latitude: orderType === 'delivery' ? deliveryAddress?.latitude ?? null : null,
        delivery_longitude: orderType === 'delivery' ? deliveryAddress?.longitude ?? null : null
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('Create payment: failed to create order', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert.map((item) => ({ ...item, order_id: order.id })))

    if (itemsError) {
      console.error('Create payment: failed to create order items', itemsError)
      await supabase.from('orders').delete().eq('id', order.id)
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
      console.error('Create payment: failed to create payment record', paymentError)
      await supabase.from('orders').delete().eq('id', order.id)
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
      { error: 'Ошибка создания платежа' },
      { status: 500 }
    )
  }
}
