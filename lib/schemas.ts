import { z } from 'zod'

export const bioSchema = z.string().trim().max(300, 'Keep your bio under 300 characters')
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(100) })
export type LoginInput = z.infer<typeof loginSchema>
