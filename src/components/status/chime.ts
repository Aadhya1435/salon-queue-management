/** A soft two-note chime (best effort: browsers may block sound before a tap). */
export function playChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    void ctx.resume().catch(() => {})
    const notes = [
      { freq: 659.25, at: 0 }, // E5
      { freq: 987.77, at: 0.18 }, // B5
    ]
    for (const { freq, at } of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = ctx.currentTime + at
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.1)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 1.2)
    }
    setTimeout(() => void ctx.close().catch(() => {}), 1800)
  } catch {
    // No audio: the vibration and the screen are enough.
  }
}
