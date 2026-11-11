declare global {
  interface Window {
    Razorpay?: new (opts: RazorpayOptions) => { open: () => void }
  }
}

type RazorpayOptions = {
  key: string
  order_id: string
  amount: number
  currency: string
  name: string
  description?: string
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  handler?: (response: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }) => void
  modal?: { ondismiss?: () => void }
}

export type CheckoutSuccess = {
  orderId: string
  paymentId: string
  signature: string
}

export type OpenCheckoutInput = {
  orderId: string
  amount: number
  keyId: string
  plan: 'VERIFIED' | 'BOOST'
  name?: string
  email?: string
  phone?: string
  onSuccess: (payload: CheckoutSuccess) => void
  onFailure?: () => void
}

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'
let loader: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (loader) return loader
  loader = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Razorpay checkout runs in the browser only'))
      return
    }
    if (window.Razorpay) {
      resolve()
      return
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`)
    const target = existing ?? document.createElement('script')
    if (!existing) {
      target.src = CHECKOUT_SRC
      target.async = true
      document.head.appendChild(target)
    }
    target.addEventListener('load', () => resolve(), { once: true })
    target.addEventListener('error', () => {
      loader = null
      reject(new Error('Razorpay checkout script failed to load'))
    }, { once: true })
    if (existing && window.Razorpay) resolve()
  })
  return loader
}

export async function openRazorpayCheckout(input: OpenCheckoutInput) {
  await loadScript()
  const Razorpay = window.Razorpay
  if (!Razorpay) throw new Error('Razorpay checkout unavailable')
  const checkout = new Razorpay({
    key: input.keyId,
    order_id: input.orderId,
    amount: input.amount,
    currency: 'INR',
    name: 'FlatFit',
    description: input.plan === 'VERIFIED' ? 'Verified plan' : 'Boost plan',
    prefill: {
      name: input.name,
      email: input.email,
      contact: input.phone,
    },
    theme: { color: '#111827' },
    handler: (resp) => {
      input.onSuccess({
        orderId: resp.razorpay_order_id,
        paymentId: resp.razorpay_payment_id,
        signature: resp.razorpay_signature,
      })
    },
    modal: { ondismiss: () => input.onFailure?.() },
  })
  checkout.open()
}
