'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import type { OnboardingData } from '@/lib/schemas'

type Props = { data: OnboardingData; update: (patch: Partial<OnboardingData>) => void; reduceMotion: boolean }

function formatTime(hour: number) {
  const normalized = hour % 24
  const suffix = normalized >= 12 ? 'PM' : 'AM'
  return `${normalized % 12 || 12}:00 ${suffix}`
}

export function DayNightScene({ data, update, reduceMotion }: Props) {
  const [night, setNight] = useState(false)
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.7, ease: 'easeInOut' as const }

  return (
    <div className="relative mx-auto min-h-[22rem] max-w-2xl overflow-hidden rounded-[2rem] bg-[#dff4ff] p-6 shadow-[0_24px_70px_-38px_rgba(29,46,81,.55)] md:p-8">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: night ? 1 : 0 }}
        transition={transition}
        style={{ backgroundImage: 'linear-gradient(145deg, #171b43 0%, #313d75 55%, #785d8b 100%)' }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: night ? 0.85 : 0.18, y: night ? 0 : 12 }}
        transition={transition}
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '34px 34px' }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-12 size-40 -translate-x-1/2 rounded-full blur-[1px]"
        animate={{ x: night ? 100 : -100, scale: night ? 0.58 : 1, backgroundColor: night ? '#f4e8c8' : '#ffd46f', boxShadow: night ? '0 0 54px 18px rgba(244,232,200,.25)' : '0 0 64px 24px rgba(255,212,111,.3)' }}
        transition={{ ...transition, type: reduceMotion ? 'tween' : 'spring', stiffness: 45, damping: 16 }}
      />
      <div className="relative z-10 flex justify-between">
        <button type="button" aria-label="Show daytime" aria-pressed={!night} onClick={() => setNight(false)} className={`grid size-12 place-items-center rounded-full backdrop-blur transition duration-300 hover:scale-110 ${night ? 'bg-white/10 text-white/70' : 'bg-[#d2fb4d] text-[#171b20] shadow-[0_8px_25px_-12px_#d2fb4d]'}`}>
          <Sun size={21} />
        </button>
        <button type="button" aria-label="Show nighttime" aria-pressed={night} onClick={() => setNight(true)} className={`grid size-12 place-items-center rounded-full backdrop-blur transition duration-300 hover:scale-110 ${night ? 'bg-white/20 text-white shadow-[0_8px_25px_-12px_white]' : 'bg-white/55 text-[#171b20]'}`}>
          <Moon size={20} />
        </button>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-20 h-44 rounded-[50%] border border-dashed border-white/60" />
      <div className="relative z-10 mt-28 grid gap-6 md:grid-cols-2">
        <label className={`flex flex-col gap-3 text-sm font-semibold ${night ? 'text-white' : 'text-[#171b20]'}`}>
          <span className="flex items-center justify-between">Sleep time <span className="font-mono text-xs opacity-75">{formatTime(data.sleepTime)}</span></span>
          <input aria-label="Sleep time" type="range" min="18" max="28" value={data.sleepTime} onChange={(event) => update({ sleepTime: Number(event.target.value) })} />
        </label>
        <label className={`flex flex-col gap-3 text-sm font-semibold ${night ? 'text-white' : 'text-[#171b20]'}`}>
          <span className="flex items-center justify-between">Wake time <span className="font-mono text-xs opacity-75">{formatTime(data.wakeTime)}</span></span>
          <input aria-label="Wake time" type="range" min="5" max="12" value={data.wakeTime} onChange={(event) => update({ wakeTime: Number(event.target.value) })} />
        </label>
      </div>
      <p className={`relative z-10 mt-5 font-mono text-[10px] uppercase tracking-[.18em] ${night ? 'text-white/65' : 'text-[#171b20]/55'}`}>A little rhythm goes a long way</p>
    </div>
  )
}
