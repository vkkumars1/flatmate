import { z } from "zod"
import { api, isDemoMode } from "@/lib/api"

export const listingPhotoSchema = z.object({
  id: z.string(),
  url: z.string(),
})

export const listingSchema = z.object({
  id: z.string(),
  title: z.string(),
  city: z.string(),
  locality: z.string(),
  rent: z.number(),
  photos: z.array(listingPhotoSchema),
  verified: z.boolean(),
  availableFrom: z.string(),
  amenities: z.array(z.string()),
  bills: z.number(),
  description: z.string(),
  ownerId: z.string().optional(),
  deposit: z.number().optional(),
})

export type Listing = z.infer<typeof listingSchema>

const colors = ["#d7ff41", "#ff5c39", "#0e1c18", "#e7dfd2"]
const photo = (id: string, index: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=85`

const listings: Listing[] = [
  { id: "listing-1", title: "Sunlit 2BHK with balcony", city: "Gurugram", locality: "Sector 43", rent: 18000, verified: true, availableFrom: "2026-12-01", bills: 2800, amenities: ["Balcony", "Power backup", "Metro nearby", "Furnished"], description: "A bright, calm home for people who like good light, clean counters, and a short walk to the metro.", photos: [photo("1600607687920-4e2a09cf159d", 0), photo("1600566753190-17f0baa2a6c3", 1), photo("1600210492486-724fe5c67fb0", 2)].map((url, i) => ({ id: `${i}`, url })) },
  { id: "listing-2", title: "Quiet room near Indiranagar", city: "Bangalore", locality: "Indiranagar", rent: 22000, verified: true, availableFrom: "2026-11-18", bills: 3200, amenities: ["WFH desk", "House help", "Pet friendly", "Security"], description: "The kind of room that makes Monday feel less dramatic. Quiet street, shared living room, great chai nearby.", photos: [photo("1600585154340-be6161a56a0c", 0), photo("1600607688969-a5bfcd646154", 1), photo("1616486338812-3dadae4b4ace", 2)].map((url, i) => ({ id: `${i}`, url })) },
  { id: "listing-3", title: "Minimal 3BHK, big common room", city: "Pune", locality: "Koregaon Park", rent: 15500, verified: false, availableFrom: "2026-12-15", bills: 2400, amenities: ["Common room", "Scooter parking", "Cook included"], description: "A spacious shared home with room for dinner parties, plants, and the occasional existential crisis.", photos: [photo("1600566753086-00f18fb6b3ea", 0), photo("1600573472550-8090b5e1c6a6", 1), photo("1600047509807-ba8f99d2cdde", 2)].map((url, i) => ({ id: `${i}`, url })) },
  { id: "listing-4", title: "Cozy single room in Hauz Khas", city: "Delhi", locality: "Hauz Khas", rent: 19500, verified: true, availableFrom: "2026-11-28", bills: 2600, amenities: ["Terrace", "No brokerage", "Furnished"], description: "A tucked-away flat with a sunny terrace and flatmates who understand that quiet mornings are sacred.", photos: [photo("1600585154526-990dced4db0d", 0), photo("1600566753051-62c66a4c9b33", 1), photo("1600607687939-ce8a6c25118c", 2)].map((url, i) => ({ id: `${i}`, url })) },
  { id: "listing-5", title: "Sea breeze 2BHK", city: "Mumbai", locality: "Andheri West", rent: 26000, verified: false, availableFrom: "2027-01-01", bills: 3600, amenities: ["Sea breeze", "Gym", "Lift"], description: "A warm, lived-in home near the action, with a living room that actually fits more than two people.", photos: [photo("1600607687920-4e2a09cf159d", 0), photo("1600210491892-03d54c0aaf87", 1), photo("1600566753190-17f0baa2a6c3", 2)].map((url, i) => ({ id: `${i}`, url })) },
]

function normalizeListing(value: Record<string, unknown>): Listing {
  const photos = Array.isArray(value.photos) ? value.photos.map((photo, index) => typeof photo === 'string' ? { id: String(index), url: photo } : photo as { id: string; url: string }) : []
  return listingSchema.parse({
    id: String(value.id ?? ''), title: String(value.title ?? ''), city: String(value.city ?? ''), locality: String(value.locality ?? ''),
    rent: Number(value.rent ?? 0), photos, verified: Boolean(value.verified), availableFrom: String(value.availableFrom ?? ''),
    amenities: Array.isArray(value.amenities) ? value.amenities.map(String) : [], bills: Number(value.bills ?? 0),
    description: String(value.description ?? ''), ownerId: typeof value.ownerId === 'string' ? value.ownerId : undefined,
    deposit: Number(value.deposit ?? 0),
  })
}

export async function getListings(filters: { city?: string; min?: number; max?: number; verified?: boolean; cursor?: string } = {}) {
  if (isDemoMode()) {
    await new Promise((resolve) => setTimeout(resolve, 350))
    const filtered = listings.filter((listing) => !filters.city || filters.city === 'All cities' || listing.city === filters.city)
      .filter((listing) => filters.min === undefined || listing.rent >= filters.min)
      .filter((listing) => filters.max === undefined || listing.rent <= filters.max)
      .filter((listing) => !filters.verified || listing.verified)
    const start = filters.cursor ? 2 : 0
    return { items: filtered.slice(start, start + 4), nextCursor: start + 4 < filtered.length ? 'page-2' : undefined }
  }
  const params = new URLSearchParams()
  if (filters.city && filters.city !== 'All cities') params.set('city', filters.city)
  if (filters.min !== undefined) params.set('min', String(filters.min))
  if (filters.max !== undefined) params.set('max', String(filters.max))
  if (filters.verified) params.set('verified', 'true')
  if (filters.cursor) params.set('cursor', filters.cursor)
  const result = await api<{ items: Record<string, unknown>[]; nextCursor?: string | null }>(`/listings${params.size ? `?${params.toString()}` : ''}`)
  return { items: result.items.map(normalizeListing), nextCursor: result.nextCursor ?? undefined }
}

export async function getListing(id: string) {
  if (isDemoMode()) {
    await new Promise((resolve) => setTimeout(resolve, 250))
    return listings.find((listing) => listing.id === id) ?? listings[0]
  }
  const result = await api<Record<string, unknown>>(`/listings/${encodeURIComponent(id)}`)
  return normalizeListing(result)
}

export async function createListing(input: Omit<Listing, 'id' | 'verified' | 'photos'> & { photos: Listing['photos'] | string[] }) {
  const photoUrls = input.photos.map((photo) => typeof photo === 'string' ? photo : photo.url)
  if (isDemoMode()) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    const listing = normalizeListing({ ...input, photos: photoUrls, id: `listing-${Date.now()}`, verified: false })
    listings.unshift(listing)
    return listing
  }
  const result = await api<Record<string, unknown>>('/listings', {
    method: 'POST',
    body: JSON.stringify({ ...input, photos: photoUrls }),
  })
  return normalizeListing(result)
}

export const mapCenter = [28.4595, 77.0266] as [number, number]
export { colors }
