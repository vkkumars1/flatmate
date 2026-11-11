'use client'

import { useEffect, useRef } from 'react'
import { hydrateSession } from '@/lib/auth-api'

export function AuthBoot() {
  const ran = useRef(false)
  useEffect(() => {
    if (ran.current) return
    ran.current = true
    void hydrateSession()
  }, [])
  return null
}
