// Blob confetti (Motion moments 7 and 12): circles, pills and squares in the
// blob colours burst from a point, arc up, then fall and fade. Skipped under
// reduce motion.

const COLOURS = ['bg-blob-orchid', 'bg-blob-orchid-2', 'bg-blob-plum', 'bg-blob-mint', 'bg-blob-sky', 'bg-white', 'bg-accent']

export function burst(host: HTMLElement, x: number, y: number, count = 32, spread = 1) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span')
    const size = 6 + Math.random() * 7
    const kind = i % 3 // 0 circle, 1 pill, 2 square
    piece.className = `pointer-events-none absolute z-50 ${COLOURS[i % COLOURS.length]}`
    piece.style.cssText = `left:${x}px;top:${y}px;width:${(kind === 1 ? size * 1.9 : size).toFixed(1)}px;height:${size.toFixed(1)}px;border-radius:${kind === 2 ? '3px' : '999px'}`
    host.appendChild(piece)

    const angle = Math.random() * Math.PI * 2
    const distance = (60 + Math.random() * 120) * spread
    const dx = Math.cos(angle) * distance
    const dy = Math.sin(angle) * distance - 40 * spread
    const spin = Math.round(Math.random() * 600 - 300)
    piece
      .animate(
        [
          { transform: 'translate(-50%,-50%) scale(.3) rotate(0deg)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px)) scale(1) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.5 },
          { transform: `translate(calc(-50% + ${(dx * 1.15).toFixed(1)}px), calc(-50% + ${(dy + 120).toFixed(1)}px)) scale(.8) rotate(${spin}deg)`, opacity: 0 },
        ],
        { duration: 1200 + Math.random() * 600, easing: 'cubic-bezier(.12,.7,.35,1)', fill: 'forwards' },
      )
      .finished.then(
        () => piece.remove(),
        () => piece.remove(),
      )
  }
}
