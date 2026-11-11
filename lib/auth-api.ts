import { signOut } from 'firebase/auth'
import { api, setAccessToken } from './api'
import { getFirebaseAuth, isFirebaseConfigured } from './firebase-client'
import { useAuthStore } from '@/store/auth'

type AuthUser = { id: string; name: string; role: string; plan: string; email?: string }
type AuthResponse = { accessToken: string; user: AuthUser; isNewUser: boolean }

function persist(user: AuthUser, accessToken: string) {
  setAccessToken(accessToken)
  useAuthStore.getState().setSession(user as never, accessToken)
}

export async function firebaseVerify(idToken: string) {
  const result = await api<AuthResponse>('/auth/firebase-verify', { method: 'POST', body: JSON.stringify({ idToken }) })
  persist(result.user, result.accessToken)
  return result
}

export async function logout() {
  try { await api('/auth/logout', { method: 'POST' }) } catch { /* Clear local auth even when the API is unavailable. */ }
  if (isFirebaseConfigured()) {
    try { await signOut(getFirebaseAuth()) } catch { /* Firebase may already be signed out. */ }
  }
  setAccessToken(null)
  useAuthStore.getState().clearSession()
}

export async function tryRefresh() {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/auth/refresh`, { method: 'POST', credentials: 'include', signal: controller.signal })
    if (!response.ok) return null
    const data = await response.json() as { accessToken: string; user?: AuthUser }
    if (!data.accessToken) return null
    setAccessToken(data.accessToken)
    return data
  } catch { return null } finally { window.clearTimeout(timeout) }
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
