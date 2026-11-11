'use client'

import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BrushCleaning, Check, ChevronLeft, ChevronRight, CloudUpload, Moon, PartyPopper, Phone, ShieldCheck, Sun, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth'
import { saveProfile } from '@/lib/mock-api'
import { firebaseVerify } from '@/lib/auth-api'
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase-client'
import { onboardingSchemas, type OnboardingData, type OnboardingStep } from '@/lib/schemas'

const steps: OnboardingStep[] = ['phone', 'mode', 'basics', 'budget', 'sleep', 'cleanliness', 'habits', 'dealBreakers', 'photos', 'bio', 'done']
const cities = ['Gurugram', 'Bangalore', 'Pune', 'Delhi', 'Mumbai']
const habits = ['smoking', 'drinking', 'pets', 'diet', 'cooking', 'guests', 'noise'] as const
const habitLabels: Record<(typeof habits)[number], string> = { smoking: 'Smoking', drinking: 'Drinking', pets: 'Pets', diet: 'Diet', cooking: 'Cooking', guests: 'Guests', noise: 'Noise' }
const initialData: OnboardingData = { phoneVerified: false, mode: '', name: '', gender: '', dob: '', city: '', occupation: '', minBudget: 10000, maxBudget: 30000, moveInDate: '', sleepTime: 23, wakeTime: 7, cleanliness: 0, habits: {}, dealBreakers: [], photos: [], bio: '' }

function FieldError({ message }: { message?: string }) { return message ? <p className="mt-2 text-sm font-medium text-[#d92d20]">{message}</p> : null }
function Sticker({ children, selected, onClick, tone = 'paper' }: { children: React.ReactNode; selected?: boolean; onClick?: () => void; tone?: 'paper' | 'lime' | 'sky' }) { return <button type="button" onClick={onClick} className={`rounded-full border-2 border-black px-4 py-3 text-left text-sm font-bold shadow-[3px_3px_0_#111] transition hover:-translate-y-0.5 ${selected ? 'bg-[#ff4d2e] text-white' : tone === 'lime' ? 'bg-[#c8ff3d]' : tone === 'sky' ? 'bg-[#bfe3ff]' : 'bg-[#f4efe6]'}`}>{children}</button> }

export function OnboardingFlow() {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [data, setData] = useState<OnboardingData>(initialData)
  const [direction, setDirection] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const step = steps[index]
  const progress = index === steps.length - 1 ? 100 : Math.round((index / (steps.length - 1)) * 100)

  const update = (patch: Partial<OnboardingData>) => { setData((current) => ({ ...current, ...patch })); setErrors({}) }
  const validate = () => {
    const result = onboardingSchemas[step].safeParse(data)
    if (result.success) { setErrors({}); return true }
    const next: Record<string, string> = {}
    result.error.issues.forEach((issue) => { next[String(issue.path[0] ?? step)] = issue.message })
    setErrors(next)
    return false
  }
  const next = async () => {
    if (!validate()) return
    if (step === 'done') return
    if (index === steps.length - 2) setSaving(true)
    if (index === steps.length - 2) { await saveProfile({ name: data.name, city: data.city, bio: data.bio, onboarding: data }); setSaving(false) }
    setDirection(1); setIndex((current) => current + 1)
    if (index === steps.length - 2) setTimeout(() => router.push('/discover'), 1600)
  }
  const back = () => { if (index === 0) return; setDirection(-1); setIndex((current) => current - 1) }

  const advanceAfterPhone = () => { setDirection(1); setIndex((current) => current + 1) }

  return <main className="min-h-screen bg-[#f4efe6] text-[#111]">
    <header className="sticky top-0 z-30 border-b-2 border-black bg-[#f4efe6]/95 px-4 py-4 backdrop-blur md:px-8">
      <div className="mx-auto flex max-w-5xl items-center gap-4"><button type="button" aria-label="Go back" onClick={back} disabled={index === 0} className="grid h-11 w-11 place-items-center rounded-full border-2 border-black bg-white disabled:opacity-30"><ChevronLeft size={20} /></button><div className="flex-1"><div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em]"><span>Build your flatmate profile</span><span className="font-mono">{index + 1}/{steps.length}</span></div><div className="h-3 overflow-hidden rounded-full border-2 border-black bg-white"><motion.div className="h-full bg-[#ff4d2e]" animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 100, damping: 18 }} /></div></div></div>
    </header>
    <div className="mx-auto flex min-h-[calc(100vh-91px)] max-w-5xl items-center px-4 py-10 md:px-8">
      <AnimatePresence mode="wait" custom={direction}><motion.section key={step} custom={direction} initial={{ opacity: 0, x: direction * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction * -40 }} transition={{ duration: .28 }} className="w-full">
        <div className="mx-auto max-w-3xl">{step === 'phone' && <PhoneStep verified={data.phoneVerified} onVerified={() => { update({ phoneVerified: true }); advanceAfterPhone() }} error={errors.phoneVerified} />}
        {step === 'mode' && <Screen title="First, what brings you here?" eyebrow="Let’s set the scene"><div className="grid gap-4 md:grid-cols-2"><BigChoice selected={data.mode === 'have-flat'} onClick={() => update({ mode: 'have-flat' })} title="I have a flat" body="I need a flatmate to join my place." /><BigChoice selected={data.mode === 'need-flat'} onClick={() => update({ mode: 'need-flat' })} title="I need a flat" body="I need a flat and a flatmate." /></div><FieldError message={errors.mode} /></Screen>}
        {step === 'basics' && <Screen title="The basics, please." eyebrow="A little context helps"><div className="grid gap-5 md:grid-cols-2"><label className="field">Name<input value={data.name} onChange={(e) => update({ name: e.target.value })} placeholder="What should we call you?" /> <FieldError message={errors.name} /></label><label className="field">Gender<select value={data.gender} onChange={(e) => update({ gender: e.target.value })}><option value="">Select one</option><option>Woman</option><option>Man</option><option>Non-binary</option><option>Prefer not to say</option></select><FieldError message={errors.gender} /></label><label className="field">Date of birth<input type="date" value={data.dob} onChange={(e) => update({ dob: e.target.value })} /><FieldError message={errors.dob} /></label><label className="field">City<select value={data.city} onChange={(e) => update({ city: e.target.value })}><option value="">Choose your city</option>{cities.map((city) => <option key={city}>{city}</option>)}</select><FieldError message={errors.city} /></label><label className="field md:col-span-2">Occupation<input value={data.occupation} onChange={(e) => update({ occupation: e.target.value })} placeholder="Designer, founder, student..." /><FieldError message={errors.occupation} /></label></div></Screen>}
        {step === 'budget' && <Screen title="What feels comfortable?" eyebrow="Monthly rent, in INR"><div className="rounded-3xl border-2 border-black bg-white p-5 md:p-8"><div className="mb-8 flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-widest">Budget range</p><p className="font-display text-4xl font-black">₹{data.minBudget.toLocaleString('en-IN')} — ₹{data.maxBudget.toLocaleString('en-IN')}</p></div><span className="rounded-full bg-[#c8ff3d] px-3 py-1 text-xs font-bold">per month</span></div><div className="grid gap-5 md:grid-cols-2"><label className="field">Minimum<input type="range" min="5000" max="80000" step="1000" value={data.minBudget} onChange={(e) => update({ minBudget: Math.min(Number(e.target.value), data.maxBudget) })} /><span className="font-mono text-sm">₹{data.minBudget.toLocaleString('en-IN')}</span></label><label className="field">Maximum<input type="range" min="10000" max="100000" step="1000" value={data.maxBudget} onChange={(e) => update({ maxBudget: Math.max(Number(e.target.value), data.minBudget) })} /><span className="font-mono text-sm">₹{data.maxBudget.toLocaleString('en-IN')}</span></label></div></div><label className="field mt-6">Move-in date<input type="date" value={data.moveInDate} onChange={(e) => update({ moveInDate: e.target.value })} /><FieldError message={errors.moveInDate} /></label></Screen>}
        {step === 'sleep' && <Screen title="When does your day start?" eyebrow="No judgement, just compatibility"><div className="relative mx-auto h-64 max-w-xl overflow-hidden rounded-3xl border-2 border-black bg-[#bfe3ff] p-6"><div className="absolute inset-x-12 top-16 h-40 rounded-[50%] border-2 border-dashed border-black/50" /><div className="absolute left-8 top-8 rounded-full bg-[#c8ff3d] p-3"><Sun /></div><div className="absolute right-8 top-8 rounded-full bg-[#f4efe6] p-3"><Moon /></div><div className="absolute inset-x-8 bottom-8 grid gap-5 md:grid-cols-2"><label className="field">Sleep time<input type="range" min="18" max="28" value={data.sleepTime} onChange={(e) => update({ sleepTime: Number(e.target.value) })} /><span>{formatTime(data.sleepTime)}</span></label><label className="field">Wake time<input type="range" min="5" max="12" value={data.wakeTime} onChange={(e) => update({ wakeTime: Number(e.target.value) })} /><span>{formatTime(data.wakeTime)}</span></label></div></div></Screen>}
        {step === 'cleanliness' && <Screen title="How tidy are we talking?" eyebrow="Pick your broom level"><div className="flex flex-wrap justify-center gap-3 rounded-3xl border-2 border-black bg-[#c8ff3d] p-8">{[1, 2, 3, 4, 5].map((level) => <button type="button" key={level} aria-label={`${level} out of 5`} onClick={() => update({ cleanliness: level })} className={`grid h-16 w-16 place-items-center rounded-2xl border-2 border-black ${data.cleanliness >= level ? 'bg-[#ff4d2e] text-white' : 'bg-[#f4efe6]'}`}><BrushCleaning size={28} /></button>)}</div><FieldError message={errors.cleanliness} /></Screen>}
        {step === 'habits' && <Screen title="Your flatmate non-negotiables?" eyebrow="Tap to toggle"><div className="flex flex-wrap gap-3">{habits.map((habit, index) => <Sticker key={habit} tone={index % 2 ? 'sky' : 'lime'} selected={data.habits[habit] === true} onClick={() => update({ habits: { ...data.habits, [habit]: !data.habits[habit] } })}>{habitLabels[habit]}</Sticker>)}</div><FieldError message={errors.habits} /></Screen>}
        {step === 'dealBreakers' && <Screen title="What is a hard no?" eyebrow="These people will never show up"><div className="flex flex-wrap gap-3">{habits.map((habit) => <Sticker key={habit} selected={data.dealBreakers.includes(habit)} onClick={() => update({ dealBreakers: data.dealBreakers.includes(habit) ? data.dealBreakers.filter((item) => item !== habit) : [...data.dealBreakers, habit] })}>{data.dealBreakers.includes(habit) ? 'Never ' : ''}{habitLabels[habit]}</Sticker>)}</div><FieldError message={errors.dealBreakers} /></Screen>}
        {step === 'photos' && <PhotoStep data={data} update={update} error={errors.photos} />}
        {step === 'bio' && <Screen title="Give your future flatmate the gist." eyebrow="Keep it real"><label className="field"><textarea value={data.bio} maxLength={300} onChange={(e) => update({ bio: e.target.value })} placeholder="What makes living with you a good idea?" rows={7} /><div className="mt-2 flex justify-between text-sm"><FieldError message={errors.bio} /><span className="font-mono">{data.bio.length}/300</span></div></label></Screen>}
        {step === 'done' && <div className="text-center"><div className="mx-auto mb-8 grid h-24 w-24 place-items-center rounded-full border-2 border-black bg-[#c8ff3d]"><PartyPopper size={42} /></div><h1 className="font-display text-5xl font-black md:text-7xl">Profile ready.</h1><p className="mx-auto mt-4 max-w-md text-lg">We’re finding the people who will make home feel like home.</p>{saving && <p className="mt-5 font-mono text-sm">Saving your profile...</p>}</div>}</div>
      </motion.section></AnimatePresence>
    </div>
    {step !== 'done' && step !== 'phone' && <div className="sticky bottom-0 border-t-2 border-black bg-[#f4efe6]/95 px-4 py-4 backdrop-blur md:px-8"><div className="mx-auto flex max-w-3xl justify-end"><button type="button" onClick={next} className="flex items-center gap-2 rounded-full border-2 border-black bg-[#ff4d2e] px-6 py-3 font-bold text-white shadow-[4px_4px_0_#111] hover:translate-x-0.5 hover:translate-y-0.5">{index === steps.length - 2 ? 'Finish profile' : 'Next'} <ChevronRight size={18} /></button></div></div>}
    <div id="recaptcha-container" />
  </main>
}

function Screen({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) { return <div><p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#ff4d2e]">{eyebrow}</p><h1 className="mb-8 max-w-3xl font-display text-5xl font-black leading-[.95] md:text-7xl">{title}</h1>{children}</div> }
function BigChoice({ title, body, selected, onClick }: { title: string; body: string; selected: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={`rounded-3xl border-2 border-black p-6 text-left shadow-[5px_5px_0_#111] transition hover:-translate-y-1 ${selected ? 'bg-[#ff4d2e] text-white' : 'bg-white'}`}><div className="mb-8 flex justify-end">{selected && <span className="grid h-8 w-8 place-items-center rounded-full bg-[#c8ff3d] text-black"><Check size={18} /></span>}</div><p className="font-display text-3xl font-black">{title}</p><p className="mt-2 max-w-xs opacity-80">{body}</p></button> }
function formatTime(hour: number) { const normalized = hour % 24; const suffix = normalized >= 12 ? 'PM' : 'AM'; const shown = normalized % 12 || 12; return `${shown}:00 ${suffix}` }

function PhoneStep({ verified, onVerified, error }: { verified: boolean; onVerified: () => void; error?: string }) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const confirmationRef = useRef<ConfirmationResult | null>(null)
  const verifierRef = useRef<RecaptchaVerifier | null>(null)

  const sendCode = async () => {
    setLocalError(null)
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) { setLocalError('Enter a 10-digit mobile number'); return }
    if (!isFirebaseConfigured()) { setLocalError('Phone sign-in is not configured yet'); return }
    try {
      setSending(true)
      const auth = getFirebaseAuth()
      // why: Firebase requires a reCAPTCHA verifier per sign-in attempt; reuse once ready.
      if (!verifierRef.current) {
        verifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
      }
      const result = await signInWithPhoneNumber(auth, `+91${digits}`, verifierRef.current)
      confirmationRef.current = result
      setSent(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not send code'
      setLocalError(message)
    } finally {
      setSending(false)
    }
  }

  const confirmCode = async () => {
    setLocalError(null)
    if (otp.length !== 6) { setLocalError('Enter the 6-digit code'); return }
    if (!confirmationRef.current) { setLocalError('Request a code first'); return }
    try {
      setVerifying(true)
      const credential = await confirmationRef.current.confirm(otp)
      const idToken = await credential.user.getIdToken()
      await firebaseVerify(idToken)
      onVerified()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Code did not match'
      setLocalError(message)
    } finally {
      setVerifying(false)
    }
  }

  return <Screen title="Verify your number." eyebrow="One quick check first">
    <div className="rounded-3xl border-2 border-black bg-white p-6 md:p-8">
      {!sent && <>
        <label className="field">Mobile number
          <div className="flex items-center gap-2">
            <span className="rounded-2xl border-2 border-black bg-[#f4efe6] px-3 py-3 font-mono text-sm">+91</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" inputMode="numeric" maxLength={10} className="flex-1" />
          </div>
        </label>
        <button type="button" onClick={sendCode} disabled={sending} className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#ff4d2e] px-6 py-3 font-bold text-white shadow-[4px_4px_0_#111] disabled:opacity-60">
          <Phone size={18} /> {sending ? 'Sending…' : 'Send code'}
        </button>
      </>}
      {sent && !verified && <>
        <p className="mb-4 text-sm">Code sent to <span className="font-mono">+91 {phone}</span>.</p>
        <label className="field">6-digit code
          <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="123456" inputMode="numeric" maxLength={6} className="font-mono" />
        </label>
        <div className="mt-6 flex items-center gap-3">
          <button type="button" onClick={confirmCode} disabled={verifying} className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#ff4d2e] px-6 py-3 font-bold text-white shadow-[4px_4px_0_#111] disabled:opacity-60">
            <ShieldCheck size={18} /> {verifying ? 'Verifying…' : 'Verify'}
          </button>
          <button type="button" onClick={() => { setSent(false); setOtp(''); confirmationRef.current = null }} className="text-sm font-bold underline">Change number</button>
        </div>
      </>}
      {verified && <p className="font-mono text-sm text-[#2f8a47]">Verified. Moving on…</p>}
      <FieldError message={localError ?? error} />
    </div>
  </Screen>
}

function PhotoStep({ data, update, error }: { data: OnboardingData; update: (patch: Partial<OnboardingData>) => void; error?: string }) { const inputRef = useRef<HTMLInputElement>(null); const [dragging, setDragging] = useState(false); const files = useMemo(() => data.photos, [data.photos]); const addFiles = (incoming: FileList | File[]) => { const valid = Array.from(incoming).filter((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 5 * 1024 * 1024).slice(0, 3 - files.length); update({ photos: [...files, ...valid] }) }; return <Screen title="Show us your corners." eyebrow="Up to three photos"><div onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }} onClick={() => inputRef.current?.click()} className={`cursor-pointer rounded-3xl border-2 border-dashed border-black p-8 text-center ${dragging ? 'bg-[#c8ff3d]' : 'bg-white'}`}><input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => e.target.files && addFiles(e.target.files)} /><CloudUpload className="mx-auto mb-3" size={38} /><p className="font-display text-2xl font-black">Drop photos here</p><p className="mt-2 text-sm">JPG, PNG or WEBP · 5 MB max each</p></div><div className="mt-5 grid grid-cols-3 gap-3">{files.map((file, index) => <div key={`${file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-2xl border-2 border-black bg-white"><img src={URL.createObjectURL(file)} alt={file.name} className="h-full w-full object-cover" /><button type="button" aria-label={`Remove ${file.name}`} onClick={(e) => { e.stopPropagation(); update({ photos: files.filter((_, photoIndex) => photoIndex !== index) }) }} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border-2 border-black bg-[#ff4d2e] text-white"><X size={16} /></button></div>)}</div><FieldError message={error} /></Screen> }
