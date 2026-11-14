import { api, isDemoMode, setAccessToken } from './api'
import { useAuthStore } from '@/store/auth'
import { mockUser } from './mocks'

export const DEMO_ACCOUNT = { email: 'demo@flatmate.app', password: 'FlatmateDemo2025!' }

function signInAsDemo() {
  const accessToken = 'demo-session'
  const user = { ...mockUser, plan: 'FREE' }
  setAccessToken(accessToken)
  useAuthStore.getState().setSession(user as never, accessToken)
  return { accessToken, user, isNewUser: false }
}

export type AuthResponse = {
  accessToken: string
  user: { id: string; name: string; role: string; plan: string }
  isNewUser: boolean
}

export async function signUpWithEmail(email: string, password: string, name?: string) {
  if (isDemoMode()) {
    throw new Error('Demo mode does not create real accounts. Use the demo sign-in below to explore the app.')
  }
  const result = await api<AuthResponse>('/auth/email/signup', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password, ...(name ? { name } : {}) }),
  })
  setAccessToken(result.accessToken)
  useAuthStore.getState().setSession(result.user as never, result.accessToken)
  return result
}

export async function signInWithEmail(email: string, password: string) {
  if (isDemoMode()) {
    if (email.trim().toLowerCase() !== DEMO_ACCOUNT.email || password !== DEMO_ACCOUNT.password) {
      throw new Error('Account service is not configured. Sign in with the demo account shown below.')
    }
    return signInAsDemo()
  }
  const result = await api<AuthResponse>('/auth/email/signin', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  })
  setAccessToken(result.accessToken)
  useAuthStore.getState().setSession(result.user as never, result.accessToken)
  return result
}

export const signUpEmail = signUpWithEmail
export const signInEmail = signInWithEmail
