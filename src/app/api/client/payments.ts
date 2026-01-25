export type CartItemPayload = {
  id: string;
  price: number;
  quantity: number;
};

export async function createYooKassaPayment(
  amount: number,
  cartItems: CartItemPayload[],
  accessToken: string,
  userId: string
) {
  const res = await fetch('/api/yookassa/create-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, cartItems, accessToken, userId }),
  });

  return res.json();
}

export async function confirmYooKassaPayment(paymentId: string, accessToken: string) {
  const res = await fetch('/api/yookassa/confirm-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId, accessToken }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      error: data?.error ?? 'confirm_failed',
      statusCode: res.status,
    };
  }
  return data;
}
