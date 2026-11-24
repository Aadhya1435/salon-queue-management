/** "● Live" while realtime is connected, grey "Offline" otherwise (Motion moment 23). */
export default function LiveDot({ live, onDark = false }: { live: boolean; onDark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-caption font-semibold ${onDark ? 'text-white/80' : 'text-muted'}`}>
      <span aria-hidden="true" className={`size-2 rounded-full ${live ? 'animate-breathe bg-blob-mint' : 'bg-break'}`} />
      {live ? 'Live' : 'Offline'}
    </span>
  )
}
