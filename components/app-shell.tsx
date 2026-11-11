'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Lenis from 'lenis'
import { Compass, Heart, Home, UserRound, LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AuthGate } from './auth-gate'
import { useAuthStore } from '@/store/auth'
import { logout } from '@/lib/auth-api'

const tabs = [
  { label: 'Discover', href: '/discover', icon: Compass },
  { label: 'Matches', href: '/matches', icon: Heart },
  { label: 'Listings', href: '/listings', icon: Home },
  { label: 'Profile', href: '/profile', icon: UserRound },
]

function AuthButton() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  async function handleLogout() {
    await logout()
    router.push('/')
  }
  if (user) {
    return (
      <button
        onClick={handleLogout}
        className="inline-flex items-center gap-1.5 border-2 border-[#111] bg-[#c8ff3d] px-4 py-2 font-mono text-[10px] font-bold uppercase shadow-[3px_3px_0_#111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
      >
        <LogOut size={12} strokeWidth={3} />
        Logout
      </button>
    )
  }
  return (
    <Link
      href="/onboarding"
      className="border-2 border-[#111] bg-[#ff4d2e] px-4 py-2 font-mono text-[10px] font-bold uppercase text-white shadow-[3px_3px_0_#111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
    >
      Sign in
    </Link>
  )
}

function Navbar() {
  const pathname = usePathname()
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between border-b border-[#111]/15 px-5 py-5 md:px-8">
      <Link href="/" className="font-display text-3xl font-extrabold tracking-[-.08em]">
        flat<span className="text-[#ff4d2e]">fit</span>
        <sup className="ml-1 align-top font-mono text-[9px] tracking-normal">IN</sup>
      </Link>
      <nav className="hidden items-center gap-7 md:flex">
        {tabs.slice(0, 3).map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative py-2 font-mono text-[10px] font-bold uppercase tracking-[.16em] transition-colors hover:text-[#ff4d2e] ${
              pathname.startsWith(tab.href)
                ? 'text-[#ff4d2e] after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-[#ff4d2e]'
                : ''
            }`}
          >
            {tab.label}
          </Link>
        ))}
        <AuthButton />
      </nav>
    </header>
  )
}

function TabBar() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t-2 border-[#111] bg-[#f4efe6] pb-[env(safe-area-inset-bottom)] md:hidden">
      {tabs.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex flex-col items-center gap-1 py-3 font-mono text-[9px] uppercase tracking-wider ${
            pathname.startsWith(href) ? 'text-[#ff4d2e]' : ''
          }`}
        >
          <Icon size={18} strokeWidth={2.5} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  useEffect(() => {
    if (reduce) return
    const lenis = new Lenis({ duration: 1.1 })
    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [reduce])
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
        >
          <AuthGate>{children}</AuthGate>
        </motion.main>
      </AnimatePresence>
      <TabBar />
    </div>
  )
}
