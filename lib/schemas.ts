import { z } from 'zod'

export const bioSchema = z.string().trim().max(300, 'Keep your bio under 300 characters')
export const chatSchema = z.string().trim().min(1, 'Write a message first').max(1000, 'Keep your message under 1000 characters')
export const profileSchema = z.object({ name: z.string().trim().min(2).max(80), bio: bioSchema, city: z.string().trim().min(2).max(80) })
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(100) })
export type LoginInput = z.infer<typeof loginSchema>
export type ProfileInput = z.infer<typeof profileSchema>
