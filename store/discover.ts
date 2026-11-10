import { create } from 'zustand'
import type { mockListings } from '@/lib/mocks'
type Listing = (typeof mockListings)[number]
export const useDiscoverStore = create<{ listings: Listing[]; setListings: (listings: Listing[]) => void }>((set) => ({ listings: [], setListings: (listings) => set({ listings }) }))
