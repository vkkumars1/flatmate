import { create } from 'zustand'
import { mockUser } from '@/lib/mocks'

type User = typeof mockUser
type AuthState = { user: User | null; accessToken: string | null; setSession: (user: User, token: string) => void; clearSession: () => void }
export const useAuthStore = create<AuthState>((set) => ({ user: null, accessToken: null, setSession: (user, accessToken) => set({ user, accessToken }), clearSession: () => set({ user: null, accessToken: null }) }))
