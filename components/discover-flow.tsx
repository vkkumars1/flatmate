'use client'

import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, SlidersHorizontal, Sparkles, X, Heart, Zap, MapPin, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getDiscover, swipe } from '@/lib/mock-api'

type DiscoverItem = { userId: string; matchId?: string; name: string; age: number; city: string; photos?: string[]; score: number; topReasons: string[]; lifestyleChips: { label: string; same: boolean }[]; budgetMin: number; budgetMax: number }
type SwipeAction = 'like' | 'pass' | 'super'

const breakdown = [
  ['Sleep', 25, 96], ['Cleanliness', 20, 88], ['Smoking / drinking', 15, 100], ['Guests / noise', 15, 78], ['Budget', 15, 91], ['Other', 10, 94],
] as const

const colors = ['#ffd4c8', '#d8f1ff', '#e5d4ff', '#c8ff3d', '#f8d765']

function Score({ value }: { value: number }) {
  return <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-[#111] bg-[#c8ff3d] font-display text-2xl font-extrabold shadow-[4px_4px_0_#111]"><span>{value}%</span><span className="absolute -bottom-3 font-mono text-[8px] font-bold uppercase tracking-[.16em]">match</span></div>
}

function MatchOverlay({ match, onClose }: { match: DiscoverItem; onClose: () => void }) {
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[70] grid place-items-center bg-[#ff4d2e] p-5"><div className="relative w-full max-w-xl overflow-hidden border-2 border-[#111] bg-[#f4efe6] p-7 text-center shadow-[10px_10px_0_#111] md:p-12"><div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: 'radial-gradient(#111 1px, transparent 1px)', backgroundSize: '18px 18px' }} /><Sparkles className="absolute left-7 top-7" /><Sparkles className="absolute right-8 top-16 text-[#ff4d2e]" /><p className="relative font-mono text-[10px] font-bold uppercase tracking-[.2em]">Good chemistry, great timing</p><div className="relative my-8 flex items-center justify-center gap-[-8px]"><motion.div initial={{ x: -80, rotate: -12 }} animate={{ x: 0, rotate: -7 }} className="grid h-28 w-28 place-items-center border-2 border-[#111] text-4xl shadow-[5px_5px_0_#111]" style={{ background: colors[0] }}>{match.name.charAt(0)}</motion.div><motion.div initial={{ x: 80, rotate: 12 }} animate={{ x: 0, rotate: 7 }} className="-ml-5 grid h-28 w-28 place-items-center border-2 border-[#111] bg-[#c8ff3d] text-4xl shadow-[5px_5px_0_#111]">Y</motion.div></div><h2 className="relative font-display text-6xl font-extrabold leading-none tracking-[-.08em] md:text-8xl">It&apos;s a match!</h2><p className="relative mx-auto mt-5 max-w-sm text-sm leading-6 text-[#111]/70">You and {match.name} both said yes. Start with a hello or keep exploring the neighborhood.</p><div className="relative mt-8 grid gap-3 sm:grid-cols-2"><Link href={`/matches/${match.matchId ?? match.userId}`} className="border-2 border-[#111] bg-[#c8ff3d] px-5 py-4 font-mono text-[11px] font-bold uppercase shadow-[4px_4px_0_#111] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none">Say hi</Link><button onClick={onClose} className="border-2 border-[#111] bg-white px-5 py-4 font-mono text-[11px] font-bold uppercase shadow-[4px_4px_0_#111] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none">Keep swiping</button></div></div></motion.div>
}

function FilterDrawer({ onClose }: { onClose: () => void }) {
  const [city, setCity] = useState('All cities')
  const [budget, setBudget] = useState('Any budget')
  const [deal, setDeal] = useState('No smoking')
  return <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 330, damping: 30 }} className="fixed inset-y-0 right-0 z-[65] w-full max-w-sm border-l-2 border-[#111] bg-[#f4efe6] p-6 shadow-[-8px_0_0_#111]"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#ff4d2e]">Dial it in</p><h2 className="font-display text-4xl font-extrabold tracking-[-.07em]">Filters</h2></div><button onClick={onClose} aria-label="Close filters" className="grid h-10 w-10 place-items-center border-2 border-[#111] bg-white"><X size={18} /></button></div><div className="mt-10 space-y-7">{[['City', city, setCity, ['All cities', 'Gurugram', 'Bangalore', 'Pune', 'Delhi', 'Mumbai']], ['Budget', budget, setBudget, ['Any budget', '₹10k–₹20k', '₹20k–₹35k', '₹35k+']], ['Deal-breaker', deal, setDeal, ['No smoking', 'No pets', 'No parties']]].map(([label, value, setter, options]) => <div key={label as string}><label className="font-mono text-[10px] font-bold uppercase tracking-[.14em]">{label as string}</label><div className="mt-3 grid gap-2">{(options as string[]).map((option) => <button key={option} onClick={() => (setter as (v: string) => void)(option)} className={`border-2 border-[#111] px-4 py-3 text-left text-sm font-semibold transition ${value === option ? 'bg-[#c8ff3d] shadow-[3px_3px_0_#111]' : 'bg-white hover:-translate-y-0.5'}`}>{option}</button>)}</div></div>)}</div><button onClick={onClose} className="mt-10 w-full border-2 border-[#111] bg-[#ff4d2e] px-5 py-4 font-mono text-[11px] font-bold uppercase text-white shadow-[4px_4px_0_#111]">Apply filters</button></motion.aside>
}

export default function DiscoverFlow() {
  const [cards, setCards] = useState<DiscoverItem[]>([])
  const [cursor, setCursor] = useState<string | undefined>()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [match, setMatch] = useState<DiscoverItem | null>(null)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const dragX = useMotionValue(0)
  const rotate = useTransform(dragX, [-220, 220], [-15, 15])
  const likeOpacity = useTransform(dragX, [0, 120], [0, 1])
  const passOpacity = useTransform(dragX, [-120, 0], [1, 0])
  const pending = useRef(new Set<string>())

  const load = useCallback(async (next?: string) => {
    const result = await getDiscover(next)
    setCards((current) => next ? [...current, ...result.items] : result.items)
    setCursor(result.nextCursor)
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])
  useEffect(() => { if (cards.length <= 5 && cursor) void load(cursor) }, [cards.length, cursor, load])
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(''), 2800); return () => window.clearTimeout(id) }, [toast])

  const active = cards[0]
  const sendSwipe = useCallback(async (action: SwipeAction) => {
    if (!active || pending.current.has(active.userId)) return
    pending.current.add(active.userId)
    const removed = active
    setCards((current) => current.slice(1))
    setExpanded(null)
    try {
      const result = await swipe(removed.userId, action)
      if (result.matched && action !== 'pass') setMatch({ ...removed, matchId: result.matchId })
    } catch {
      setCards((current) => [removed, ...current])
      setToast('That didn’t stick. We put them back.')
    } finally { pending.current.delete(removed.userId) }
  }, [active])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (match || (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)))) return
      if (event.key === 'ArrowLeft') { event.preventDefault(); void sendSwipe('pass') }
      if (event.key === 'ArrowRight') { event.preventDefault(); void sendSwipe('like') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [match, sendSwipe])

  const avatars = useMemo(() => cards.slice(0, 3), [cards])
  return <main className="mx-auto min-h-screen max-w-7xl px-5 pb-32 pt-8 md:px-8 md:pb-16 md:pt-14"><header className="mb-8 flex items-end justify-between gap-5"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#ff4d2e]">The good kind of complicated</p><h1 className="mt-2 font-display text-5xl font-extrabold leading-[.88] tracking-[-.08em] md:text-7xl">Find your<br /><span className="italic text-[#ff4d2e]">flat person.</span></h1></div><button onClick={() => setFilterOpen(true)} className="grid h-12 w-12 shrink-0 place-items-center border-2 border-[#111] bg-[#c8ff3d] shadow-[4px_4px_0_#111] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none" aria-label="Open filters"><SlidersHorizontal size={20} /></button></header><div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start"><section><div className="relative mx-auto min-h-[560px] max-w-[560px]">{loading && <div className="grid h-[560px] place-items-center border-2 border-[#111] bg-white font-mono text-xs uppercase tracking-[.16em]">Finding your people...</div>}{!loading && !active && <div className="grid h-[560px] place-items-center border-2 border-[#111] bg-[#c8ff3d] p-8 text-center shadow-[8px_8px_0_#111]"><div><RotateCcw className="mx-auto mb-5" size={32} /><h2 className="font-display text-5xl font-extrabold tracking-[-.08em]">You&apos;ve seen everyone nearby</h2><p className="mt-4 text-sm text-[#111]/70">Try widening your city or budget filters to find a new flatmate orbit.</p><button onClick={() => setFilterOpen(true)} className="mt-7 border-2 border-[#111] bg-white px-5 py-3 font-mono text-[10px] font-bold uppercase shadow-[3px_3px_0_#111]">Widen filters</button></div></div>}{!loading && active && <>{avatars.slice().reverse().map((card, index) => { const isTop = index === avatars.length - 1; return <motion.article key={card.userId} className="absolute inset-x-0 top-0 mx-auto h-[560px] max-w-[560px] border-2 border-[#111] bg-white p-5 shadow-[8px_8px_0_#111]" style={{ zIndex: index + 1, scale: isTop ? 1 : .96 - (avatars.length - 1 - index) * .035, y: isTop ? 0 : (avatars.length - 1 - index) * 14, opacity: isTop ? 1 : .7, rotate: isTop ? rotate : (index % 2 ? -3 : 3) }} drag={isTop ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={.95} onDragEnd={(_, info) => { if (info.offset.x > 120) void sendSwipe('like'); else if (info.offset.x < -120) void sendSwipe('pass') }} onClick={() => isTop && setExpanded(expanded === card.userId ? null : card.userId)}><div className="relative flex h-64 items-end overflow-hidden border-2 border-[#111] p-5" style={{ background: colors[index % colors.length] }}>{card.photos?.[0] && <img src={card.photos[0]} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover" />}<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden="true" /><div className="absolute right-5 top-5 grid h-14 w-14 place-items-center rounded-full border-2 border-[#111] bg-[#c8ff3d] font-display text-lg font-extrabold shadow-[3px_3px_0_#111]">{card.score}%</div><div className="absolute left-6 top-7 h-32 w-28 rotate-[-8deg] border-2 border-[#111] bg-white/30" /><div className="relative text-white drop-shadow-[0_1px_3px_rgba(0,0,0,.6)]"><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em]">#{card.userId.replace('u_', '')}</p><h2 className="font-display text-6xl font-extrabold leading-none tracking-[-.09em]">{card.name.charAt(0)}</h2></div><motion.div style={{ opacity: isTop ? likeOpacity : 0 }} className="absolute right-6 top-8 rotate-[-12deg] border-4 border-[#3c7a19] px-3 py-2 font-mono text-2xl font-bold text-[#3c7a19]">LIKE</motion.div><motion.div style={{ opacity: isTop ? passOpacity : 0 }} className="absolute left-6 top-8 rotate-[-12deg] border-4 border-[#ff4d2e] px-3 py-2 font-mono text-2xl font-bold text-[#ff4d2e]">PASS</motion.div></div><div className="mt-5 flex items-start justify-between gap-4"><div><h3 className="font-display text-4xl font-extrabold tracking-[-.07em]">{card.name}, {card.age}</h3><p className="mt-1 flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[.12em] text-[#111]/60"><MapPin size={13} />{card.city}</p><div className="mt-4 flex flex-wrap gap-2">{card.lifestyleChips.map((chip) => <span key={chip.label} className={`border border-[#111] px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider ${chip.same ? 'bg-[#dfff9e]' : 'bg-[#ffd4c8]'}`}>{chip.label}</span>)}</div></div><div className="hidden sm:block"><p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#111]/50">Budget</p><p className="mt-1 font-display text-2xl font-bold">₹{Math.round(card.budgetMin / 1000)}k–₹{Math.round(card.budgetMax / 1000)}k</p></div></div>{expanded === card.userId && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-5 border-t-2 border-[#111] pt-4"><div className="grid gap-2">{breakdown.map(([label, weight, value]) => <div key={label}><div className="mb-1 flex justify-between font-mono text-[9px] font-bold uppercase tracking-wider"><span>{label} <span className="text-[#111]/40">{weight}%</span></span><span>{value}%</span></div><div className="h-2 border border-[#111] bg-[#f4efe6]"><motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} className="h-full bg-[#ff4d2e]" /></div></div>)}</div></motion.div>}</motion.article> })}</>}</div><div className="mx-auto mt-7 flex max-w-[560px] items-center justify-center gap-3"><button onClick={() => void sendSwipe('pass')} className="grid h-14 w-14 place-items-center rounded-full border-2 border-[#111] bg-white shadow-[3px_3px_0_#111] transition hover:-translate-y-1" aria-label="Pass"><X /></button><button onClick={() => void sendSwipe('super')} className="grid h-14 w-14 place-items-center rounded-full border-2 border-[#111] bg-[#f8d765] shadow-[3px_3px_0_#111] transition hover:-translate-y-1" aria-label="Super-like"><Zap /></button><button onClick={() => void sendSwipe('like')} className="grid h-14 w-14 place-items-center rounded-full border-2 border-[#111] bg-[#c8ff3d] shadow-[3px_3px_0_#111] transition hover:-translate-y-1" aria-label="Like"><Heart fill="currentColor" /></button></div><p className="mt-4 text-center font-mono text-[9px] font-bold uppercase tracking-[.15em] text-[#111]/45"><ArrowLeft size={12} className="mr-1 inline" /> pass <span className="mx-2">•</span> like <ArrowRight size={12} className="ml-1 inline" /> <span className="ml-2">tap a card to expand</span></p></section><aside className="space-y-5"><div className="border-2 border-[#111] bg-[#c8ff3d] p-5 shadow-[5px_5px_0_#111]"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em]">Your vibe score</p><p className="mt-3 font-display text-5xl font-extrabold tracking-[-.08em]">92%</p></div><Sparkles size={23} /></div><p className="mt-4 text-sm leading-5">Your profile is dialled in. Keep your deal-breakers honest and the good matches get easier.</p></div><div className="border-2 border-[#111] bg-white p-5 shadow-[5px_5px_0_#111]"><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#ff4d2e]">How this works</p><ol className="mt-5 space-y-4">{['We show the best fit first', 'Like, pass, or super-like', 'Chat only after a mutual yes'].map((text, i) => <li key={text} className="flex gap-3 text-sm font-semibold"><span className="grid h-6 w-6 shrink-0 place-items-center border-2 border-[#111] bg-[#f4efe6] font-mono text-[10px]">0{i + 1}</span>{text}</li>)}</ol></div><Link href="/onboarding" className="flex items-center justify-between border-2 border-[#111] bg-[#ff4d2e] px-5 py-4 font-mono text-[10px] font-bold uppercase text-white shadow-[5px_5px_0_#111] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-none">Tune your profile <ChevronDown size={16} /></Link></aside></div><AnimatePresence>{filterOpen && <FilterDrawer onClose={() => setFilterOpen(false)} />}{match && <MatchOverlay match={match} onClose={() => setMatch(null)} />}</AnimatePresence>{toast && <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 border-2 border-[#111] bg-white px-4 py-3 font-mono text-[10px] font-bold uppercase shadow-[4px_4px_0_#111]">{toast}</motion.div>}</main>
}
