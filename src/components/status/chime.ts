// The "It's your turn" chime on My Status (docs/02-screens.md → Haptics and sound).
// Browsers only play sound after a tap, so [Turn on sound] calls unlockSound() inside
// that tap. The same audio player is reused for the chime later, while the page is open.

let ctx: AudioContext | null = null

function audioContext(): AudioContext | null {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    ctx ??= new Ctx()
    return ctx
  } catch {
    return null
  }
}

/** Call inside a tap. Unlocks sound and plays the chime once so the person hears what to expect. */
export async function unlockSound(): Promise<boolean> {
  const audio = audioContext()
  if (!audio) return false
  try {
    await audio.resume()
  } catch {
    return false
  }
  playChime()
  return audio.state === 'running'
}

/** True once sound has been unlocked on this page. */
export function soundIsOn(): boolean {
  return ctx?.state === 'running'
}

/** A soft two-note chime (E5 → B5). Best effort: silent if sound was never unlocked. */
export function playChime() {
  const audio = audioContext()
  if (!audio) return
  void audio.resume().catch(() => {})
  try {
    const notes = [
      { freq: 659.25, at: 0 }, // E5
      { freq: 987.77, at: 0.18 }, // B5
    ]
    for (const { freq, at } of notes) {
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = audio.currentTime + at
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.1)
      osc.connect(gain).connect(audio.destination)
      osc.start(start)
      osc.stop(start + 1.2)
    }
  } catch {
    // No audio: the vibration and the screen are enough.
  }
}
