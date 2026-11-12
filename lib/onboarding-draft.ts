import type { OnboardingData } from '@/lib/schemas'

const DATABASE_NAME = 'flatfit-onboarding'
const STORE_NAME = 'drafts'
const DRAFT_KEY = 'current'

export type OnboardingDraft = { data: OnboardingData; stepIndex: number }

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open saved profile draft'))
  })
}

export async function loadOnboardingDraft(): Promise<OnboardingDraft | null> {
  if (typeof indexedDB === 'undefined') return null
  const database = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(DRAFT_KEY)
      request.onsuccess = () => resolve((request.result as OnboardingDraft | undefined) ?? null)
      request.onerror = () => reject(request.error ?? new Error('Could not read saved profile draft'))
    })
  } finally {
    database.close()
  }
}

export async function saveOnboardingDraft(draft: OnboardingDraft): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  const database = await openDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(draft, DRAFT_KEY)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error ?? new Error('Could not save profile draft'))
    })
  } finally {
    database.close()
  }
}

export async function clearOnboardingDraft(): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  const database = await openDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(DRAFT_KEY)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error ?? new Error('Could not clear saved profile draft'))
    })
  } finally {
    database.close()
  }
}
