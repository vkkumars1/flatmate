import { api } from './api'

export type Plan = 'VERIFIED' | 'BOOST'

export type CreateOrderResponse = {
  orderId: string
  amount: number
  keyId: string
  mock?: boolean
}

export async function createOrder(plan: Plan) {
  return api<CreateOrderResponse>('/payments/order', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  })
}

export async function verifyPayment(input: { orderId: string; paymentId: string; signature: string }) {
  return api<{ ok: boolean; plan: Plan }>('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function mockConfirm(orderId: string) {
  return api<{ ok: boolean; plan: Plan }>('/payments/mock-confirm', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  })
}
