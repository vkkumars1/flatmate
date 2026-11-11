'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { signInWithGoogle } from '@/lib/google-signin'

const PUBLIC_PREFIXES = ['/', '/waking-up']

function isPublic(pathname: string) {
  if (pathname === '/') return true
  return PUBLIC_PREFIXES.some((p) => p !== '/' && pathname.startsWith(p))
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isPublic(pathname) || user) return <>{children}</>

  async function handleGoogle() {
    setError(null)
    try {
      setBusy(true)
      await signInWithGoogle()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-md" aria-hidden>{children}</div>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111]/40 px-6 backdrop-blur-sm">
        <div className="w-full max-w-sm border-2 border-[#111] bg-[#f4efe6] p-8 text-center shadow-[8px_8px_0_#111]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border-2 border-[#111] bg-[#c8ff3d]">
            <ShieldCheck size={28} strokeWidth={2.5} />
          </div>
          <h2 className="font-display text-2xl font-extrabold tracking-[-.04em]">Sign in to continue</h2>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-[#111]/70">One click with Google</p>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-3 border-2 border-[#111] bg-white px-6 py-3 font-bold shadow-[4px_4px_0_#111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.5l6.9-6.9C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.5 13.3l8 6.2C12.3 13.6 17.7 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.2 5.6c4.2-3.9 6.8-9.6 6.8-17.3z"/>
              <path fill="#FBBC05" d="M10.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-8-6.2C.9 16.6 0 20.2 0 24s.9 7.4 2.5 10.7l8-6.2z"/>
              <path fill="#34A853" d="M24 48c6.4 0 11.8-2.1 15.7-5.8l-7.2-5.6c-2 1.4-4.6 2.2-8.5 2.2-6.3 0-11.7-4.1-13.5-9.8l-8 6.2C6.5 42.6 14.6 48 24 48z"/>
            </svg>
            {busy ? 'Opening Google…' : 'Continue with Google'}
          </button>
          {error && <p className="mt-3 font-mono text-[11px] text-[#ff4d2e]">{error}</p>}
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-4 font-mono text-[10px] uppercase tracking-wider text-[#111]/60 hover:text-[#111]"
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  )
}
