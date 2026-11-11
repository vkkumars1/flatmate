import { api, setAccessToken } from './api'
import { useAuthStore } from '@/store/auth'

type AuthUser = { id: string; name: string; role: string; plan: string; email?: string; phone?: string }
type AuthResponse = { accessToken: string; user: AuthUser; isNewUser: boolean }

function persist(user: AuthUser, accessToken: string) {
  setAccessToken(accessToken)
  useAuthStore.getState().setSession(user as never, accessToken)
}

export async function sendOtp(phone: string) {
  return api<{ ok: boolean; resendInSeconds: number }>('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) })
}

export async function verifyOtp(phone: string, otp: string) {
  const result = await api<AuthResponse>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) })
  persist(result.user, result.accessToken)
  return result
}

export async function firebaseVerify(idToken: string) {
  const result = await api<AuthResponse>('/auth/firebase-verify', { method: 'POST', body: JSON.stringify({ idToken }) })
  persist(result.user, result.accessToken)
  return result
}

export async function logout() {
  try { await api('/auth/logout', { method: 'POST' }) } catch { /* ignore */ }
  setAccessToken(null)
  useAuthStore.getState().clearSession()
}

export async function tryRefresh() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/auth/refresh`, { method: 'POST', credentials: 'include' })
    if (!response.ok) return null
    const data = await response.json() as { accessToken: string; user?: AuthUser }
    if (!data.accessToken) return null
    setAccessToken(data.accessToken)
    return data
  } catch { return null }
}

export async function hydrateSession() {
  const refreshed = await tryRefresh()
  if (!refreshed) return null
  try {
    const me = await api<{ user: AuthUser }>('/me', { method: 'GET' })
    persist(me.user, refreshed.accessToken)
    return me.user
  } catch {
    useAuthStore.getState().clearSession()
    setAccessToken(null)
    return null
  }
}
