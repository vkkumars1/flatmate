import { api, setAccessToken } from './api'

export async function sendOtp(phone: string) {
  return api<{ ok: boolean; resendInSeconds: number }>('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) })
}

export async function verifyOtp(phone: string, otp: string) {
  const result = await api<{ accessToken: string; user: { id: string; name: string; role: string; plan: string }; isNewUser: boolean }>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) })
  setAccessToken(result.accessToken)
  return result
}

export async function firebaseVerify(idToken: string) {
  const result = await api<{ accessToken: string; user: { id: string; name: string; role: string; plan: string }; isNewUser: boolean }>('/auth/firebase-verify', { method: 'POST', body: JSON.stringify({ idToken }) })
  setAccessToken(result.accessToken)
  return result
}

export async function logout() {
  try { await api('/auth/logout', { method: 'POST' }) } catch { /* ignore */ }
  setAccessToken(null)
}

export async function tryRefresh() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/auth/refresh`, { method: 'POST', credentials: 'include' })
    if (!response.ok) return null
    const data = await response.json()
    if (data.accessToken) setAccessToken(data.accessToken)
    return data
  } catch { return null }
}
