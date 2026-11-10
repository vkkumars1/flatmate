import { mockListings, mockMatches, mockUser } from './mocks'

let profileStore: Record<string, unknown> = { ...mockUser, bio: '', plan: 'FREE', phone: true, email: false, selfie: false }

const wait = (min = 300, max = 700) => new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min))

/** Returns the next discover page and cursor for infinite scrolling. Replace with fetch('/api/discover?cursor=...'). */
export async function getDiscover(cursor?: string) {
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
/** Records a swipe action for a user. Replace with a POST fetch('/api/swipes'). */
export async function swipe(toUserId: string, action: 'like' | 'pass' | 'super') { await wait(); return { toUserId, action, matched: action !== 'pass' } }
/** Returns the current user's matches. Replace with fetch('/api/matches'). */
export async function getMatches() { await wait(); return mockMatches.map((match, index) => ({ matchId: match.id, otherUser: { id: `u_${index + 1}`, name: match.name, age: 26 + index, city: match.locality, occupation: ['Product designer', 'Architect', 'Brand strategist', 'Software engineer'][index % 4], avatar: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" fill="${index % 2 ? '#bfe3ff' : '#c8ff3d'}"/><circle cx="80" cy="62" r="32" fill="#111"/><path d="M22 154c5-40 28-58 58-58s53 18 58 58" fill="#111"/></svg>`)}` }, score: match.score, lastMessage: ['Your kitchen rules are a green flag.', 'Want to compare move-in dates?', 'I also believe in a quiet Sunday.', 'That neighborhood sounds perfect.'][index % 4], unreadCount: index === 0 ? 2 : index === 2 ? 1 : 0 })) }
/** Returns chat messages for a match. Replace with fetch(`/api/matches/${matchId}/messages`). */
export async function getMessages(matchId: string) { await wait(); return [{ id: `${matchId}-1`, senderId: 'other', text: 'Hey! Your flatmate vibe looks solid.', createdAt: new Date().toISOString() }] }
/** Sends a chat message. Replace with a POST fetch(`/api/matches/${matchId}/messages`). */
export async function sendMessage(matchId: string, text: string) { await wait(); return { id: crypto.randomUUID(), matchId, senderId: mockUser.id, text, createdAt: new Date().toISOString() } }
/** Returns a compatibility breakdown. Replace with fetch(`/api/matches/${matchId}/compatibility`). */
export async function getCompatibility(matchId: string) { await wait(); return { matchId, score: 91, breakdown: [{ label: 'Cleanliness', weight: 30, score: 95 }, { label: 'Lifestyle', weight: 30, score: 88 }, { label: 'Budget', weight: 25, score: 92 }, { label: 'Social rhythm', weight: 15, score: 89 }], reasons: { good: ['Both sleep before 11', 'Similar cleaning rhythm', 'Budgets overlap'], bad: ['Weekend guests', 'Different noise levels'] } } }
/** Returns a paginated listings result. Replace with fetch('/api/listings?...filters'). */
export async function getListings(filters: { city?: string; maxRent?: number; cursor?: string } = {}) { await wait(); const listings = mockListings.filter((listing) => (!filters.city || listing.locality.toLowerCase().includes(filters.city.toLowerCase())) && (!filters.maxRent || listing.rent <= filters.maxRent)); return { listings, nextCursor: undefined } }
/** Returns one listing by id. Replace with fetch(`/api/listings/${id}`). */
export async function getListing(id: string) { await wait(); return mockListings.find((listing) => listing.id === id) ?? null }
/** Returns the current profile from the in-memory mock store. */
export async function getProfile() { await wait(); return { ...profileStore } }
/** Saves profile fields to the in-memory mock store so routes share updates. */
export async function saveProfile(data: Partial<typeof mockUser> & Record<string, unknown>) { await wait(); profileStore = { ...profileStore, ...data }; return { ...profileStore } }
/** Clears session-like mock state without persisting credentials in the browser. */
export function clearInMemoryStore() { profileStore = { ...mockUser, bio: '', plan: 'FREE', phone: true, email: false, selfie: false } }
/** Returns agreement rules for a match. Replace with fetch(`/api/agreements/${matchId}`). */
export async function getAgreement(matchId: string) { await wait(); return { id: `agreement-${matchId}`, matchId, rules: ['Quiet hours after 11pm', 'Split utilities equally'], acceptedBy: [] as string[] } }
/** Saves agreement rules. Replace with a POST fetch('/api/agreements'). */
export async function saveAgreement(matchId: string, rules: string[]) { await wait(); return { id: `agreement-${matchId}`, matchId, rules, acceptedBy: [] as string[] } }
/** Accepts an agreement. Replace with a POST fetch(`/api/agreements/${id}/accept`). */
export async function acceptAgreement(id: string) { await wait(); return { id, accepted: true } }
