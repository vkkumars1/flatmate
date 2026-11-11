import { z } from 'zod'

export const bioSchema = z.string().trim().max(300, 'Keep your bio under 300 characters')
export const chatSchema = z.string().trim().min(1, 'Write a message first').max(1000, 'Keep your message under 1000 characters')
export const profileSchema = z.object({ name: z.string().trim().min(2, 'Tell us your name').max(80), bio: bioSchema, city: z.string().trim().min(2, 'Choose your city').max(80) })
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(100) })

export const onboardingStepSchema = {
  phone: z.object({ phoneVerified: z.literal(true, { message: 'Verify your phone number to continue' }) }),
  mode: z.object({ mode: z.enum(['have-flat', 'need-flat'], { message: 'Pick the option that fits you' }) }),
  basics: z.object({ name: z.string().trim().min(2, 'Add at least 2 characters'), gender: z.string().min(1, 'Choose an option'), dob: z.string().min(1, 'Add your date of birth'), city: z.string().min(1, 'Choose your city'), occupation: z.string().trim().min(2, 'Tell us what you do') }),
  budget: z.object({ minBudget: z.number().positive(), maxBudget: z.number().gt(0), moveInDate: z.string().min(1, 'Choose a move-in date') }).refine((value) => value.maxBudget >= value.minBudget, { path: ['maxBudget'], message: 'Maximum must be higher than minimum' }),
  sleep: z.object({ sleepTime: z.number(), wakeTime: z.number() }),
  cleanliness: z.object({ cleanliness: z.number().min(1, 'Pick your broom level').max(5) }),
  habits: z.object({ habits: z.record(z.string(), z.boolean()).refine((value) => Object.keys(value).length > 0, 'Choose at least one habit') }),
  dealBreakers: z.object({ dealBreakers: z.array(z.string()).min(1, 'Pick at least one deal-breaker') }),
  photos: z.object({ photos: z.array(z.instanceof(File)).min(1, 'Add at least one photo').max(3, 'Add up to three photos') }),
  bio: z.object({ bio: bioSchema.min(20, 'Give your bio a little more detail') }),
  done: z.object({}),
}

export type OnboardingStep = keyof typeof onboardingStepSchema
export type OnboardingData = { phoneVerified: boolean; mode: string; name: string; gender: string; dob: string; city: string; occupation: string; minBudget: number; maxBudget: number; moveInDate: string; sleepTime: number; wakeTime: number; cleanliness: number; habits: Record<string, boolean>; dealBreakers: string[]; photos: File[]; bio: string }
export const onboardingSchemas = onboardingStepSchema as { [key in OnboardingStep]: z.ZodTypeAny }
export type LoginInput = z.infer<typeof loginSchema>
export type ProfileInput = z.infer<typeof profileSchema>
