// Best-effort device helpers for the Waiting-Area TV (docs/02-screens.md → Screen 6).
// Each one quietly does nothing when the browser doesn't support it.

let audio: AudioContext | null = null

/** Must run inside a tap: browsers only allow sound after the page has been touched. */
export function unlockChime() {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    audio ??= new Ctor()
    void audio.resume()
  } catch {
    audio = null
  }
}

/** A soft two-note chime (E5 → A5), about 1.2 s. */
export function playChime() {
  if (!audio || audio.state !== 'running') return
  const start = audio.currentTime + 0.02
  ;[
    { freq: 659.25, at: 0 },
    { freq: 880, at: 0.22 },
  ].forEach(({ freq, at }) => {
    const osc = audio!.createOscillator()
    const gain = audio!.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, start + at)
    gain.gain.linearRampToValueAtTime(0.22, start + at + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + at + 1.1)
    osc.connect(gain).connect(audio!.destination)
    osc.start(start + at)
    osc.stop(start + at + 1.2)
  })
}

let wakeLock: WakeLockSentinel | null = null

/** Keeps the screen awake; asks again when the tab becomes visible (the lock drops when hidden). */
export async function keepAwake() {
  try {
    if (!('wakeLock' in navigator) || (wakeLock && !wakeLock.released)) return
    wakeLock = await navigator.wakeLock.request('screen')
  } catch {
    wakeLock = null
  }
}

export function releaseWakeLock() {
  void wakeLock?.release().catch(() => {})
  wakeLock = null
}

export function goFullscreen() {
  try {
    if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => {})
  } catch {
    // not allowed: ignore
  }
}
