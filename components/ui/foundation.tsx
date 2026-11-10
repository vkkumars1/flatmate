'use client'

import { motion, useMotionValue, useSpring } from 'framer-motion'
import type { ReactNode } from 'react'

export function MagneticButton({ children, className = '', type = 'button', disabled, onClick, 'aria-label': ariaLabel }: { children: ReactNode; className?: string; type?: 'button' | 'submit' | 'reset'; disabled?: boolean; onClick?: React.MouseEventHandler<HTMLButtonElement>; 'aria-label'?: string }) {
  const x = useMotionValue(0); const y = useMotionValue(0); const springX = useSpring(x, { stiffness: 250, damping: 18 }); const springY = useSpring(y, { stiffness: 250, damping: 18 })
  return <motion.button type={type} disabled={disabled} onClick={onClick} aria-label={ariaLabel} style={{ x: springX, y: springY }} onMouseMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); x.set((event.clientX - rect.left - rect.width / 2) * 0.12); y.set((event.clientY - rect.top - rect.height / 2) * 0.12) }} onMouseLeave={() => { x.set(0); y.set(0) }} className={`border-2 border-[#111] bg-[#ff4d2e] px-5 py-3 font-mono text-[10px] font-bold uppercase text-white shadow-[5px_5px_0_#111] transition-shadow hover:shadow-[2px_2px_0_#111] ${className}`}>{children}</motion.button>
}

export function Sticker({ children, tone = 'lime', className = '' }: { children: ReactNode; tone?: 'lime' | 'sky' | 'tomato'; className?: string }) { const bg = tone === 'sky' ? 'bg-[#bfe3ff]' : tone === 'tomato' ? 'bg-[#ff4d2e] text-white' : 'bg-[#c8ff3d]'; return <span className={`inline-block rotate-[-2deg] border-2 border-[#111] px-3 py-2 font-mono text-[10px] font-bold uppercase shadow-[3px_3px_0_#111] ${bg} ${className}`}>{children}</span> }

export function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) { return <motion.div whileHover={{ rotate: 0, y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className={`border-2 border-[#111] bg-white p-5 shadow-[6px_6px_0_#111] ${className}`}>{children}</motion.div> }

export function Skeleton({ className = '' }: { className?: string }) { return <div aria-hidden="true" className={`animate-pulse bg-[#111]/10 ${className}`} /> }
