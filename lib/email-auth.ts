import { api, setAccessToken } from './api'

export type AuthResponse = {
  accessToken: string
  user: { id: string; name: string; role: string; plan: string }
  isNewUser: boolean
}

export async function signUpEmail(email: string, password: string, name?: string) {
  const result = await api<AuthResponse>('/auth/email/signup', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password, ...(name ? { name } : {}) }),
  })
  setAccessToken(result.accessToken)
  return result
}

export async function signInEmail(email: string, password: string) {
  const result = await api<AuthResponse>('/auth/email/signin', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  })
  setAccessToken(result.accessToken)
  return result
}
