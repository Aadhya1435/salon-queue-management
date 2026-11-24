# Prompts log: Roselle (Salon Queue Management System)

Every prompt I gave the coding agent, in the order I gave it. This includes questions, corrections and the prompts that didn't work.

| | |
|---|---|
| **Live demo** | https://roselle-salon.vercel.app (Staff PIN `1234`, Owner PIN `9999`) |
| **Coding agent** | Claude Code. Rules in [`AGENTS.md`](AGENTS.md), loaded through `CLAUDE.md` |
| **Docs the prompts point to** | [`01-brief`](docs/01-brief.md) · [`02-screens`](docs/02-screens.md) · [`03-flows-rules`](docs/03-flows-rules.md) · [`04-tech-deploy`](docs/04-tech-deploy.md) |
| **Date** | 24 November 2026 · 26 prompts |
| **Demo video** | [English](demo/roselle-demo-english.mp4) · [Hindi](demo/roselle-demo-hindi.mp4) |
| **Reflection** | [`REFLECTION.md`](REFLECTION.md) |

## How I prompted

- **Docs first.** Before any code, the agent wrote the four documents from the TA guide. Build prompts then pointed to them ("Build Screen 2 from docs/02-screens.md …").
- **One step at a time, with a stop condition.** For example: "Stop when `npm run build` passes" or "stop when it works on a phone at 390 px".
- **The doc changes before the code.** When I changed my mind (women's salon, stylists, opening hours), the docs were updated first and the code followed. That's a rule in `AGENTS.md`.
- **Verify against the docs.** A QA audit prompt checked the whole app. I then re-scoped its findings against the guide's Don't-build list and fixed them in priority order.

## Overview

| Phase | Prompts | Outcome |
|---|---|---|
| 1. Plan, design and docs | 1–9 | Brief, screens, flows and tech docs; Plum & Orchid design system; Supabase backend in one SQL file |
| 2. Build | 10–15 | Every screen built on live data (Home, Join, My Status, Reception, Stylist, TV, Owner, Poster, Staff hub); app renamed to Roselle |
| 3. Fixes and polish | 16–20 | Salon name fix, status alerts check, deploy-error recovery, poster fix, easier staff login |
| 4. QA audit and fixes | 21–26 | Full audit, re-scoped to the brief, then the High, Medium, Low and content issues fixed |

## Prompts that didn't work first time

| # | What went wrong | What I did |
|---|---|---|
| 14 → 16 | "Update the application name to Roselle" renamed the app, but screens still said "Kesh Studio": the salon's name lives in the database | Asked why (16); the database, splash screen and docs were fixed. See [`REFLECTION.md`](REFLECTION.md) |
| 15 | I chose to split a commit that had mixed two changes | The agent stopped safely: parallel build agents were still writing those files. The commit was left as it was |
| 18 | The live site crashed with "Failed to fetch dynamically imported module" after a deploy | Pasted the error; the app now reloads once to the new version |
| 19 | Poster headline cut off behind the QR code on narrow screens | Sent a screenshot; the layout was fixed and checked at 3 widths |

---

## Phase 1: Plan, design and docs

### 1. Read the guide, set up the docs

> Read `Salon_Queue_Management_Vibe_Coding_Guide.pdf` in full and follow its setup steps. Prepare the initial documents and `AGENTS.md` needed to build this project: the Project Brief & Scope (`docs/01-brief.md`), Screens & Features (`docs/02-screens.md`) and the rest. I want to build and deploy the project end to end as part of my assignment, and finish with a demo made with the /brag skill. Use Dribbble for good design ideas. The app is mobile-first, then extended to the web, and should be minimal yet feature-rich. Ask me any questions before you start.
>
> Also recommend the ideal tech stack and deployment. We'll deploy for free, since this is an assignment.

**The agent asked, and I chose:** mobile-first PWA (React + Vite) · English only · show me Dribbble options first · extras: QR code to join, owner charts, star rating.

**Result:** `docs/01-brief.md`, `03-flows-rules.md`, `04-tech-deploy.md`, `AGENTS.md`, `CLAUDE.md` and `docs/research/dribbble.md` (Dribbble blocks automated page loads, so the research uses search-result snippets of 23 shots).

### 2. Pick a visual direction

*[The agent showed a moodboard with 3 directions.]*

> Let's go with the first theme.

**Result:** `docs/02-screens.md` written for all 9 screens; its design system waits for my screenshots.

### 3. Reference screenshots

*[Two Dribbble screenshots: a pink salon-booking app and a plum healthcare app with blob shapes.]*

> I like the second one more. Let's build a UI similar to it.

**Result:** the **Plum & Orchid** design system (colour tokens, type, shapes, 10 signature components) in `docs/02-screens.md`.

### 4. More engaging design and animations, plus accounts

> Make the design more engaging and add great animations. I've created new GitHub, Vercel and Supabase accounts for this project. Tell me what needs to be pushed and I'll do it.

**Result:**
- A "Motion & delight" section with 23 animation moments.
- Stylist signature shapes, a journey tracker and a "You're in!" celebration.
- A list of what to push to GitHub, Vercel and Supabase.

### 5. Repo and Supabase details

> Repo: https://github.com/Aadhya1435/salon-queue-management.git. Supabase project URL: https://aymjpplhcpglmmscdpzm.supabase.co, p

**Result:** The GitHub remote was added, and a check confirmed Supabase responds.

### 6. Commit identity

> Commit as "Aadhya Thaker" (202612100@dau.ac.in).

**Result:** the repo's git identity is set to Aadhya Thaker.

### 7. Declutter the Home hero

*[Screenshot of the Home hero in the prototype.]*

> The upper part of the screen looks a bit cluttered. Can we fix that?

**Result:** the hero now has three calm groups (identity, waiting count, Join button), and `docs/02-screens.md` was updated.

### 8. Vercel setup and the Supabase command

*[Screenshot of Vercel's "New Project" page.]*

> What should I do on this screen? Also give me the Supabase setup command.

**Result:**
- The whole backend in one SQL file: tables, row-level security, every queue rule as a database function, PIN checks, stats and demo data.
- Tested in a local Postgres with 46 rule checks.
- Step-by-step Vercel settings.

### 9. Stylist cards and "your turn" time

*[Screenshot of the stylist cards from the moodboard.]*

> Add stylist selection to the UI like this. Also show roughly how many minutes until the customer's turn.

**Result:** stylist cards on Join (avatar, name, wait) and "Your turn in about 50 min · around 3:00 PM" on Join and My Status.

## Phase 2: Build

### 10. Step 1: set up the project

> Read AGENTS.md and all of docs/. Summarise the app in 8 bullets and list any questions. Then do Step 1 of the build plan: set up Vite + React + TypeScript + Tailwind + PWA + Motion, empty pages for every route in docs/02-screens.md, the Plum & Orchid theme and motion tokens, and the Supabase schema with demo data. Stop when `npm run build` passes.

**Result:**
- An 8-bullet summary and 4 questions, answered with sensible defaults.
- Vite + React + TypeScript + Tailwind v4 + Motion + PWA.
- Theme and motion tokens, and placeholder pages for every route.
- The Supabase client connected to the live database. Build, lint and tests pass.

### 11. Check the must-haves

> Do we also have the receptionist's walk-ins and Call next buttons? What about stylists: how do they mark a customer Done? And where do the owner settings live: services (time + price), stylists on duty, and opening/closing the queue? These are must-haves:
>
> *[Pasted from the guide: Users; Must-have features 1–6; Don't build: online payment, future-date appointments, SMS/WhatsApp, loyalty, multiple branches.]*

**Result:** a table mapping each must-have to its screen and database function. All six were in the docs and the database; the screens were the next build steps.

### 12. Build Home and Join

> Rename the app to Waitly. Then build Screen 1 (Home) and Screen 2 (Join Queue) from docs/02-screens.md with live data from Supabase, including the "play it forward" wait rule from docs/03-flows-rules.md §4 in src/lib/queue/ with tests. Validate phone numbers and the 3-service limit, show the "You're in!" celebration after Confirm, and stop when it works on a phone at 390 px.

**Result:**
- Home and Join run on live data.
- The wait-time rule lives in one place (`src/lib/queue/`) with unit tests.
- Phone and 3-service validation, and the "You're in!" celebration.

### 13. Finish every screen in parallel *(sent while 12 was running)*

> The goal is to deploy as soon as possible with all the core features working. Spawn several high-effort Opus agents and finish the build.

**Result:**
- Four agents built the rest in parallel: My Status; Reception; Stylist view + TV; Owner + Poster. A Staff hub was added too.
- Every staff action was tried on the live database. 41 tests, lint and build pass.
- Go-live steps for me: push, add the `roselle-salon.vercel.app` domain, and turn off Vercel Authentication.

### 14. Rename the app to Roselle

> Update the application name to Roselle.

**Result:**
- Renamed Waitly → Roselle in the code, docs, PWA manifest and storage keys.
- The agent warned that the commit had also picked up unfinished screen work, and asked whether to split it.

### 15. Split the commit? *(didn't work)*

> Option 2: split it.

**Result:** the agent stopped before rewriting history, because the parallel build agents were still writing to those files. The commit was left as it was.

## Phase 3: Fixes and polish

### 16. The salon still says "Kesh Studio" *(fix)*

> Why does it still say "Kesh Studio" instead of "Roselle"?

**Result:** the salon's name is stored in the database, not the code. It was renamed there, removed from the splash screen, and updated in the docs.

### 17. Status alerts *(question)*

> Do we have these features?
> - At 2nd in line: a "Start coming to the salon" banner
> - When called: a full-screen "It's your turn! Go to Neha"
> - [Cancel my spot] with a confirmation pop-up

**Result:** yes, all three were built (with file references). The takeover is plum, not the guide's gold.

### 18. Crash after a deploy *(fix)*

> The live site shows this error:
> "Unexpected Application Error! Failed to fetch dynamically imported module: https://roselle-salon.vercel.app/assets/StaffHub-he8AVsW7.js"

**Result:**
- An open page now reloads once to the new version, with a friendly "A new version is ready" page as a fallback.
- The offline cache updates itself, and missing files return a proper 404.

### 19. Poster text cut off *(fix)*

*[Screenshot of the poster on a narrow screen.]*

> Please fix this: some text is getting cut off.

**Result:** the poster grows taller instead of letting the QR code cover the headline. Checked at 390, 634 and 1280 px; still exactly one A4 page in print.

### 20. Easier staff access for the TA

> Make the Staff login button bigger and more noticeable so the TA can find it and test the app. Also add a back button on Reception and the other staff screens.

**Result:** a full-width **Staff login** card on Home, and back buttons on Reception, Stylist, Owner and TV.

## Phase 4: QA audit and fixes

### 21. Full QA, content and edge-case audit

<details><summary>Prompt (long)</summary>

> Role & Objective:
> Act as an expert QA Engineer and UX/Content Auditor. Conduct a comprehensive, end-to-end review of the entire application and website. Your goal is to identify technical bugs, content inconsistencies, and uncovered edge cases, then categorize them by severity.
>
> Please perform the following tasks:
>
> 1. Functional & Technical Bug Audit
> Thoroughly test all workflows, user journeys, and interactive elements. Categorize findings into:
> - Critical Bugs: Blockers, crashes, security vulnerabilities, or broken core functionality (e.g., checkout failures, login loops).
> - High Priority Bugs: Major feature malfunctions or significant UX degradations that have workarounds but severely impact usability.
> - Medium Priority Bugs: Minor functional flaws, visual misalignments, or non-breaking technical glitches.
>
> 2. Content & Copy Review
> Audit all text across the website and application. Flag and list:
> - Typographical, grammatical, or formatting errors.
> - Broken links, placeholder text (e.g., "Lorem Ipsum"), or outdated information.
> - Tone inconsistencies or ambiguous messaging that could confuse the user.
>
> 3. Uncovered Edge Cases & Hidden Vulnerabilities
> Think outside the box to test scenarios we might have missed. Specifically analyze:
> - Extreme inputs (e.g., massive text payloads, negative values, special characters/emojis in forms).
> - Interruptions and network stress (e.g., sudden loss of connectivity mid-transaction, rapid double-clicking on submit buttons, back-button abuse).
> - State conflicts (e.g., operating the app in multiple tabs simultaneously, expired sessions, concurrent account modifications).
>
> Deliverable Format:
> Provide a detailed, structured report using tables or bulleted lists. For every issue found, include:
> - Description: What the issue is.
> - Steps to Reproduce: How to trigger it.
> - Expected vs. Actual Behavior: What should happen vs. what actually happens.
> - Severity/Category: (Critical / High / Medium / Content / Edge Case).

</details>

**Result:**
- A report with reproduction steps: 3 Critical, 6 High, 13 Medium and 10 Content issues, plus an edge-case matrix.
- Read-only checks on the live database confirmed the main findings. No code was changed.

### 22. Fix the High issues

> Fix H1–H4 first, with one change to H4. Don't change the app settings. Update the brief to replace /barber with /stylist, since this is a women's salon. Keep the demo hours from the PDF instead of opening 24 hours, and change the app's "Any" label to "Any stylist". Ask me if you have any questions.

**The agent asked, and I chose:** live demo hours 10 AM–9 PM · lock PIN changes on the demo · stylist wording in all docs.

**Result:**
- A re-added no-show's old link now leads to the new spot.
- Join shows "Can't reach the salon" with Try again instead of loading forever.
- PIN changes are locked on the demo, so the README PINs always work.
- All docs say stylist and `/stylist`, and the app says "Any stylist".

### 23. Fix the Medium issues; QR codes open Join

*[Editor selection: the demo-hours SQL file I had just run.]*

> I've run the SQL. Now fix the Medium bugs. In particular, scanning a QR code should take the customer straight to the Join page, where she adds her details, picks up to 3 services and joins the queue.

**Result:** the 14 Medium fixes were finished:
- Every QR code opens the public Join page, wherever it was printed from.
- A "Turn on sound" card for the "It's your turn" chime.
- Phone and name input rules, matching in the app and the database.
- The TV board shows without a blocking start screen.
- Stylist addresses survive a rename.

All four SQL files were tested in order in a local Postgres (32 checks).

### 24. Choosing services *(question, in a second window)*

> Then how do customers select their services?

**Result:** scanning opens Join, where the customer picks up to 3 services and a stylist herself.

### 25. Hours to 11 PM; low-priority and content fixes

> Update the docs to say 11 PM. Then start fixing the low-priority and content bugs. Ask me if you have any questions.

**Result:**
- Docs and README now say 10 AM–11 PM.
- Low-priority fixes: retrying after a dropped connection finishes the join; times use the server's clock, not a wrong phone clock; each Reception stylist card shows its own working state.
- TV: "+n waiting for a stylist on break" under Up next.
- Copy fixes on the 404 page, Reception and the README header.

### 26. TV screen opened on a phone

*[Screenshot: the TV board cut off on a 360 × 800 phone.]*

> This is how the TV screen looks on a phone. Add a note so that if the TA opens it on a phone, they know this screen needs a large display and won't fit on a phone screen.

**Result:** on small screens `/display` first shows "This is the waiting-area TV screen… open it on a laptop or TV", with [Show it anyway]. The README says the same.
