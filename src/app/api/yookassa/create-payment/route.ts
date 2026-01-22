import { NextResponse } from 'next/server'
import YooKassa from 'yookassa'
import { v4 as uuidv4 } from 'uuid'
console.log(process.env.YOOKASSA_SHOP_ID)
console.log(process.env.YOOKASSA_SECRET_KEY)
const yooKassa = new YooKassa({
  shopId: process.env.YOOKASSA_SHOP_ID!,
  secretKey: process.env.YOOKASSA_SECRET_KEY!
})

export async function POST(req: Request) {
  try {
    const { amount } = await req.json()

    const payment = await yooKassa.createPayment(
      {
        amount: {
          value: amount.toFixed(2),
          currency: 'RUB'
        },
        confirmation: {
          type: 'redirect',
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`
        },
        capture: true,
        description: 'Оплата заказа'
      },
      uuidv4()
    )

    return NextResponse.json({ confirmationUrl: payment.confirmation.confirmation_url })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Ошибка создания платежа' }, { status: 500 })
  }
}

