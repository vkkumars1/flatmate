import { mockListings, mockMatches, mockUser } from './mocks'

const wait = (min = 300, max = 700) => new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min))

/** Returns the next discover page and cursor for infinite scrolling. Replace with fetch('/api/discover?cursor=...'). */
export async function getDiscover(cursor?: string) { await wait(); return { users: mockMatches, nextCursor: cursor ? undefined : 'page-2' } }
/** Records a swipe action for a user. Replace with a POST fetch('/api/swipes'). */
export async function swipe(toUserId: string, action: 'like' | 'pass' | 'superlike') { await wait(); return { toUserId, action, matched: action !== 'pass' } }
/** Returns the current user's matches. Replace with fetch('/api/matches'). */
export async function getMatches() { await wait(); return mockMatches }
/** Returns chat messages for a match. Replace with fetch(`/api/matches/${matchId}/messages`). */
export async function getMessages(matchId: string) { await wait(); return [{ id: `${matchId}-1`, senderId: 'other', text: 'Hey! Your flatmate vibe looks solid.', createdAt: new Date().toISOString() }] }
/** Sends a chat message. Replace with a POST fetch(`/api/matches/${matchId}/messages`). */
export async function sendMessage(matchId: string, text: string) { await wait(); return { id: crypto.randomUUID(), matchId, senderId: mockUser.id, text, createdAt: new Date().toISOString() } }
/** Returns a compatibility breakdown. Replace with fetch(`/api/matches/${matchId}/compatibility`). */
export async function getCompatibility(matchId: string) { await wait(); return { matchId, score: 91, breakdown: { cleanliness: 95, lifestyle: 88, budget: 92, social: 89 } } }
/** Returns a paginated listings result. Replace with fetch('/api/listings?...filters'). */
export async function getListings(filters: { city?: string; maxRent?: number; cursor?: string } = {}) { await wait(); const listings = mockListings.filter((listing) => (!filters.city || listing.locality.toLowerCase().includes(filters.city.toLowerCase())) && (!filters.maxRent || listing.rent <= filters.maxRent)); return { listings, nextCursor: undefined } }
/** Returns one listing by id. Replace with fetch(`/api/listings/${id}`). */
export async function getListing(id: string) { await wait(); return mockListings.find((listing) => listing.id === id) ?? null }
/** Returns the current profile. Replace with fetch('/api/profile'). */
export async function getProfile() { await wait(); return mockUser }
/** Saves profile fields. Replace with a PATCH fetch('/api/profile'). */
export async function saveProfile(data: Partial<typeof mockUser>) { await wait(); return { ...mockUser, ...data } }
/** Returns agreement rules for a match. Replace with fetch(`/api/agreements/${matchId}`). */
export async function getAgreement(matchId: string) { await wait(); return { id: `agreement-${matchId}`, matchId, rules: ['Quiet hours after 11pm', 'Split utilities equally'], acceptedBy: [] as string[] } }
/** Saves agreement rules. Replace with a POST fetch('/api/agreements'). */
export async function saveAgreement(matchId: string, rules: string[]) { await wait(); return { id: `agreement-${matchId}`, matchId, rules, acceptedBy: [] as string[] } }
/** Accepts an agreement. Replace with a POST fetch(`/api/agreements/${id}/accept`). */
export async function acceptAgreement(id: string) { await wait(); return { id, accepted: true } }
