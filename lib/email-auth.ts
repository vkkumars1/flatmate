import { api, setAccessToken } from './api'
import { useAuthStore } from '@/store/auth'

export type AuthResponse = {
  accessToken: string
  user: { id: string; name: string; role: string; plan: string }
  isNewUser: boolean
}

export async function signUpWithEmail(email: string, password: string, name?: string) {
  const result = await api<AuthResponse>('/auth/email/signup', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password, ...(name ? { name } : {}) }),
  })
  setAccessToken(result.accessToken)
  useAuthStore.getState().setSession(result.user as never, result.accessToken)
  return result
}

export async function signInWithEmail(email: string, password: string) {
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
