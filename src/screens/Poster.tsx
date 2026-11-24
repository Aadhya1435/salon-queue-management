import { ChevronLeft, Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect } from 'react'
import { Link } from 'react-router'
import BlobCluster from '../components/BlobCluster'
import PinGate from '../components/PinGate'
import { useLiveQueue } from '../lib/liveQueue'

const STEPS = [
  { title: 'Scan', text: 'Point your phone camera at the code.' },
  { title: 'Pick services', text: 'Choose up to 3 and any barber you like.' },
  { title: "We'll call you", text: 'Watch your place live. Relax nearby.' },
]

/** Screen 8: QR Poster (docs/02-screens.md). An A4 portrait page. */
export default function Poster() {
  return (
    <PinGate need="owner">
      <PosterPage />
    </PinGate>
  )
}

function PosterPage() {
  const { settings } = useLiveQueue()
  const salonName = settings?.salon_name ?? ' '
  const joinUrl = `${location.origin}/join`
  const shownUrl = joinUrl.replace(/^https?:\/\//, '')

  useEffect(() => {
    document.title = settings ? `QR poster · ${settings.salon_name}` : 'QR poster'
  }, [settings])

  return (
    <main className="flex min-h-dvh flex-col items-center gap-4 px-4 py-4 sm:py-8 print:block print:min-h-0 print:p-0">
      {/* A4 page size and margins for printing. */}
      <style>{'@page { size: A4 portrait; margin: 0; } @media print { html, body { background: var(--color-surface) !important; } }'}</style>

      <div className="flex w-full max-w-[210mm] items-center justify-between gap-3 print:hidden">
        <Link to="/admin" className="inline-flex min-h-11 items-center gap-1 rounded-full pr-3 text-small font-semibold text-muted hover:text-text">
          <ChevronLeft size={20} aria-hidden="true" /> Owner
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-body font-bold text-on-primary shadow-pop active:scale-95"
        >
          <Printer size={18} aria-hidden="true" /> Print
        </button>
      </div>

      {/* The sheet: A4 ratio on screen, exactly one A4 page in print. */}
      <article className="relative flex aspect-[210/297] w-full max-w-[210mm] flex-col overflow-hidden rounded-card bg-surface shadow-pop print:h-[297mm] print:w-[210mm] print:max-w-none print:rounded-none print:shadow-none [print-color-adjust:exact]">
        <header className="relative overflow-hidden bg-linear-to-br from-hero to-hero-2 px-[7%] pt-[7%] pb-[6%] text-white">
          <BlobCluster className="pointer-events-none absolute top-[12%] right-[5%] w-[24%]" />
          <p className="flex items-center gap-[0.6em] text-[clamp(14px,3.2vw,22px)] font-bold print:text-[22px]">
            <span aria-hidden="true" className="grid size-[2em] place-items-center rounded-full bg-white font-extrabold text-primary">
              {salonName.trim().charAt(0)}
            </span>
            {salonName}
          </p>
          <h1 className="mt-[5%] max-w-[72%] text-[clamp(24px,7vw,52px)] leading-[1.08] font-extrabold tracking-tight print:text-[52px]">
            Skip the wait — join the queue from your phone
          </h1>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-[4%] px-[7%] py-[5%]">
          <div className="w-[52%] rounded-[8%] bg-white p-[4%] shadow-card ring-1 ring-border print:shadow-none">
            <QRCodeSVG value={joinUrl} size={512} level="M" marginSize={0} className="block h-auto w-full" title={`QR code for ${shownUrl}`} />
          </div>
          <p className="num text-center text-[clamp(13px,3vw,22px)] font-bold break-all text-primary print:text-[22px]">{shownUrl}</p>

          <ol className="grid w-full grid-cols-3 gap-[3%]">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col items-center text-center">
                <span className="num grid size-[clamp(28px,7vw,52px)] place-items-center rounded-full bg-accent text-[clamp(14px,3.2vw,24px)] font-extrabold text-on-accent print:size-[52px] print:text-[24px]">
                  {i + 1}
                </span>
                <span className="mt-[0.5em] text-[clamp(12px,2.8vw,20px)] font-bold text-text print:text-[20px]">{s.title}</span>
                <span className="mt-[0.2em] text-[clamp(10px,2vw,14px)] text-muted print:text-[14px]">{s.text}</span>
              </li>
            ))}
          </ol>
        </div>

        <footer className="flex items-center justify-center gap-2 border-t border-border px-[7%] py-[3%] text-[clamp(10px,2vw,14px)] font-semibold text-muted print:text-[14px]">
          No app to install · No login · Walk-ins welcome too
        </footer>
      </article>
    </main>
  )
}
