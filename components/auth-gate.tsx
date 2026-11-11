'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Lock } from 'lucide-react'

const PUBLIC_PREFIXES = ['/', '/waking-up', '/onboarding', '/not-found', '/error']
const PROTECTED_PREFIXES = ['/discover', '/matches', '/listings', '/profile', '/admin', '/pricing']

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const reduceMotion = useReducedMotion()

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const isPublic = PUBLIC_PREFIXES.includes(pathname)
  const needsGate = isProtected && !user && !isPublic

  if (!needsGate) return <>{children}</>

  return (
    <div className="relative">
      <div aria-hidden="true" inert className="pointer-events-none select-none blur-md saturate-50 brightness-95">
        {children}
      </div>
      <motion.div role="dialog" aria-modal="true" aria-labelledby="auth-gate-title" className="fixed inset-0 z-50 flex items-center justify-center bg-[#111]/35 px-5 backdrop-blur-md" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.div className="w-full max-w-md border-2 border-[#111] bg-[#f4efe6] p-7 shadow-[6px_6px_0_#111]" initial={reduceMotion ? false : { opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .24, ease: 'easeOut' }}>
          <div className="mb-4 inline-flex items-center gap-2 border border-[#111] bg-[#c8ff3d] px-2 py-1 font-mono text-[9px] uppercase tracking-[.18em]">
            <Lock size={12} strokeWidth={3} /> Sign in required
          </div>
          <h2 id="auth-gate-title" className="font-display text-3xl font-extrabold tracking-[-.04em]">
            Sign in to keep exploring
          </h2>
          <p className="mt-3 text-sm text-[#111]/70">
            Create an account or sign in with your email to explore flatmates, matches, listings, and more.
          </p>
          <Link
            href="/onboarding"
            className="mt-6 inline-flex w-full items-center justify-center border-2 border-[#111] bg-[#ff4d2e] px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[.16em] text-white shadow-[4px_4px_0_#111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Continue with email
          </Link>
          <Link
            href="/"
            className="mt-3 block text-center font-mono text-[10px] uppercase tracking-[.16em] text-[#111]/60 underline"
          >
            Back to home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
