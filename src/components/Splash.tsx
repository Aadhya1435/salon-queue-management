/** Shown for a moment while the first screen's code loads. */
export default function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-linear-to-br from-hero to-hero-2 text-white">
      <div className="flex flex-col items-center gap-3">
        <img src="/logo.svg" alt="" className="size-16 rounded-2xl shadow-pop" />
        <p className="text-title font-bold tracking-tight">Roselle</p>
      </div>
    </div>
  )
}
