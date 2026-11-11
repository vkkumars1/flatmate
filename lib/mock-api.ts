import { mockListings, mockMatches, mockUser } from './mocks'
import { api } from './api'

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true'

let profileStore: Record<string, unknown> = { ...mockUser, bio: '', plan: 'FREE', phone: true, email: false, selfie: false }

const wait = (min = 300, max = 700) => new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min))

type DiscoverItem = { userId: string; name: string; age: number; city: string; photos?: { id: string; url: string }[]; score: number; topReasons: string[]; lifestyleChips: { label: string; same: boolean }[]; budgetMin: number; budgetMax: number }

export async function getDiscover(cursor?: string) {
  if (USE_MOCKS) {
    await wait()
    const items = mockMatches.map((match, index) => ({
      userId: match.id.replace('m_', 'u_'),
      name: match.name,
      age: 26 + index,
      city: match.locality,
      score: match.score,
      topReasons: ['Both sleep before 11', 'You both like a tidy kitchen', 'Similar move-in timing'],
      lifestyleChips: match.tags.map((label, chipIndex) => ({ label, same: chipIndex === 0 })),
      budgetMin: 15000 + index * 3000,
      budgetMax: 28000 + index * 3000,
    }))
    return { items, nextCursor: cursor ? undefined : 'page-2' }
  }
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
  return api<{ items: DiscoverItem[]; nextCursor?: string }>(`/discover${qs}`)
}

export async function swipe(toUserId: string, action: 'like' | 'pass' | 'super') {
  if (USE_MOCKS) { await wait(); return { toUserId, action, matched: action !== 'pass' } }
  const result = await api<{ matched: boolean; matchId?: string }>('/swipes', { method: 'POST', body: JSON.stringify({ toUserId, action: action.toUpperCase() }) })
  return { toUserId, action, matched: result.matched, matchId: result.matchId }
}

export async function getMatches() {
  if (USE_MOCKS) {
    await wait()
    return mockMatches.map((match, index) => ({ matchId: match.id, otherUser: { id: `u_${index + 1}`, name: match.name, age: 26 + index, city: match.locality, occupation: ['Product designer', 'Architect', 'Brand strategist', 'Software engineer'][index % 4], avatar: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" fill="${index % 2 ? '#bfe3ff' : '#c8ff3d'}"/><circle cx="80" cy="62" r="32" fill="#111"/><path d="M22 154c5-40 28-58 58-58s53 18 58 58" fill="#111"/></svg>`)}` }, score: match.score, lastMessage: ['Your kitchen rules are a green flag.', 'Want to compare move-in dates?', 'I also believe in a quiet Sunday.', 'That neighborhood sounds perfect.'][index % 4], unreadCount: index === 0 ? 2 : index === 2 ? 1 : 0 }))
  }
  const result = await api<{ items: unknown[]; nextCursor?: string }>('/matches')
  return result.items
}

export async function getMessages(matchId: string) {
  if (USE_MOCKS) { await wait(); return [{ id: `${matchId}-1`, senderId: 'other', text: 'Hey! Your flatmate vibe looks solid.', createdAt: new Date().toISOString() }] }
  const result = await api<{ items: any[]; nextCursor?: string }>(`/matches/${encodeURIComponent(matchId)}/messages`)
  return result.items
}

export async function sendMessage(matchId: string, text: string) {
  if (USE_MOCKS) { await wait(); return { id: crypto.randomUUID(), matchId, senderId: mockUser.id, text, createdAt: new Date().toISOString() } }
  return api<{ id: string; matchId: string; senderId: string; text: string; createdAt: string }>(`/matches/${encodeURIComponent(matchId)}/messages`, { method: 'POST', body: JSON.stringify({ text }) })
}

export async function getCompatibility(matchId: string) {
  if (USE_MOCKS) { await wait(); return { matchId, score: 91, breakdown: [{ label: 'Cleanliness', weight: 30, score: 95 }, { label: 'Lifestyle', weight: 30, score: 88 }, { label: 'Budget', weight: 25, score: 92 }, { label: 'Social rhythm', weight: 15, score: 89 }], reasons: { good: ['Both sleep before 11', 'Similar cleaning rhythm', 'Budgets overlap'], bad: ['Weekend guests', 'Different noise levels'] } } }
  return api(`/matches/${encodeURIComponent(matchId)}/compatibility`)
}

export async function getListings(filters: { city?: string; maxRent?: number; cursor?: string } = {}) {
  if (USE_MOCKS) {
    await wait()
    const listings = mockListings.filter((listing) => (!filters.city || listing.locality.toLowerCase().includes(filters.city.toLowerCase())) && (!filters.maxRent || listing.rent <= filters.maxRent))
    return { listings, nextCursor: undefined as string | undefined }
  }
  const params = new URLSearchParams()
  if (filters.city) params.set('city', filters.city)
  if (filters.maxRent) params.set('max', String(filters.maxRent))
  if (filters.cursor) params.set('cursor', filters.cursor)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const result = await api<{ items: any[]; nextCursor?: string }>(`/listings${qs}`)
  return { listings: result.items, nextCursor: result.nextCursor }
}

export async function getListing(id: string) {
  if (USE_MOCKS) { await wait(); return mockListings.find((listing) => listing.id === id) ?? null }
  return api(`/listings/${encodeURIComponent(id)}`)
}

export async function getProfile() {
  if (USE_MOCKS) { await wait(); return { ...profileStore } }
  const result = await api<{ user: any; profile: any; lifestyle: any; dealBreakers: any; verification: { phone: boolean; email: boolean; selfie: boolean }; plan: string }>('/me')
  return { ...(result.user ?? {}), ...(result.profile ?? {}), plan: result.plan, phone: result.verification?.phone, email: result.verification?.email, selfie: result.verification?.selfie, lifestyle: result.lifestyle, dealBreakers: result.dealBreakers }
}

export async function saveProfile(data: Partial<typeof mockUser> & Record<string, unknown>) {
  if (USE_MOCKS) { await wait(); profileStore = { ...profileStore, ...data }; return { ...profileStore } }
  return api('/me/profile', { method: 'PUT', body: JSON.stringify(data) })
}

export function clearInMemoryStore() {
  profileStore = { ...mockUser, bio: '', plan: 'FREE', phone: true, email: false, selfie: false }
  if (!USE_MOCKS) { api('/auth/logout', { method: 'POST' }).catch(() => {}) }
}

export async function getAgreement(matchId: string) {
  if (USE_MOCKS) { await wait(); return { id: `agreement-${matchId}`, matchId, rules: ['Quiet hours after 11pm', 'Split utilities equally'], acceptedBy: [] as string[] } }
  return api(`/matches/${encodeURIComponent(matchId)}/agreement`)
}

export async function saveAgreement(matchId: string, rules: string[]) {
  if (USE_MOCKS) { await wait(); return { id: `agreement-${matchId}`, matchId, rules, acceptedBy: [] as string[] } }
  return api(`/matches/${encodeURIComponent(matchId)}/agreement`, { method: 'POST', body: JSON.stringify({ rules }) })
}

export async function acceptAgreement(id: string) {
  if (USE_MOCKS) { await wait(); return { id, accepted: true } }
  return api(`/agreements/${encodeURIComponent(id)}/accept`, { method: 'PUT' })
}
