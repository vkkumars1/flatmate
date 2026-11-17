import { mockMatches, mockUser } from './mocks'
import { api, isDemoMode } from './api'

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true' || isDemoMode()

let profileStore: Record<string, unknown> = { ...mockUser, bio: '', plan: 'FREE', phone: true, email: false, selfie: false }
const DEMO_PROFILE_KEY = 'flatfit:demo-profile:v1'
const DEMO_SWIPES_KEY = 'flatfit:demo-swipes:v1'

const wait = (min = 300, max = 700) => new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min))

function readDemoProfile() {
  if (typeof window === 'undefined') return profileStore
  try {
    profileStore = { ...profileStore, ...(JSON.parse(window.localStorage.getItem(DEMO_PROFILE_KEY) ?? '{}') as Record<string, unknown>) }
  } catch {
    return profileStore
  }
  return profileStore
}

function saveDemoProfile(data: Record<string, unknown>) {
  profileStore = { ...profileStore, ...data }
  if (typeof window !== 'undefined') window.localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profileStore))
}

function readDemoSwipes() {
  if (typeof window === 'undefined') return [] as string[]
  try {
    return JSON.parse(window.localStorage.getItem(DEMO_SWIPES_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

type DiscoverItem = { userId: string; name: string; age: number | null; city: string; photos?: string[]; score: number; topReasons: string[]; lifestyleChips: { label: string; same: boolean }[]; budgetMin: number; budgetMax: number }

export async function getDiscover(cursor?: string) {
  if (USE_MOCKS) {
    await wait()
    const portraits = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=85',
    ]
    const reasons = [
      ['Early risers', 'Tidy shared spaces', 'Move-in dates align'],
      ['Plant lovers', 'Quiet weeknights', 'Similar rent range'],
      ['Home cooks', 'Social but considerate', 'Same neighborhood'],
    ]
    const swipedUsers = new Set(readDemoSwipes())
    const items = mockMatches.filter((match) => !swipedUsers.has(match.id.replace('m_', 'u_'))).map((match, index) => ({
      userId: match.id.replace('m_', 'u_'),
      name: match.name,
      age: 26 + index,
      city: match.locality,
      photos: [portraits[index % portraits.length]],
      score: match.score,
      topReasons: reasons[index % reasons.length],
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
  if (USE_MOCKS) {
    await wait()
    if (typeof window !== 'undefined') window.localStorage.setItem(DEMO_SWIPES_KEY, JSON.stringify([...new Set([...readDemoSwipes(), toUserId])]))
    const index = Number(toUserId.replace('u_', '')) - 1
    return { toUserId, action, matched: action !== 'pass', matchId: action !== 'pass' ? mockMatches[index]?.id : undefined }
  }
  const result = await api<{ matched: boolean; matchId?: string }>('/swipes', { method: 'POST', body: JSON.stringify({ toUserId, action: action.toUpperCase() }) })
  return { toUserId, action, matched: result.matched, matchId: result.matchId }
}

export async function getMatches() {
  if (USE_MOCKS) {
    await wait()
    return mockMatches.map((match, index) => ({ matchId: match.id, otherUser: { id: `u_${index + 1}`, name: match.name, age: 26 + index, city: match.locality, occupation: ['Product designer', 'Architect', 'Brand strategist', 'Software engineer'][index % 4], avatar: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&h=240&q=80',
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=240&h=240&q=80',
    ][index % 3] }, score: match.score, lastMessage: ['Your kitchen rules are a green flag.', 'Want to compare move-in dates?', 'I also believe in a quiet Sunday.', 'That neighborhood sounds perfect.'][index % 4], unreadCount: index === 0 ? 2 : index === 2 ? 1 : 0 }))
  }
  const result = await api<{ items: Array<{ matchId: string; otherUser: { id: string; name: string; age: number | null; city: string | null; occupation: string | null; avatar: string | null }; score: number; lastMessage: { text?: string } | null; unreadCount: number }>; nextCursor?: string }>('/matches')
  return result.items.map((match) => ({
    ...match,
    otherUser: { ...match.otherUser, name: match.otherUser.name ?? 'Flatmate', city: match.otherUser.city ?? '', occupation: match.otherUser.occupation ?? '', avatar: match.otherUser.avatar ?? '' },
    lastMessage: match.lastMessage?.text ?? 'Say hello to your match',
  }))
}

const DEMO_MESSAGES_KEY = 'flatfit:demo-conversations:v1'
type DemoMessage = { id: string; matchId: string; senderId: string; text: string; createdAt: string }

function readDemoMessages(matchId: string): DemoMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = JSON.parse(window.localStorage.getItem(DEMO_MESSAGES_KEY) ?? '{}') as Record<string, DemoMessage[]>
    return saved[matchId] ?? []
  } catch {
    return []
  }
}

function writeDemoMessage(message: DemoMessage) {
  if (typeof window === 'undefined') return
  try {
    const saved = JSON.parse(window.localStorage.getItem(DEMO_MESSAGES_KEY) ?? '{}') as Record<string, DemoMessage[]>
    saved[message.matchId] = [...(saved[message.matchId] ?? demoConversationSeeds[message.matchId] ?? []), message]
    window.localStorage.setItem(DEMO_MESSAGES_KEY, JSON.stringify(saved))
  } catch {
    throw new Error('This demo conversation could not be saved in this browser.')
  }
}

const demoConversationSeeds: Record<string, DemoMessage[]> = {
  m_1: [
    { id: 'm_1-seed-1', matchId: 'm_1', senderId: 'u_1', text: 'Hey Aarav! That 94% compatibility score feels promising.', createdAt: '2026-11-15T09:18:00.000Z' },
    { id: 'm_1-seed-2', matchId: 'm_1', senderId: 'u_001', text: 'The early-riser and tidy-kitchen overlap is doing a lot of work.', createdAt: '2026-11-15T09:23:00.000Z' },
    { id: 'm_1-seed-3', matchId: 'm_1', senderId: 'u_1', text: 'Right? I usually make coffee around 7. Want to compare move-in dates?', createdAt: '2026-11-15T09:26:00.000Z' },
  ],
  m_2: [
    { id: 'm_2-seed-1', matchId: 'm_2', senderId: 'u_2', text: 'Hi! I saw you are into plants too. My balcony jungle is getting out of hand.', createdAt: '2026-11-14T16:05:00.000Z' },
    { id: 'm_2-seed-2', matchId: 'm_2', senderId: 'u_001', text: 'There is no such thing as too many plants. What do you grow?', createdAt: '2026-11-14T16:14:00.000Z' },
  ],
  m_3: [
    { id: 'm_3-seed-1', matchId: 'm_3', senderId: 'u_3', text: 'Hey! Your profile says you enjoy cooking. What is your signature weeknight meal?', createdAt: '2026-11-16T18:42:00.000Z' },
  ],
}

export async function getMessages(matchId: string) {
  if (USE_MOCKS) {
    await wait()
    const saved = readDemoMessages(matchId)
    return saved.length ? saved : (demoConversationSeeds[matchId] ?? [])
  }
  const result = await api<{ items: any[]; nextCursor?: string }>(`/matches/${encodeURIComponent(matchId)}/messages`)
  return result.items
}

export async function sendMessage(matchId: string, text: string) {
  if (USE_MOCKS) {
    await wait()
    const message = { id: crypto.randomUUID(), matchId, senderId: mockUser.id, text, createdAt: new Date().toISOString() }
    writeDemoMessage(message)
    return message
  }
  return api<{ id: string; matchId: string; senderId: string; text: string; createdAt: string }>(`/matches/${encodeURIComponent(matchId)}/messages`, { method: 'POST', body: JSON.stringify({ text }) })
}

export async function getCompatibility(matchId: string) {
  if (USE_MOCKS) { await wait(); return { matchId, score: 91, breakdown: [{ label: 'Cleanliness', weight: 30, score: 95 }, { label: 'Lifestyle', weight: 30, score: 88 }, { label: 'Budget', weight: 25, score: 92 }, { label: 'Social rhythm', weight: 15, score: 89 }], reasons: { good: ['Both sleep before 11', 'Similar cleaning rhythm', 'Budgets overlap'], bad: ['Weekend guests', 'Different noise levels'] } } }
  return api(`/matches/${encodeURIComponent(matchId)}/compatibility`)
}

export async function getProfile() {
  if (USE_MOCKS) { await wait(); return { ...readDemoProfile() } }
  const result = await api<{ user: any; profile: any; lifestyle: any; dealBreakers: any; verification: { phone: boolean; email: boolean; selfie: boolean }; plan: string }>('/me')
  return { ...(result.user ?? {}), ...(result.profile ?? {}), plan: result.plan, phone: result.verification?.phone, email: result.verification?.email, selfie: result.verification?.selfie, lifestyle: result.lifestyle, dealBreakers: result.dealBreakers }
}

export async function saveProfile(data: Partial<typeof mockUser> & Record<string, unknown>) {
  if (USE_MOCKS) { await wait(); saveDemoProfile(data); return { ...profileStore } }
  return api('/me/profile', { method: 'PUT', body: JSON.stringify(data) })
}

export async function saveLifestyle(data: { sleepTime: number; wakeTime: number; cleanliness: number; smoking: boolean; drinking: boolean; pets: boolean; diet: string; guestsLevel: number; noiseLevel: number; cooking: string }) {
  if (USE_MOCKS) { await wait(); saveDemoProfile({ lifestyle: data }); return { ok: true } }
  return api('/me/lifestyle', { method: 'PUT', body: JSON.stringify(data) })
}

export async function saveDealBreakers(items: string[]) {
  const data = items.map((key) => ({ key, value: 'true' }))
  if (USE_MOCKS) { await wait(); saveDemoProfile({ dealBreakers: data }); return { ok: true } }
  return api('/me/deal-breakers', { method: 'PUT', body: JSON.stringify(data) })
}

export async function uploadPhoto(file: File, purpose: 'profile' | 'listing') {
  if (USE_MOCKS) throw new Error('Photo uploads need an account connection.')
  const signed = await api<{ uploadUrl: string; path: string; publicUrl: string }>('/me/photos/upload-url', {
    method: 'POST',
    body: JSON.stringify({ fileType: file.type, fileSize: file.size, purpose }),
  })
  const response = await fetch(signed.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type, 'x-upsert': 'true' },
    body: file,
  })
  if (!response.ok) throw new Error('Photo upload failed. Please try again.')
  return { path: signed.path, publicUrl: signed.publicUrl }
}

export function clearInMemoryStore() {
  profileStore = { ...mockUser, bio: '', plan: 'FREE', phone: true, email: false, selfie: false }
  if (typeof window !== 'undefined' && USE_MOCKS) {
    window.localStorage.removeItem(DEMO_PROFILE_KEY)
    window.localStorage.removeItem(DEMO_SWIPES_KEY)
    window.localStorage.removeItem(DEMO_MESSAGES_KEY)
  }
  if (!USE_MOCKS) { api('/auth/logout', { method: 'POST' }).catch(() => {}) }
}

export type AgreementRecord = { id: string; matchId: string; rules: string[]; acceptedByA: boolean; acceptedByB: boolean }

export async function getAgreement(matchId: string) {
  if (USE_MOCKS) { await wait(); return { id: `agreement-${matchId}`, matchId, rules: ['Quiet hours after 11pm', 'Split utilities equally'], acceptedByA: false, acceptedByB: false } satisfies AgreementRecord }
  return api<AgreementRecord | null>(`/matches/${encodeURIComponent(matchId)}/agreement`)
}

export async function saveAgreement(matchId: string, rules: string[]) {
  if (USE_MOCKS) { await wait(); return { id: `agreement-${matchId}`, matchId, rules, acceptedByA: false, acceptedByB: false } satisfies AgreementRecord }
  return api<AgreementRecord>(`/matches/${encodeURIComponent(matchId)}/agreement`, { method: 'POST', body: JSON.stringify({ rules }) })
}

export async function acceptAgreement(id: string) {
  if (USE_MOCKS) { await wait(); return { id, accepted: true } }
  return api(`/agreements/${encodeURIComponent(id)}/accept`, { method: 'PUT' })
}
