'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Lock } from 'lucide-react'

const PUBLIC_PREFIXES = ['/', '/waking-up', '/onboarding', '/not-found', '/error']
const PROTECTED_PREFIXES = ['/discover', '/matches', '/listings/new', '/profile', '/admin', '/pricing']

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const isPublic = PUBLIC_PREFIXES.includes(pathname)
  const needsGate = isProtected && !user && !isPublic

  if (!needsGate) return <>{children}</>

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none select-none blur-md saturate-50 brightness-95">
        {children}
      </div>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111]/30 backdrop-blur-sm px-5">
        <div className="w-full max-w-md border-2 border-[#111] bg-[#f4efe6] p-7 shadow-[6px_6px_0_#111]">
          <div className="mb-4 inline-flex items-center gap-2 border border-[#111] bg-[#c8ff3d] px-2 py-1 font-mono text-[9px] uppercase tracking-[.18em]">
            <Lock size={12} strokeWidth={3} /> Sign in required
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-[-.04em]">
            Verify your phone to continue
          </h2>
          <p className="mt-3 text-sm text-[#111]/70">
            FlatFit needs a quick phone check before showing flatmates, matches, listings or the upgrade page. Takes 10 seconds.
          </p>
          <Link
            href="/onboarding"
            className="mt-6 inline-flex w-full items-center justify-center border-2 border-[#111] bg-[#ff4d2e] px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[.16em] text-white shadow-[4px_4px_0_#111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Sign in with phone
          </Link>
          <Link
            href="/"
            className="mt-3 block text-center font-mono text-[10px] uppercase tracking-[.16em] text-[#111]/60 underline"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
