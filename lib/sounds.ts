'use client'

let audioContext: AudioContext | null = null

function tone(frequency: number, start: number, duration: number, volume = 0.045) {
  if (typeof window === 'undefined') return
  const AudioContextClass = window.AudioContext
  if (!AudioContextClass) return
  audioContext ??= new AudioContextClass()
  if (audioContext.state === 'suspended') void audioContext.resume()
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + start)
  gain.gain.setValueAtTime(volume, audioContext.currentTime + start)
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + start + duration)
  oscillator.connect(gain)
  gain.connect(audioContext.destination)
  oscillator.start(audioContext.currentTime + start)
  oscillator.stop(audioContext.currentTime + start + duration)
}

export function playSwipeSound(liked: boolean) {
  tone(liked ? 620 : 300, 0, 0.11, 0.035)
}

export function playMatchSound() {
  tone(523, 0, 0.2)
  tone(659, 0.13, 0.22)
  tone(784, 0.27, 0.32)
}

export function playLoginSound() {
  tone(440, 0, 0.12, 0.025)
  tone(587, 0.1, 0.2, 0.025)
}
