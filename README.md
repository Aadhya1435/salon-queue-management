# Roselle — Salon Queue Management System

**Live demo:** https://roselle-salon.vercel.app
**Hosted on:** Vercel (frontend) + Supabase (database & realtime)
**Test PINs:** Staff `1234` (reception & stylist screens) · Owner `9999` (owner settings, opens everything)

## About
A mobile-first web app (installable PWA) for a salon queue:
- Customers join from their phone, watch their place and wait count down, and get called.
- Reception and barbers run the queue from a tablet and their phones.
- A TV in the waiting area shows who's next.
- The owner sees today's stats.

Every screen stays in sync within seconds.

## Screens
| Route | Screen | Who |
|---|---|---|
| `/` | Home | Customer |
| `/join` | Join Queue | Customer |
| `/status/:id` | My Status | Customer (private link) |
| `/reception` | Reception Dashboard | Staff PIN · tablet |
| `/barber`, `/barber/:name` | Barber View | Staff PIN · phone |
| `/display` | Waiting-Area TV | Public · TV |
| `/admin` | Owner Settings & Stats | Owner PIN |
| `/poster` | QR Poster | Owner PIN |
| `/staff` | Staff hub | Staff |

## Tech
- React + TypeScript + Vite, Tailwind CSS v4, Motion, and React Router; PWA via vite-plugin-pwa.
- Supabase (Postgres, Realtime, database functions) holds the data. All queue rules run in the database: [supabase/migrations/](supabase/migrations/).

## Run locally
```bash
npm install
cp .env.example .env.local   # add your Supabase URL and publishable key
npm run dev                  # http://localhost:5173
npm test                     # unit tests
npm run build                # production build (also builds the service worker)
```

Database setup: paste [supabase/migrations/20261124120000_salon_queue.sql](supabase/migrations/20261124120000_salon_queue.sql) into Supabase → SQL Editor → Run, once.

## Docs
- [Brief & scope](docs/01-brief.md)
- [Screens & features](docs/02-screens.md)
- [Flows & rules](docs/03-flows-rules.md)
- [Tech & deployment](docs/04-tech-deploy.md)
- [Prompts log](prompts.md)
- [Agent rules](AGENTS.md)
