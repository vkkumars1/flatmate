'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import { chatSchema } from '@/lib/schemas'
import { getMessages, sendMessage } from '@/lib/mock-api'
import { getSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/auth'

type Message = { id: string; matchId?: string; senderId: string; text: string; createdAt: string }

const icebreakers = ['What time do you sleep?', 'Do you cook?', 'Weekend guests okay?']

export function RealtimeChat({ matchId, name }: { matchId: string; name: string }) {
  const user = useAuthStore((state) => state.user)
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [connected, setConnected] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const socketRef = useRef<ReturnType<typeof getSocket>>(null)
  const typingTimeoutRef = useRef<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { data: messages = [], error: loadError, mutate } = useSWR<Message[]>(
    ['match-messages', matchId],
    () => getMessages(matchId) as Promise<Message[]>,
    { revalidateOnFocus: true, refreshInterval: 6000 },
  )

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    socketRef.current = socket
    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    const onMessage = (message: Message) => {
      if (message.matchId !== matchId) return
      void mutate((current) => current?.some((item) => item.id === message.id) ? current : [...(current ?? []), message], false)
    }
    const onTyping = (event: { matchId: string; userId: string }) => {
      if (event.matchId !== matchId || event.userId === user?.id) return
      setTyping(true)
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = window.setTimeout(() => setTyping(false), 1800)
    }
    const onRead = (event: { matchId: string }) => {
      if (event.matchId === matchId) setTyping(false)
    }
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('message', onMessage)
    socket.on('typing', onTyping)
    socket.on('read', onRead)
    socket.on('connect_error', onDisconnect)
    if (socket.connected) onConnect()
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('message', onMessage)
      socket.off('typing', onTyping)
      socket.off('read', onRead)
      socket.off('connect_error', onDisconnect)
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current)
      socketRef.current = null
    }
  }, [matchId, mutate, user?.id])

  useEffect(() => {
    if (connected && messages.length) socketRef.current?.emit('read', { matchId })
  }, [connected, matchId, messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  async function submit(value = text) {
    const parsed = chatSchema.safeParse(value)
    if (!parsed.success || sending) return
    setError('')
    setSending(true)
    try {
      const sent = await sendMessage(matchId, parsed.data)
      await mutate((current) => current?.some((message) => message.id === sent.id) ? current : [...(current ?? []), sent as Message], false)
      setText('')
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Your message could not be sent.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <section aria-label={`Conversation with ${name}`} className="flex min-h-[560px] flex-col overflow-hidden rounded-[1.75rem] bg-white/80 shadow-[0_24px_65px_-40px_rgba(30,30,30,.45)] backdrop-blur">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <p className="font-semibold">A little more like home</p>
          <span className="inline-flex items-center gap-2 text-xs text-black/55"><span className={`size-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-400'}`} />{connected ? 'Live' : 'Reconnecting'}</span>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6" aria-live="polite" aria-relevant="additions text">
          {loadError && <p role="alert" className="text-sm text-[#d92d20]">Could not load this conversation. It will retry automatically.</p>}
          {!messages.length && !loadError && <p className="rounded-2xl bg-[#f4efe6] p-4 text-sm text-black/60">Say hello when you&apos;re ready. Your chat stays just between you two.</p>}
          {messages.map((message) => {
            const mine = message.senderId === user?.id
            return <motion.div key={message.id} initial={{ opacity: 0, y: 8, scale: .98 }} animate={{ opacity: 1, y: 0 }} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <p className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${mine ? 'rounded-br-md bg-[#c8ff3d] text-[#111]' : 'rounded-bl-md bg-[#f4efe6] text-[#111]'}`}>{message.text}</p>
            </motion.div>
          })}
          {typing && <p className="text-xs text-black/50" aria-live="polite">{name} is typing…</p>}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-black/5 p-4">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">{icebreakers.map((icebreaker) => <button key={icebreaker} type="button" onClick={() => setText(icebreaker)} className="shrink-0 rounded-full bg-[#f4efe6] px-3 py-2 text-xs transition hover:bg-[#c8ff3d]">{icebreaker}</button>)}</div>
          <form onSubmit={(event) => { event.preventDefault(); void submit() }} className="flex items-center gap-2 rounded-2xl bg-[#f4efe6] p-2 transition focus-within:bg-[#f4efe6]/70">
            <input value={text} onChange={(event) => { setText(event.target.value); if (event.target.value) socketRef.current?.emit('typing', { matchId }) }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return; event.preventDefault(); void submit() } }} aria-label="Message" autoComplete="off" className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-sm outline-none ring-0 placeholder:text-black/40 focus-visible:ring-0" placeholder={`Message ${name}`} maxLength={1000} />
            <button type="submit" aria-label="Send message" disabled={sending || !text.trim()} className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#ff4d2e] text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45"><Send size={17} /></button>
          </form>
          {error && <p role="alert" className="mt-2 text-xs text-[#d92d20]">{error}</p>}
        </div>
      </section>
      <MeetupCard />
    </div>
  )
}

function MeetupCard() {
  const [open, setOpen] = useState(false)
  return <aside className="self-start rounded-[1.5rem] bg-[#c8ff3d] p-5 shadow-[0_18px_40px_-30px_rgba(17,17,17,.7)]"><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em]">Good next step</p><h3 className="mt-2 font-display text-4xl leading-none">Meet IRL.</h3><ol className="mt-5 flex flex-col gap-3">{['Chat', 'Video call', 'Meet in a public place'].map((step, index) => <li key={step} className="flex items-center gap-3 font-mono text-[10px] font-bold uppercase"><span className="grid size-7 place-items-center rounded-full bg-white">{index + 1}</span>{step}</li>)}</ol><button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="mt-5 flex items-center gap-2 font-mono text-[10px] font-bold uppercase underline">Safety tips</button>{open && <p className="mt-3 border-t border-black/15 pt-3 text-xs leading-relaxed">Tell someone where you are going, meet during the day, and keep your own transport home.</p>}</aside>
}
