'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, ChevronDown, Info, Send, ShieldCheck, Sparkles, Video, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { acceptAgreement, getAgreement, getCompatibility, getMatches, getMessages, saveAgreement, sendMessage, type AgreementRecord } from '@/lib/mock-api'
import { getSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/auth'
import { chatSchema } from '@/lib/schemas'

type Match = { matchId: string; otherUser: { id: string; name: string; age: number; city: string; occupation: string; avatar: string }; score: number; lastMessage: string; unreadCount: number }
type Message = { id: string; senderId: string; text: string; createdAt: string }

const icebreakers = ['What time do you sleep?', 'Do you cook?', 'Weekend guests okay?']
const rules = ['Guests', 'Quiet hours', 'Dishes', 'Bills', 'Cleaning', 'Smoking', 'Pets']

function ScoreRing({ score }: { score: number }) { return <div className="relative mx-auto flex size-44 items-center justify-center rounded-full" style={{ background: `conic-gradient(#ff4d2e ${score * 3.6}deg, #ded8ce 0deg)` }}><div className="flex size-32 items-center justify-center rounded-full bg-[#f4efe6]"><div className="text-center"><span className="font-display text-5xl leading-none">{score}</span><span className="font-mono text-xl">%</span><p className="font-mono text-[9px] font-bold uppercase tracking-widest">compatible</p></div></div></div> }

function ChatTab({ matchId, name }: { matchId: string; name: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [read, setRead] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const currentUserId = useAuthStore((state) => state.user?.id)

  useEffect(() => {
    let active = true
    let typingTimeout: number | undefined
    const socket = getSocket()
    const onMessage = (message: Message & { matchId?: string }) => {
      if (message.matchId !== matchId) return
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message])
      socket.emit('read', { matchId })
    }
    const onRead = (event: { matchId: string }) => {
      if (event.matchId === matchId) setRead(true)
    }
    const onTyping = (event: { matchId: string; userId: string }) => {
      if (event.matchId !== matchId || event.userId === currentUserId) return
      setTyping(true)
      window.clearTimeout(typingTimeout)
      typingTimeout = window.setTimeout(() => setTyping(false), 1800)
    }

    void getMessages(matchId).then((items) => {
      if (active) setMessages(items as Message[])
      socket.emit('read', { matchId })
    }).catch(() => { if (active) setError('Could not load this conversation.') })
    socket.on('message', onMessage)
    socket.on('typing', onTyping)
    socket.on('read', onRead)
    return () => {
      active = false
      window.clearTimeout(typingTimeout)
      socket.off('message', onMessage)
      socket.off('typing', onTyping)
      socket.off('read', onRead)
    }
  }, [matchId, currentUserId])

  async function submit(value = text) {
    const parsed = chatSchema.safeParse(value)
    if (!parsed.success || sending) return
    setSending(true)
    setError('')
    try {
      const message = await sendMessage(matchId, parsed.data)
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message as Message])
      setRead(false)
      setText('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Message could not be sent.')
    } finally {
      setSending(false)
    }
  }

  return <div className="grid gap-6 lg:grid-cols-[1fr_280px]"><div className="flex min-h-[560px] flex-col border-2 border-[#111] bg-white"><div className="max-h-[65vh] min-h-[360px] flex-1 space-y-4 overflow-y-auto p-4 md:p-6" aria-live="polite">{messages.map((message) => <motion.div key={message.id} initial={{ opacity: 0, y: 10, scale: .96 }} animate={{ opacity: 1, y: 0 }} className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}><p className={`max-w-[80%] border-2 border-[#111] px-4 py-3 text-sm ${message.senderId === currentUserId ? 'bg-[#c8ff3d]' : 'bg-[#f4efe6]'}`}>{message.text}</p>{message.senderId === currentUserId && <span className="ml-2 self-end font-mono text-[9px] text-[#111]/50" aria-label={read ? 'Read' : 'Sent'}>{read ? 'Read' : 'Sent'}</span>}</motion.div>)}{typing && <p className="font-mono text-xs text-[#111]/60" role="status">{name} is typing…</p>}</div><div className="border-t-2 border-[#111] p-4"><div className="mb-3 flex gap-2 overflow-x-auto pb-1">{icebreakers.map((icebreaker) => <button type="button" key={icebreaker} onClick={() => setText(icebreaker)} className="shrink-0 border border-[#111] px-2 py-1 font-mono text-[9px] font-bold uppercase transition hover:bg-[#c8ff3d]">{icebreaker}</button>)}</div><form onSubmit={(event) => { event.preventDefault(); void submit() }} className="flex gap-2"><input value={text} onChange={(event) => { setText(event.target.value); if (event.target.value.trim()) getSocket().emit('typing', { matchId }) }} onKeyDown={(event) => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault() }} aria-label="Message" className="min-w-0 flex-1 border-2 border-[#111] bg-[#f4efe6] px-3 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[#ff4d2e]" placeholder={`Message ${name}`} /><button type="submit" disabled={sending || !text.trim()} aria-label="Send message" className="grid size-12 shrink-0 place-items-center border-2 border-[#111] bg-[#ff4d2e] text-white shadow-[3px_3px_0_#111] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50"><Send size={18} /></button></form>{error && <p className="mt-3 text-sm font-medium text-[#c53030]" role="alert">{error}</p>}</div></div><MeetupCard /></div>
}

function MeetupCard() { const [open, setOpen] = useState(false); return <aside className="border-2 border-[#111] bg-[#c8ff3d] p-5 self-start"><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em]">Good next step</p><h3 className="mt-2 font-display text-4xl leading-none">Meet IRL.</h3><ol className="mt-5 space-y-3">{['Chat', 'Video call', 'Meet in a public place'].map((step, index) => <li key={step} className="flex items-center gap-3 font-mono text-[10px] font-bold uppercase"><span className="grid size-7 place-items-center border-2 border-[#111] bg-white">{index + 1}</span>{step}</li>)}</ol><button onClick={() => setOpen(!open)} className="mt-5 flex items-center gap-2 font-mono text-[10px] font-bold uppercase underline">Safety tips <Info size={14} /></button>{open && <p className="mt-3 border-t-2 border-[#111] pt-3 text-xs leading-relaxed">Tell someone where you are going, meet during the day, and keep your own transport home.</p>}</aside> }

function CompatibilityTab({ matchId }: { matchId: string }) { const [data, setData] = useState<any>(null); useEffect(() => { getCompatibility(matchId).then(setData) }, [matchId]); if (!data) return <div className="border-2 border-[#111] bg-white p-12 text-center font-mono text-xs uppercase">Loading compatibility...</div>; const breakdown = Array.isArray(data.breakdown) ? data.breakdown : Object.entries(data.breakdown).map(([label, score]) => ({ label, score, weight: 25 })); const percentage = (score: number) => Math.round(score <= 1 ? score * 100 : score); const good = data.reasons?.good ?? []; const bad = data.reasons?.bad ?? []; return <div className="grid gap-8 lg:grid-cols-[260px_1fr]"><div className="border-2 border-[#111] bg-white p-8"><ScoreRing score={data.score} /></div><div className="space-y-6"><div className="border-2 border-[#111] bg-white p-5"><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#ff4d2e]">Breakdown</p><div className="mt-5 space-y-4">{breakdown.map((item: any) => <div key={item.label}><div className="flex justify-between font-mono text-[10px] font-bold uppercase"><span>{item.label}</span><span>{percentage(item.score)}%</span></div><div className="mt-2 h-3 border-2 border-[#111] bg-[#f4efe6]"><motion.div initial={{ width: 0 }} animate={{ width: `${percentage(item.score)}%` }} className="h-full bg-[#ff4d2e]" /></div></div>)}</div></div><div className="grid gap-4 md:grid-cols-2"><div className="border-2 border-[#111] bg-[#c8ff3d] p-5"><h3 className="font-display text-3xl">Why you match</h3><ul className="mt-4 space-y-2 font-mono text-[10px] font-bold uppercase">{good.length ? good.map((reason: string) => <li key={reason}>+ {reason}</li>) : <li>+ Your profiles have a shared starting point</li>}</ul></div><div className="border-2 border-[#111] bg-[#ff8e7b] p-5"><h3 className="font-display text-3xl">Worth discussing</h3><ul className="mt-4 space-y-2 font-mono text-[10px] font-bold uppercase">{bad.length ? bad.map((reason: string) => <li key={reason}>- {reason}</li>) : <li>- Keep talking through your house preferences</li>}</ul></div></div></div></div> }

function AgreementTab({ matchId, otherUserId }: { matchId: string; otherUserId: string }) { const [selected, setSelected] = useState<string[]>([]); const [agreement, setAgreement] = useState<AgreementRecord | null>(null); const [celebrate, setCelebrate] = useState(false); const currentUserId = useAuthStore((state) => state.user?.id); const isA = Boolean(currentUserId && currentUserId < otherUserId); const accepted = Boolean(agreement && (isA ? agreement.acceptedByA : agreement.acceptedByB)); const otherAccepted = Boolean(agreement && (isA ? agreement.acceptedByB : agreement.acceptedByA)); useEffect(() => { getAgreement(matchId).then((value) => { setAgreement(value); setSelected(Array.isArray(value?.rules) ? value.rules : []) }) }, [matchId]); function toggle(rule: string) { setSelected((current) => current.includes(rule) ? current.filter((item) => item !== rule) : [...current, rule]) } async function accept() { const saved = await saveAgreement(matchId, selected); const updated = await acceptAgreement(saved.id) as AgreementRecord; setAgreement(updated); setCelebrate(true); window.setTimeout(() => setCelebrate(false), 2200) } return <div className="grid gap-8 lg:grid-cols-[1fr_300px]"><div className="border-2 border-[#111] bg-white p-5 md:p-8"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#ff4d2e]">House rules</p><h2 className="mt-2 font-display text-5xl">Make it easy.</h2></div><ShieldCheck size={28} /></div><div className="mt-8 space-y-2">{rules.map((rule) => <button key={rule} onClick={() => toggle(rule)} className={`flex w-full items-center justify-between border-2 border-[#111] p-4 text-left transition ${selected.includes(rule) ? 'bg-[#c8ff3d]' : 'bg-[#f4efe6]'}`}><span className="font-mono text-[10px] font-bold uppercase">{rule}</span><span className="flex items-center gap-2 text-xs">{selected.includes(rule) ? 'Agreed' : 'Discuss'} <ChevronDown size={15} /></span></button>)}</div><button onClick={() => void accept()} className="mt-6 w-full border-2 border-[#111] bg-[#ff4d2e] py-4 font-mono text-[10px] font-black uppercase tracking-widest text-white shadow-[4px_4px_0_#111]">Save and accept</button>{celebrate && <div aria-live="polite" className="pointer-events-none fixed inset-0 z-50 grid place-items-center"><div className="relative border-2 border-[#111] bg-[#c8ff3d] px-8 py-6 text-center shadow-[6px_6px_0_#111]"><div className="absolute -inset-8 -z-10 bg-[radial-gradient(circle,#ff4d2e_2px,transparent_3px)] [background-size:18px_18px]" /><p className="font-mono text-[10px] font-black uppercase tracking-widest">Your agreement is saved</p><p className="mt-2 font-display text-4xl italic">A clear start.</p></div></div>}<p className="mt-4 text-center font-mono text-[9px] uppercase tracking-wider text-[#6f6a62]">This is a friendly agreement, not a legal document.</p></div><div className="self-start border-2 border-[#111] bg-[#c8ff3d] p-5"><p className="font-mono text-[10px] font-bold uppercase tracking-widest">Status</p><div className="mt-5 space-y-4 font-mono text-[10px] font-bold uppercase"><p className="flex items-center justify-between">You {accepted ? <Check className="text-[#2fa36b]" /> : <span className="text-[#6f6a62]">Waiting</span>}</p><p className="flex items-center justify-between">Them {otherAccepted ? <Check className="text-[#2fa36b]" /> : <span className="text-[#6f6a62]">Waiting</span>}</p></div>{accepted && <motion.div initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} className="mt-6 border-t-2 border-[#111] pt-5 text-center font-display text-3xl italic">Your part is signed.</motion.div>}</div></div> }

export function MatchDetail({ matchId }: { matchId: string }) { const [match, setMatch] = useState<Match | null>(null); const [loading, setLoading] = useState(true); const [tab, setTab] = useState<'Chat' | 'Compatibility' | 'Agreement'>('Chat'); useEffect(() => { let active = true; void getMatches().then((items) => { if (active) setMatch((items as Match[]).find((item) => item.matchId === matchId) ?? null) }).catch(() => { if (active) setMatch(null) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [matchId]); if (loading) return <main className="mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-5 text-center font-mono text-xs uppercase tracking-[.16em] text-[#111]/60" role="status">Opening your conversation…</main>; if (!match) return <main className="mx-auto min-h-screen max-w-3xl px-5 py-24 text-center"><div className="mx-auto max-w-md border-2 border-[#111] bg-[#c8ff3d] p-10 shadow-[8px_8px_0_#111]"><p className="font-mono text-[10px] font-bold uppercase tracking-widest">404 / flatmate not found</p><h1 className="mt-4 font-display text-6xl leading-none">Not this one.</h1><p className="mt-4 text-sm">This match may have moved on. There are plenty more good humans out there.</p><Link href="/matches" className="mt-7 inline-flex border-2 border-[#111] bg-[#ff4d2e] px-5 py-3 font-mono text-[10px] font-bold uppercase text-white shadow-[3px_3px_0_#111]">Back to matches</Link></div></main>; return <main className="mx-auto min-h-screen max-w-6xl px-5 pb-28 pt-8 md:px-8 md:pt-12"><Link href="/matches" className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest"><ArrowLeft size={16} /> All matches</Link><div className="mt-8 flex flex-wrap items-end justify-between gap-5 border-b-2 border-[#111] pb-6"><div className="flex items-center gap-4">{match.otherUser.avatar ? <img src={match.otherUser.avatar} alt={`${match.otherUser.name} profile photo`} className="size-20 border-2 border-[#111] object-cover" /> : <span className="grid size-20 place-items-center border-2 border-[#111] bg-[#c8ff3d] font-display text-3xl font-bold" aria-hidden="true">{match.otherUser.name.charAt(0)}</span>}<div><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#ff4d2e]">{match.otherUser.occupation} / {match.otherUser.city}</p><h1 className="mt-2 font-display text-6xl leading-none">{match.otherUser.name}<span className="text-[#ff4d2e]">.</span></h1></div></div><div className="flex items-center gap-2 border-2 border-[#111] bg-[#c8ff3d] px-4 py-3 font-mono text-[10px] font-black uppercase"><Sparkles size={16} /> {match.score}% match</div></div><div className="mt-6 flex gap-1 border-b-2 border-[#111]">{(['Chat', 'Compatibility', 'Agreement'] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`border-2 border-b-0 border-[#111] px-4 py-3 font-mono text-[10px] font-bold uppercase ${tab === item ? 'bg-[#111] text-white' : 'bg-transparent'}`}>{item}</button>)}</div><div className="mt-8"><AnimatePresence mode="wait"><motion.div key={tab} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: .2 }}>{tab === 'Chat' && <ChatTab matchId={matchId} name={match.otherUser.name} />}{tab === 'Compatibility' && <CompatibilityTab matchId={matchId} />}{tab === 'Agreement' && <AgreementTab matchId={matchId} otherUserId={match.otherUser.id} />}</motion.div></AnimatePresence></div></main> }
