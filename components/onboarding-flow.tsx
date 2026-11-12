'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BrushCleaning, Check, ChevronLeft, ChevronRight, CloudUpload, PartyPopper, Phone, ShieldCheck, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth'
import { signInWithGoogle } from '@/lib/google-signin'
import { clearOnboardingDraft, loadOnboardingDraft, saveOnboardingDraft } from '@/lib/onboarding-draft'
import { saveDealBreakers, saveLifestyle, saveProfile, uploadProfilePhoto } from '@/lib/mock-api'
import { firebaseVerify } from '@/lib/auth-api'
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase-client'
import { onboardingSchemas, type OnboardingData, type OnboardingStep } from '@/lib/schemas'
import { DayNightScene } from '@/components/day-night-scene'

const steps: OnboardingStep[] = ['mode', 'basics', 'budget', 'sleep', 'cleanliness', 'habits', 'dealBreakers', 'photos', 'bio', 'done']
const cities = ['Gurugram', 'Bangalore', 'Pune', 'Delhi', 'Mumbai']
const habits = ['smoking', 'drinking', 'pets', 'diet', 'cooking', 'guests', 'noise'] as const
const habitLabels: Record<(typeof habits)[number], string> = { smoking: 'Smoking', drinking: 'Drinking', pets: 'Pets', diet: 'Diet', cooking: 'Cooking', guests: 'Guests', noise: 'Noise' }
const initialData: OnboardingData = { mode: '', name: '', gender: '', dob: '', city: '', occupation: '', minBudget: 10000, maxBudget: 30000, moveInDate: '', sleepTime: 23, wakeTime: 7, cleanliness: 0, habits: {}, dealBreakers: [], photos: [], bio: '' }

function FieldError({ message }: { message?: string }) { return message ? <p className="mt-2 text-sm font-medium text-[#d92d20]">{message}</p> : null }
function Sticker({ children, selected, onClick, tone = 'paper' }: { children: React.ReactNode; selected?: boolean; onClick?: () => void; tone?: 'paper' | 'lime' | 'sky' }) { return <button type="button" onClick={onClick} className={`rounded-full border-2 border-black px-4 py-3 text-left text-sm font-bold shadow-[3px_3px_0_#111] transition hover:-translate-y-0.5 ${selected ? 'bg-[#ff4d2e] text-white' : tone === 'lime' ? 'bg-[#c8ff3d]' : tone === 'sky' ? 'bg-[#bfe3ff]' : 'bg-[#f4efe6]'}`}>{children}</button> }

export function OnboardingFlow() {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [data, setData] = useState<OnboardingData>(initialData)
  const [direction, setDirection] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [draftReady, setDraftReady] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const reduceMotion = useReducedMotion()
  const step = steps[index]
  const progress = index === steps.length - 1 ? 100 : Math.round((index / (steps.length - 1)) * 100)

  useEffect(() => {
    let active = true
    void loadOnboardingDraft().then((draft) => {
      if (!active) return
      if (draft) {
        setData({ ...initialData, ...draft.data, photos: draft.data.photos ?? [] })
        setIndex(Math.max(0, Math.min(draft.stepIndex, steps.length - 2)))
      }
      setDraftReady(true)
    }).catch(() => { if (active) setDraftReady(true) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!draftReady || index === steps.length - 1) return
    const timeout = window.setTimeout(() => {
      void saveOnboardingDraft({ data, stepIndex: index }).then(() => setDraftSaved(true)).catch(() => setDraftSaved(false))
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [data, draftReady, index])

  const update = (patch: Partial<OnboardingData>) => { setData((current) => ({ ...current, ...patch })); setErrors({}); setDraftSaved(false) }
  const validate = () => {
    const result = onboardingSchemas[step].safeParse(data)
    if (result.success) { setErrors({}); return true }
    const nextErrors: Record<string, string> = {}
    result.error.issues.forEach((issue) => { nextErrors[String(issue.path[0] ?? step)] = issue.message })
    setErrors(nextErrors)
    return false
  }
  const next = async () => {
    if (saving || !validate() || step === 'done') return
    const finishing = index === steps.length - 2
    if (finishing) {
      setSaving(true)
      setErrors({})
      try {
        const photos = await Promise.all(data.photos.map(uploadProfilePhoto))
        await saveProfile({
          name: data.name,
          gender: data.gender,
          dob: data.dob,
          city: data.city,
          occupation: data.occupation,
          bio: data.bio,
          mode: data.mode === 'have-flat' ? 'HAS_FLAT' : 'NEEDS_FLAT',
          budgetMin: data.minBudget,
          budgetMax: data.maxBudget,
          moveInDate: data.moveInDate,
          photos,
        })
        await saveLifestyle({
          sleepTime: (data.sleepTime % 24) * 60,
          wakeTime: (data.wakeTime % 24) * 60,
          cleanliness: data.cleanliness,
          smoking: Boolean(data.habits.smoking),
          drinking: Boolean(data.habits.drinking),
          pets: Boolean(data.habits.pets),
          diet: data.habits.diet ? 'vegetarian' : 'any',
          guestsLevel: data.habits.guests ? 4 : 3,
          noiseLevel: data.habits.noise ? 4 : 3,
          cooking: data.habits.cooking ? 'yes' : 'flexible',
        })
        await saveDealBreakers(data.dealBreakers.map((key) => ({ key, value: 'avoid' })))
        await clearOnboardingDraft()
      } catch (error) {
        setErrors({ submit: error instanceof Error ? error.message : 'We could not save your profile. Please try again.' })
        setSaving(false)
        return
      }
      setSaving(false)
    }
    setDirection(1)
    setIndex((current) => current + 1)
    if (finishing) window.setTimeout(() => router.push('/discover'), 1600)
  }
  const back = () => { if (index === 0) return; setDirection(-1); setIndex((current) => current - 1) }

  const advanceAfterPhone = () => { setDirection(1); setIndex((current) => current + 1) }

  return <main className="min-h-screen bg-[#f4efe6] text-[#111]">
    <header className="sticky top-0 z-30 border-b-2 border-black bg-[#f4efe6]/95 px-4 py-4 backdrop-blur md:px-8">
      <div className="mx-auto flex max-w-5xl items-center gap-4"><button type="button" aria-label="Go back" onClick={back} disabled={index === 0 || !draftReady || saving} className="grid h-11 w-11 place-items-center rounded-full border-2 border-black bg-white disabled:opacity-30"><ChevronLeft size={20} /></button><div className="flex-1"><div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em]"><span>Build your flatmate profile</span><span className="font-mono">{draftReady && draftSaved ? 'Draft saved' : `${index + 1}/${steps.length}`}</span></div><div className="h-3 overflow-hidden rounded-full border-2 border-black bg-white"><motion.div className="h-full bg-[#ff4d2e]" animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 100, damping: 18 }} /></div></div></div>
    </header>
    <div className="mx-auto flex min-h-[calc(100vh-91px)] max-w-5xl items-center px-4 py-10 md:px-8">
      {draftReady ? <AnimatePresence mode="wait" custom={direction}><motion.section key={step} custom={direction} initial={{ opacity: 0, x: direction * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction * -40 }} transition={{ duration: reduceMotion ? 0 : .28 }} className="w-full">
        <div className="mx-auto max-w-3xl">{step === 'mode' && <Screen title="First, what brings you here?" eyebrow="Let’s set the scene"><div className="grid gap-4 md:grid-cols-2"><BigChoice selected={data.mode === 'have-flat'} onClick={() => update({ mode: 'have-flat' })} title="I have a flat" body="I need a flatmate to join my place." /><BigChoice selected={data.mode === 'need-flat'} onClick={() => update({ mode: 'need-flat' })} title="I need a flat" body="I need a flat and a flatmate." /></div><FieldError message={errors.mode} /></Screen>}
        {step === 'basics' && <Screen title="The basics, please." eyebrow="A little context helps"><div className="grid gap-5 md:grid-cols-2"><label className="field">Name<input value={data.name} onChange={(e) => update({ name: e.target.value })} placeholder="What should we call you?" /> <FieldError message={errors.name} /></label><label className="field">Gender<select value={data.gender} onChange={(e) => update({ gender: e.target.value })}><option value="">Select one</option><option>Woman</option><option>Man</option><option>Non-binary</option><option>Prefer not to say</option></select><FieldError message={errors.gender} /></label><label className="field">Date of birth<input type="date" value={data.dob} onChange={(e) => update({ dob: e.target.value })} /><FieldError message={errors.dob} /></label><label className="field">City<select value={data.city} onChange={(e) => update({ city: e.target.value })}><option value="">Choose your city</option>{cities.map((city) => <option key={city}>{city}</option>)}</select><FieldError message={errors.city} /></label><label className="field md:col-span-2">Occupation<input value={data.occupation} onChange={(e) => update({ occupation: e.target.value })} placeholder="Designer, founder, student..." /><FieldError message={errors.occupation} /></label></div></Screen>}
        {step === 'budget' && <Screen title="What feels comfortable?" eyebrow="Monthly rent, in INR"><div className="rounded-3xl border-2 border-black bg-white p-5 md:p-8"><div className="mb-8 flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-widest">Budget range</p><p className="font-display text-4xl font-black">₹{data.minBudget.toLocaleString('en-IN')} — ₹{data.maxBudget.toLocaleString('en-IN')}</p></div><span className="rounded-full bg-[#c8ff3d] px-3 py-1 text-xs font-bold">per month</span></div><div className="grid gap-5 md:grid-cols-2"><label className="field">Minimum<input type="range" min="5000" max="80000" step="1000" value={data.minBudget} onChange={(e) => update({ minBudget: Math.min(Number(e.target.value), data.maxBudget) })} /><span className="font-mono text-sm">₹{data.minBudget.toLocaleString('en-IN')}</span></label><label className="field">Maximum<input type="range" min="10000" max="100000" step="1000" value={data.maxBudget} onChange={(e) => update({ maxBudget: Math.max(Number(e.target.value), data.minBudget) })} /><span className="font-mono text-sm">₹{data.maxBudget.toLocaleString('en-IN')}</span></label></div></div><label className="field mt-6">Move-in date<input type="date" value={data.moveInDate} onChange={(e) => update({ moveInDate: e.target.value })} /><FieldError message={errors.moveInDate} /></label></Screen>}
        {step === 'sleep' && <Screen title="When does your day start?" eyebrow="No judgement, just compatibility"><DayNightScene data={data} update={update} reduceMotion={Boolean(reduceMotion)} /></Screen>}
        {step === 'cleanliness' && <Screen title="How tidy are we talking?" eyebrow="Pick your broom level"><div className="flex flex-wrap justify-center gap-3 rounded-3xl border-2 border-black bg-[#c8ff3d] p-8">{[1, 2, 3, 4, 5].map((level) => <button type="button" key={level} aria-label={`${level} out of 5`} onClick={() => update({ cleanliness: level })} className={`grid h-16 w-16 place-items-center rounded-2xl border-2 border-black ${data.cleanliness >= level ? 'bg-[#ff4d2e] text-white' : 'bg-[#f4efe6]'}`}><BrushCleaning size={28} /></button>)}</div><FieldError message={errors.cleanliness} /></Screen>}
        {step === 'habits' && <Screen title="Your flatmate non-negotiables?" eyebrow="Tap to toggle"><div className="flex flex-wrap gap-3">{habits.map((habit, index) => <Sticker key={habit} tone={index % 2 ? 'sky' : 'lime'} selected={data.habits[habit] === true} onClick={() => update({ habits: { ...data.habits, [habit]: !data.habits[habit] } })}>{habitLabels[habit]}</Sticker>)}</div><FieldError message={errors.habits} /></Screen>}
        {step === 'dealBreakers' && <Screen title="What is a hard no?" eyebrow="These people will never show up"><div className="flex flex-wrap gap-3">{habits.map((habit) => <Sticker key={habit} selected={data.dealBreakers.includes(habit)} onClick={() => update({ dealBreakers: data.dealBreakers.includes(habit) ? data.dealBreakers.filter((item) => item !== habit) : [...data.dealBreakers, habit] })}>{data.dealBreakers.includes(habit) ? 'Never ' : ''}{habitLabels[habit]}</Sticker>)}</div><FieldError message={errors.dealBreakers} /></Screen>}
        {step === 'photos' && <PhotoStep data={data} update={update} error={errors.photos} />}
        {step === 'bio' && <Screen title="Give your future flatmate the gist." eyebrow="Keep it real"><label className="field"><textarea value={data.bio} maxLength={300} onChange={(e) => update({ bio: e.target.value })} placeholder="What makes living with you a good idea?" rows={7} /><div className="mt-2 flex justify-between text-sm"><FieldError message={errors.bio} /><span className="font-mono">{data.bio.length}/300</span></div></label></Screen>}
        {step === 'done' && <div className="text-center"><div className="mx-auto mb-8 grid h-24 w-24 place-items-center rounded-full border-2 border-black bg-[#c8ff3d]"><PartyPopper size={42} /></div><h1 className="font-display text-5xl font-black md:text-7xl">Profile ready.</h1><p className="mx-auto mt-4 max-w-md text-lg">We’re finding the people who will make home feel like home.</p>{saving && <p className="mt-5 font-mono text-sm">Saving your profile...</p>}</div>}</div>
      </motion.section></AnimatePresence> : <p role="status" className="mx-auto max-w-3xl text-center text-sm text-black/55">Restoring your saved profile…</p>}
    </div>
    {step !== 'done' && <div className="sticky bottom-0 border-t border-black/10 bg-[#f4efe6]/90 px-4 py-4 backdrop-blur-xl md:px-8"><div className="mx-auto flex max-w-3xl items-center justify-between gap-4"><p aria-live="polite" className="min-h-5 text-sm text-[#d92d20]">{errors.submit}</p><button type="button" onClick={() => void next()} disabled={!draftReady || saving} className="flex shrink-0 items-center gap-2 rounded-full bg-[#ff4d2e] px-6 py-3 font-bold text-white shadow-[0_12px_28px_-14px_#ff4d2e] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-14px_#ff4d2e] disabled:cursor-wait disabled:opacity-60">{saving ? 'Saving your profile…' : index === steps.length - 2 ? 'Finish profile' : 'Next'} <ChevronRight size={18} /></button></div></div>}
    <div id="recaptcha-container" />
  </main>
}

function Screen({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) { return <div><p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#ff4d2e]">{eyebrow}</p><h1 className="mb-8 max-w-3xl font-display text-5xl font-black leading-[.95] md:text-7xl">{title}</h1>{children}</div> }
function BigChoice({ title, body, selected, onClick }: { title: string; body: string; selected: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={`rounded-3xl border-2 border-black p-6 text-left shadow-[5px_5px_0_#111] transition hover:-translate-y-1 ${selected ? 'bg-[#ff4d2e] text-white' : 'bg-white'}`}><div className="mb-8 flex justify-end">{selected && <span className="grid h-8 w-8 place-items-center rounded-full bg-[#c8ff3d] text-black"><Check size={18} /></span>}</div><p className="font-display text-3xl font-black">{title}</p><p className="mt-2 max-w-xs opacity-80">{body}</p></button> }

function PhoneStep({ verified, onVerified, error }: { verified: boolean; onVerified: () => void; error?: string }) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const confirmationRef = useRef<ConfirmationResult | null>(null)
  const verifierRef = useRef<RecaptchaVerifier | null>(null)
  const [googleBusy, setGoogleBusy] = useState(false)

  const handleGoogle = async () => {
    setLocalError(null)
    if (!isFirebaseConfigured()) { setLocalError('Sign-in is not configured yet'); return }
    try {
      setGoogleBusy(true)
      await signInWithGoogle()
      onVerified()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed'
      setLocalError(message)
    } finally {
      setGoogleBusy(false)
    }
  }

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
        <button type="button" onClick={handleGoogle} disabled={googleBusy} className="mb-5 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-black bg-white px-5 py-3 font-bold shadow-[4px_4px_0_#111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-60">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.5l6.9-6.9C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.5 13.3l8 6.2C12.3 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.2 5.6c4.2-3.9 6.8-9.6 6.8-17.3z"/><path fill="#FBBC05" d="M10.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-8-6.2C.9 16.6 0 20.2 0 24s.9 7.4 2.5 10.7l8-6.2z"/><path fill="#34A853" d="M24 48c6.4 0 11.8-2.1 15.7-5.8l-7.2-5.6c-2 1.4-4.6 2.2-8.5 2.2-6.3 0-11.7-4.1-13.5-9.8l-8 6.2C6.5 42.6 14.6 48 24 48z"/></svg>
          {googleBusy ? 'Opening…' : 'Continue with Google'}
        </button>
        <div className="my-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-black/40"><span className="h-px flex-1 bg-black/20" />or phone<span className="h-px flex-1 bg-black/20" /></div>
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
