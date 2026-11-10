import { create } from 'zustand'
type Message = { id: string; text: string; sender: 'me' | 'them' }
export const useChatStore = create<{ messages: Message[]; addMessage: (message: Message) => void }>((set) => ({ messages: [], addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })) }))
