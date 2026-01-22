declare module 'yookassa' {
  interface Payment {
    id: string
    status: string
    confirmation: {
      type: string
      confirmation_url: string
    }
  }

  interface CreatePaymentPayload {
    amount: {
      value: string
      currency: string
    }
    confirmation: {
      type: 'redirect'
      return_url: string
    }
    capture: boolean
    description?: string
  }

  export default class YooKassa {
    constructor(config: { shopId: string; secretKey: string })

    createPayment(
      payload: CreatePaymentPayload,
      idempotenceKey: string
    ): Promise<Payment>
  }
}
