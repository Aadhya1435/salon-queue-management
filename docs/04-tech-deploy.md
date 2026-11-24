# Salon Queue — Tech Stack & Deployment

Everything here is **free** and needs no credit card.

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| UI | **React + TypeScript + Vite** | Matches the guide. TypeScript catches the agent's mistakes early. |
| Styling | **Tailwind CSS v4** | Design tokens live in one CSS file (`@theme`), so components never hard-code colours. |
| Routing | **React Router** | Simple URL per screen (`/join`, `/status/:id`, `/reception` …). |
| App feel | **vite-plugin-pwa** | Manifest, icons and a service worker, so the app installs to the home screen and opens full-screen like a native app. |
| Data + live sync | **Supabase** (Postgres + Realtime + database functions) | A hosted database with live updates to every open screen. It needs **no backend server**, and the queue rules run safely inside the database. |
| QR codes | `qrcode.react` | TV "Scan to join", the printable poster, and walk-in status links. |
| Charts | `recharts` | The owner's 3 small charts. |
| Icons | `lucide-react` | Thin, consistent icon set. |
| Animation | **Motion** (`motion`, Motion for React) + the browser's View Transitions API | Springs, shared-layout moves (the Call-next row flying into the barber card), enter/exit and number rolls. It respects reduced motion. Blob confetti is built with it, so no extra library is needed. |
| Tests | **Vitest** for the queue rules, **Playwright** for the checklist across phone, tablet and TV windows | The guide asks the agent to verify against the checklist. |

Use the latest stable version of each package at setup time.

### Why Supabase and not an Express server on Render?
- Render's free web services **sleep after 15 minutes**, and the first visit then takes about 50 s to wake. Live sockets also drop, which is risky in a live demo.
- Supabase gives realtime updates out of the box, so phone, tablet and TV stay in sync with no server of our own to host.
- Queue rules such as Call next run as **database functions**, one at a time. Two people tapping Call next together can't grab the same customer.
- The result is one less service to deploy and explain: **Vercel (app) + Supabase (data)**.

## 2. How the data works (the agent may refine this)

**Tables**
- `settings` (one row): salon name, open and close time, online queue open/closed, hashed PINs
- `barbers`: name, colour, on duty, on break, sort order
- `services`: name, minutes, price, active, sort order
- `queue_entries`: random id, day, token number, first name, chosen barber (or Any), assigned barber, services (copied at join time), total minutes and price, status, source (online/walk-in), and the times it was joined, called, started and finished. Also the rating and, for a re-added no-show, the original entry it was re-added from.
- `customer_contacts`: phone numbers, kept apart so the public can never read them

**Security**
- The browser uses Supabase's public **publishable key** (called the anon key in older projects). Row-level security lets the public **read only** non-private data: settings without PINs, barbers, services, and queue entries without phones.
- **No table is written directly from the browser.** Every change goes through a database function:
  - Public: `join_queue`, `find_my_spot`, `cancel_my_spot`, `rate_visit`
  - Staff (need the PIN): `call_next`, `start_service`, `finish_service`, `mark_no_show`, `readd`, `cancel_entry`, `add_walk_in`, `set_break`
  - Owner (need the owner PIN): settings, services and barbers changes, and today's stats
- PINs are stored hashed, never in the frontend code.

**Where the rules live (one place each)**
- **Rules that change status** (allowed moves, Call next choice, one spot per phone, join window, tokens) are SQL functions in `supabase/migrations/`.
- **Estimates** (place in line and waiting time, using the "play it forward" rule) are pure TypeScript in `src/lib/queue/`, with Vitest tests including the worked example from `03-flows-rules.md`.

**Live updates**
- Each screen subscribes to Supabase Realtime changes on `queue_entries`, `barbers`, `services` and `settings`, and refetches when a change arrives.
- It also refetches when the tab becomes visible again or the network reconnects.
- A 30-second clock tick re-runs the estimates, so countdowns move on their own.

## 3. Folder layout

```
salon-queue/
├── AGENTS.md            ← rules for the coding agent (Codex / Antigravity / Claude Code)
├── CLAUDE.md            ← points Claude Code to AGENTS.md
├── README.md            ← live link on line 3 + test PINs
├── prompts.md           ← every prompt used, in order (submission)
├── reflection.md        ← half-page reflection (submission)
├── docs/                ← 01-brief, 02-screens, 03-flows-rules, 04-tech-deploy, research/
├── supabase/
│   └── migrations/      ← schema, security policies, functions, demo data
├── public/              ← app icons, chime sound
├── src/
│   ├── screens/         ← Home, Join, Status, Reception, Barber, Display, Admin, Poster, PinGate
│   ├── components/      ← shared UI: Button, Card, Chip, WaitRing, Sheet, StatCard, …
│   ├── lib/queue/       ← estimate rules + tests (the ONE place for wait/place logic)
│   ├── lib/             ← supabase client, API calls, realtime hooks, time helpers
│   └── styles/          ← theme.css (colour, type, shape tokens) + motion.ts (durations, easings, springs)
├── vercel.json          ← SPA rewrites (no 404 on refresh)
└── .env.example         ← VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
```

## 4. Deployment (free)

| Piece | Service | Free tier notes |
|---|---|---|
| Frontend (PWA) | **Vercel Hobby** | Auto-deploys on every push to `main`; preview link for every branch; HTTPS included (needed for PWA install). |
| Database + realtime | **Supabase Free** | 500 MB database and realtime included. Choose the **Mumbai (ap-south-1)** region. The project **pauses after 7 days with no activity**, so open the app before the demo (or add the keep-alive below). |
| Code | **GitHub** (public repo `Aadhya1435/salon-queue-management`) | Vercel deploys from it. The first commit contains only the docs. |

**Steps**
1. **GitHub:** push to `github.com/Aadhya1435/salon-queue-management`. The first commit is docs only (guide checklist).
2. **Supabase:** create a free project (Mumbai) and run the files in `supabase/migrations/` in order, either in the SQL editor or with `npx supabase db push`. Then copy the **Project URL** and the **publishable key** from Project Settings → API Keys. Older projects call the publishable key the *anon key*.
3. **Vercel:** go to Import Project and pick the GitHub repo. Vercel auto-detects Vite (build `npm run build`, output `dist`). Add the env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, then deploy.
4. **Deep links:** `vercel.json` rewrites every route to `index.html`, so refreshing `/status/…` or `/reception` never shows a 404.
5. **README:** put the live link right under the title, then the test PINs:
   ```
   # Salon Queue Management System

   **Live demo:** https://salon-queue-<name>.vercel.app
   **Hosted on:** Vercel (frontend) + Supabase (database & realtime)
   **Test PINs:** Staff 1234 (reception & barber screens) · Owner 9999 (admin)
   ```
6. **Deploy early:** right after Step 2 of the build plan. Every push then redeploys automatically.
7. **Optional keep-alive:** a free GitHub Actions cron that pings the Supabase REST endpoint once a day stops the free project from pausing before grading.

**Never commit** `.env.local` or the Supabase **secret key** (`service_role`). The publishable key is public by design; security comes from row-level security and the PIN checks in the database functions.

## 5. Build plan (from the guide, adapted)
Run the app and commit after every step.

| Step | What | Done when |
|---|---|---|
| 1 | Set up: Vite + TS + Tailwind + PWA, router with empty pages for all screens, theme tokens, Supabase schema and demo data | All routes open; `npm run build` passes |
| 2 | Home + Join Queue → **deploy to Vercel** | Live link works on a phone |
| 3 | My Status: token, place, wait ring, banners, "It's your turn", cancel, rating | Checklist 1–8 pass |
| 4 | Reception: barber cards, waiting list, Call next, walk-in, no-show, re-add | Checklist 9–15 pass |
| 5 | Barber View + TV display (flash, chime, QR) | Checklist 23–25 pass |
| 6 | Owner settings, stats and charts, QR poster | Checklist 16–21 pass |
| 7 | Edge cases, empty states, polish, full checklist | All 27 pass |
| 8 | README live link, `prompts.md`, reflection, demo video (`/brag` + phone screen recording) | Submission ready |
