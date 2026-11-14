'use client'

import { useEffect, useRef } from 'react'
import { hydrateSession } from '@/lib/auth-api'
import { useAuthStore } from '@/store/auth'

export function AuthBoot() {
  const ran = useRef(false)
  useEffect(() => {
    if (ran.current) return
    ran.current = true
    void hydrateSession().finally(() => useAuthStore.getState().markSessionHydrated())
  }, [])
  return null
}
