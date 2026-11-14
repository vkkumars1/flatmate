'use client'

import { useEffect, useRef } from 'react'
import { hydrateSession } from '@/lib/auth-api'
import { completeGoogleRedirect } from '@/lib/google-signin'
import { useAuthStore } from '@/store/auth'

export function AuthBoot() {
  const ran = useRef(false)
  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const run = async () => {
      try { await completeGoogleRedirect() } catch {}
      await hydrateSession()
    }
    void run().finally(() => useAuthStore.getState().markSessionHydrated())
  }, [])
  return null
}
