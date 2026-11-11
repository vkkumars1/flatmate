const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
let accessToken: string | null = null
let refreshing = false

export function setAccessToken(token: string | null) { accessToken = token }
export function getAccessToken() { return accessToken }
export function getApiUrl() { return API_URL }

async function refresh() {
  if (refreshing) return false
  refreshing = true
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    if (!response.ok) return false
    const data = await response.json()
    accessToken = data.accessToken ?? null
    return Boolean(accessToken)
  } finally { refreshing = false }
}

export async function api<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
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
      const text = await response.text().catch(() => '')
      let serverMessage = ''
      try {
        const body = JSON.parse(text) as { error?: { message?: unknown } }
        if (typeof body.error?.message === 'string') serverMessage = body.error.message
      } catch {
        serverMessage = text
      }
      const msg = response.status >= 500 ? 'Something went wrong on our end.' : response.status === 429 ? 'Slow down a bit.' : serverMessage || 'Request failed'
      throw new Error(msg)
    }
    const ct = response.headers.get('content-type') ?? ''
    if (ct.includes('application/json')) return response.json()
    return undefined as unknown as T
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('WAKING_UP')
    throw error
  } finally { clearTimeout(timeout) }
}
