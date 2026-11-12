const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '')
const STORAGE_KEY = 'ff.at'

let accessToken: string | null =
  typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
let refreshPromise: Promise<boolean> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(STORAGE_KEY, token)
  else window.localStorage.removeItem(STORAGE_KEY)
}
export function getAccessToken() { return accessToken }
export function getApiUrl() { return API_URL }

async function refresh() {
  if (refreshPromise) return refreshPromise

  const pending = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
      if (!response.ok) return false
      const data = await response.json()
      const next = data.accessToken ?? null
      setAccessToken(next)
      return Boolean(next)
    } catch {
      return false
    }
  })()

  refreshPromise = pending
  try {
    return await pending
  } finally {
    if (refreshPromise === pending) refreshPromise = null
  }
}

export async function api<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  if (!API_URL) throw new Error('The account service is not configured for this build.')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: 'include',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...init.headers },
    })
    if (response.status === 401 && !retried && await refresh()) return api<T>(path, init, true)
    if (!response.ok) {
      const contentType = response.headers.get('content-type') ?? ''
      let message = ''
      if (contentType.includes('application/json')) {
        const body = await response.json().catch(() => null) as { message?: string; error?: string | { message?: string } } | null
        message = body?.message ?? (typeof body?.error === 'string' ? body.error : body?.error?.message) ?? ''
      } else {
        const text = await response.text().catch(() => '')
        if (text.trim() && !/^\s*<!doctype html|^\s*<html/i.test(text)) message = text.trim().slice(0, 240)
      }
      const msg = response.status >= 500 ? 'Something went wrong on our end.' : response.status === 429 ? 'Slow down a bit.' : message || `Request failed (${response.status})`
      throw new Error(msg)
    }
    const ct = response.headers.get('content-type') ?? ''
    if (ct.includes('application/json')) return response.json()
    return undefined as unknown as T
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('The account service is taking too long to respond. Try again in a moment.')
    if (error instanceof TypeError && error.message === 'Failed to fetch') throw new Error('Unable to reach the account service. Please try again.')
    throw error
  } finally { clearTimeout(timeout) }
}
