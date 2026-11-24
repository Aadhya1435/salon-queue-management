# AGENTS.md — Roselle (Salon Queue Management)

**Roselle** is a mobile-first PWA for a salon queue. Customers join from their phone, see their place and wait, and get called. Reception and barbers run the queue, a TV shows who's next, and the owner sees today's stats.

> Roselle is a salon for women: screens say **stylist**; the database and code still use `barber` (table `barbers`, `/barber/*` routes kept as aliases of `/stylist/*`).

## Read first
- `docs/01-brief.md` → features and what NOT to build
- `docs/02-screens.md` → design system and every screen's layout and behaviour
- `docs/03-flows-rules.md` → flows, queue rules, test checklist
- `docs/04-tech-deploy.md` → stack, data and security model, deployment, build plan
- `docs/research/dribbble.md` → design references (patterns only, never copy a shot)

## Stack
React + TypeScript + Vite + Tailwind CSS v4 + vite-plugin-pwa. Data and live sync come from Supabase (Postgres + Realtime + database functions). Hosting is Vercel (frontend) + Supabase free tier; there is no other backend.
- `npm install` · `npm run dev` · `npm test` · `npm run lint` · `npm run build`
- Env: copy `.env.example` to `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`)
- `README.md` must start with the title, then `**Live demo:** <url>`, then the test PINs.

## How to work
- One screen or one feature per task. Don't touch other screens.
- Mobile-first: build at 390 px wide first. Then do tablet (1024×768) and TV (1920×1080) where `02-screens.md` says so.
- Use only the design tokens in `src/styles/theme.css`. No raw hex colours in components.
- Animations follow `docs/02-screens.md → Motion & delight`, using the tokens in `src/styles/motion.ts`. Every animation needs a reduced-motion fallback.
- Queue rules live in ONE place each:
  - Status changes are SQL functions in `supabase/migrations/`.
  - Place and wait estimates are in `src/lib/queue/`.
  - Reuse them; never re-implement a rule inside a screen.
- The browser never writes tables directly, only through the database functions.
- Never add anything from the "Don't build" list. If something isn't in the docs, ask before building it.
- If a screen or rule changes, update the doc first, then the code.
- After each task:
  - Run `npm test` and `npm run build`.
  - List the files you changed and how to test the change by hand.
  - Commit.
- Log every prompt the user gives, in order, in `prompts.md` (a submission requirement).
