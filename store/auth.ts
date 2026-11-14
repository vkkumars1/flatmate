import { create } from 'zustand'
import { mockUser } from '@/lib/mocks'

type User = typeof mockUser
type AuthState = { user: User | null; accessToken: string | null; sessionHydrated: boolean; setSession: (user: User, token: string) => void; clearSession: () => void; markSessionHydrated: () => void }
export const useAuthStore = create<AuthState>((set) => ({ user: null, accessToken: null, sessionHydrated: false, setSession: (user, accessToken) => set({ user, accessToken }), clearSession: () => set({ user: null, accessToken: null }), markSessionHydrated: () => set({ sessionHydrated: true }) }))
