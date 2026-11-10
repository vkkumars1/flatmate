'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, Bell, Heart, MoreHorizontal, Shield, UserRound, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getMatches } from '@/lib/mock-api'

type Match = { matchId: string; otherUser: { id: string; name: string; age: number; city: string; occupation: string; avatar: string }; score: number; lastMessage: string; unreadCount: number }

function ScoreRing({ score }: { score: number }) {
  return <div className="relative flex size-16 items-center justify-center rounded-full" style={{ background: `conic-gradient(#ff4d2e ${score * 3.6}deg, #ded8ce 0deg)` }}><div className="flex size-12 items-center justify-center rounded-full bg-[#f4efe6]"><span className="font-mono text-sm font-black">{score}%</span></div></div>
}

function ReportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#111]/40 p-5"><motion.div initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md border-2 border-[#111] bg-[#f4efe6] p-6 shadow-[8px_8px_0_#111]"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[#ff4d2e]">Safety first</p><h2 className="mt-2 font-display text-4xl leading-none">What happened?</h2></div><button aria-label="Close report dialog" onClick={onClose}><X /></button></div><div className="mt-6 flex flex-wrap gap-2">{['Spam', 'Harassment', 'Fake profile', 'Something else'].map((reason) => <button key={reason} onClick={onClose} className="border-2 border-[#111] px-3 py-2 font-mono text-[10px] font-bold uppercase transition hover:bg-[#c8ff3d]">{reason}</button>)}</div></motion.div></div>
}

export function MatchesList() {
  const [matches, setMatches] = useState<Match[]>([])
  const [reportOpen, setReportOpen] = useState(false)
  useEffect(() => { getMatches().then(setMatches as never) }, [])
  return <main className="mx-auto min-h-screen max-w-5xl px-5 pb-28 pt-8 md:px-8 md:pt-16"><div className="flex items-end justify-between border-b-2 border-[#111] pb-6"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#ff4d2e]">Your shortlist</p><h1 className="mt-3 font-display text-6xl leading-[.86] md:text-8xl">Matches<span className="text-[#ff4d2e]">.</span></h1></div><button aria-label="Match notifications" className="hidden border-2 border-[#111] p-3 md:block"><Bell size={18} /></button></div><div className="mt-8 space-y-3"><AnimatePresence>{matches.map((match, index) => <motion.div key={match.matchId} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .08 }} className="group relative overflow-hidden"><div className="absolute inset-y-0 right-0 flex items-center gap-2 bg-[#ff4d2e] px-4"><button onClick={() => setReportOpen(true)} className="flex flex-col items-center gap-1 font-mono text-[9px] font-bold uppercase"><AlertTriangle size={17} />Report</button><button className="flex flex-col items-center gap-1 font-mono text-[9px] font-bold uppercase"><Shield size={17} />Block</button></div><Link href={`/matches/${match.matchId}`} className="relative flex items-center gap-4 border-2 border-[#111] bg-white p-4 transition-transform hover:-translate-x-1 md:gap-6 md:p-5"><div className="relative size-20 shrink-0 overflow-hidden border-2 border-[#111] bg-[#c8ff3d]"><img src={match.otherUser.avatar} alt="" className="size-full object-cover" /><span className="absolute bottom-1 left-1 size-2 rounded-full bg-[#2fa36b] ring-2 ring-white" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-3xl leading-none">{match.otherUser.name}, {match.otherUser.age}</h2>{match.unreadCount > 0 && <span className="rounded-full bg-[#ff4d2e] px-2 py-1 font-mono text-[9px] font-black text-white">{match.unreadCount} NEW</span>}</div><p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#6f6a62]">{match.otherUser.occupation} / {match.otherUser.city}</p><p className="mt-3 truncate text-sm">{match.lastMessage}</p></div><ScoreRing score={match.score} /><ArrowRight className="hidden md:block" size={20} /></Link></motion.div>)}</AnimatePresence></div><div className="mt-8 flex items-center gap-3 border-2 border-[#111] bg-[#c8ff3d] p-4"><Heart size={18} fill="currentColor" /><p className="font-mono text-[10px] font-bold uppercase leading-relaxed tracking-wider">A good match is a conversation, not a conclusion. Take it slow.</p></div><ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} /></main>
}
