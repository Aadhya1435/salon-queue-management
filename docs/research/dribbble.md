> **Adapted for our decisions (2026-11-24):** we're building a **mobile-first PWA in English only**, so:
> - Ignore the notes about React Native, Expo, Reanimated and Gujarati fonts.
> - Use the web equivalents instead: SVG for the wait ring, CSS transitions, `navigator.vibrate()` instead of `expo-haptics`, and Web Audio for the chime.
> - The OpenTable "SMS link" idea is out of scope (SMS is on the don't-build list). We use a **QR code** for walk-ins instead.
>
> **Chosen direction: "Plum & Orchid".** It comes from a reference screenshot the owner supplied: a healthcare-booking app concept with blob shapes, aubergine pill buttons and a lilac background. It is not one of the 23 shots below.
> - Directions A–C in §3 were considered and not chosen.
> - The patterns in §2 and the do/don't list in §5 still apply.
> - Full tokens are in `docs/02-screens.md → Design system`.

# Dribbble Research: Salon / Barbershop Queue Management App

Research date: 2026-11-24. Scope: light research for design ideas and patterns only. We are not copying any shot or its assets.

## 0. How this was gathered (read first)

- **No Dribbble page could be opened.** `WebFetch` returned empty bodies for `dribbble.com/search/barber-app`, `dribbble.com/search/queue-management` and one shot page. A plain `curl` of a shot page returned `HTTP 202` with `x-amzn-waf-action: challenge`, which is Dribbble's AWS WAF bot challenge. I tried reading an archived copy through the Wayback Machine, but this session's permission policy blocked it, so I stopped trying to reach page content.
- **So every shot below is "search snippet only".** The details come from web-search result titles (format: "Title by Designer on Dribbble") and the descriptions the search engine surfaced. All the URLs were seen in search results; none are guessed. The **Detail** column says how much the snippet actually told us about each shot.
- Before borrowing a pattern, open the shots in a normal browser to check the visuals. Colours and layouts that the snippets did not describe are my own design suggestions, not observations.

## 1. Shots table

Screens: 1 Home, 2 Join Queue, 3 My Status, 4 Reception (tablet), 5 Barber View, 6 TV Display, 7 Owner/Admin.

| # | Title | Designer | URL | Screens | Takeaway (pattern worth borrowing) | Status / Detail |
|---|---|---|---|---|---|---|
| 1 | Barbershop App Concept | Conceptzilla | https://dribbble.com/shots/20492710-Barbershop-App-Concept | 1, 2 | Dark theme with **deep-yellow accents chosen specifically to feel high-end**. It confirms our charcoal + gold brief, but the accent should be rationed. It also has a barber search by name/place and a nearby map. | Search snippet only. Medium detail (palette intent described) |
| 2 | SQUIRE – Booking app dark mode | Tomas Nozina for SQUIRE | https://dribbble.com/shots/16249857-SQUIRE-Booking-app-dark-mode | 1, 2 | A minimal dark barber app where **"join a waiting list" sits next to "book" as a first-class action**. Our Home CTA can work the same way: the queue is the hero, not a buried feature. | Search snippet only. Medium |
| 3 | Minimal dark app | Kirill Ushakov | https://dribbble.com/shots/6964715-Minimal-dark-app | 1, 3, 6 (palette) | The listed palette is near-black `#060707`, graphite `#383C3A`, **muted olive-gold `#5D552C`** and **bronze-beige `#9A876B`**. It shows that a *desaturated* gold reads more premium than a saturated yellow. | Search snippet only. High (hex codes listed). About 7 years old |
| 4 | Barber Connect – Minimal Mobile App Design | Jahid Hasan | https://dribbble.com/shots/25870215-Barber-Connect-Minimal-Mobile-App-Design | 1, 2 | A very popular (about 2.5–3.7k likes) **minimal light** barber flow: top-rated barbers, open slots, "book in a few taps". Use it as the benchmark for the number of taps from Home to Confirm. | Search snippet only. Medium |
| 5 | Barber Booking Mobile App Concept | Ahsanul Islam Tapadar | https://dribbble.com/shots/24865802-Barber-Booking-Mobile-App-Concept | 2, Light direction | A **light-blue gradient "for calm" plus black "for sophistication"**. It shows **prices upfront** and has a **notes field to describe the desired style** to the barber. We could add an optional "Note for barber" to Join Queue. | Search snippet only. High |
| 6 | Online Booking App Design for Barbers | MQoS UI/UX for MultiQoS | https://dribbble.com/shots/21587104-Online-Booking-App-Design-for-Barbers | 2 | A barber list in which each barber shows their services and slots. This supports **barber picker cards that show availability inline** (our "Free / ~20 min" sub-label). | Search snippet only. Low–medium |
| 7 | Casca – Barber & Salon App UI Kit | Sobakhul Munir Siroj | https://dribbble.com/shots/22957444-Casca-Barber-Salon-App-UI-Kit | All | A kit that ships **light and dark versions of the same screens**. Build with theme tokens from day one so that one component set serves the phone app (light or dark), reception (light) and TV (dark). | Search snippet only. Low |
| 8 | Concept for a waiting-in-line app | Akhil Dakinedi for Digital Products | https://dribbble.com/shots/2135561-Concept-for-a-waiting-in-line-app | 3 | Its status screen has three parts: **estimated wait + number of people ahead + progress indicator**. This is exactly our "4th in line · ~32 min" + ring. | Search snippet only. Medium. Old (about 2015) |
| 9 | Queue App | Kristina Spiridonova for Purrweb UI/UX Agency (motion: Nikita Zolotorev) | https://dribbble.com/shots/20215758-Queue-App | 3 | The **place-in-line card is the hero**, its value updates as you move towards the front, and a "my tickets" list sits below it. The shot has a motion layer. Animate the position number when it changes (5 → 4). | Search snippet only. Medium (3-screen breakdown described) |
| 10 | QMS – Queueing Management App | FlutterMate | https://dribbble.com/shots/21221213-QMS-Queueing-Management-App | 1, 3 | A mobile companion to a web queue system, where users "regularly monitor the status of their queue". This supports a **persistent status card on Home** once the user has joined. | Search snippet only. Low–medium |
| 11 | Break the queue app | Johny vino™ | https://dribbble.com/shots/3576776-Break-the-queue-app | 3 | The system **allocates a place with a timing**, so the user can wait somewhere comfortable and arrive when called. This is the rationale for our **"Start coming" banner**. | Search snippet only. Medium |
| 12 | COVID-19 Queue Management System App | Sena Bajraktarevic | https://dribbble.com/shots/11185047-COVID-19-Queue-Management-System-App | 1, 3 | **Reserve a number remotely and wait elsewhere**, using a bank-style ticket metaphor. This supports a ticket/token card visual for "S-14". | Search snippet only. Low–medium |
| 13 | Typline – Queue management app | Lasha Monaselidze | https://dribbble.com/shots/10868778-Typline-Queue-management-app | 1, 3 | Another remote-queue concept from the same period. It is useful mainly as an extra reference for queue-app conventions. | Search snippet only. Low |
| 14 | Join the Waitlist (+ "Waitlist for mobile web") | Tyrick Christian for OpenTable Design | https://dribbble.com/shots/3020769-Join-the-Waitlist , https://dribbble.com/shots/3035244-Waitlist-for-mobile-web | 2, 3, web | Joining from desktop **texts a link to your phone**, and the **mobile-web page tracks your place in real time**. This is a strong model for our later web app: a walk-in added at reception gets an SMS/WhatsApp link to a no-install status page. | Search snippet only. Medium. About 2016 |
| 15 | 6awla – Tablet app concept for restaurant reservations | (designer not shown in snippet) | https://dribbble.com/shots/5539292-6awla-Tablet-app-concept-for-restaurant-reservations | 4 | A **host-stand tablet app that holds slots for walk-in customers**. It is the closest analogue to our reception "+ Add walk-in". | Search snippet only. Low–medium |
| 16 | Medical Queue Management Dashboard – Concept Design (+ "Queue Summary") | Jacek Szpaczek for Semiflat | https://dribbble.com/shots/19182260--Medical-Queue-Management-Dashboard-Concept-Design , https://dribbble.com/shots/19202308--Queue-Summary-Medical-Queue-Management-Concept-Design | 4, 7 | Its tags are *patient queue, sidebar, table data*, plus a companion *summary / chart / statistics* screen. Pattern: a **live queue table** on the operational screen and a **separate summary screen for stats**. Do not mix the two. | Search snippet only. Low (tags only) |
| 17 | Queue Ticket Screen Service Concept | Lutfy Nugraha | https://dribbble.com/shots/16709445-Queue-Ticket-Screen-Service-Concept | 6, token card | A bank (BRI) queue-ticket screen exploration. The same designer also has "Queue Ticket Machine" and "Please Take Your Ticket" pieces. Use it as a reference for **ticket-number-as-hero layouts** on kiosk/TV screens. | Search snippet only. Low |
| 18 | Salon Appointment Booking System | Victoria Hovsepyan | https://dribbble.com/shots/24305879-Salon-Appointment-Booking-System | 4, 7 | A manager dashboard with **colour-coded time slots**, staff schedules, overlap/cancel/reschedule handling and analytics. Colour-code each barber's lane on reception. | Search snippet only. Medium–high |
| 19 | Barber Shop Admin Dashboard / Barbers – Dashboard Design / Barbershop Dashboard | MQoS for MultiQoS / Ricky Bahtiar for Agensip / Tonmoy Das | https://dribbble.com/shots/15953890-Barber-Shop-Admin-Dashboard , https://dribbble.com/shots/15566327-Barbers-Dashboard-Design , https://dribbble.com/shots/24944234-Barbershop-Dashboard | 7 | Owner dashboards cluster on: **revenue per barber, total revenue, customers per day/week/month, confirmed/pending/cancelled counts, stylist ratings**. The snippet merged these three, so treat the mapping of each feature to a specific shot as approximate. | Search snippet only. Medium (combined) |
| 20 | Countdown Timer | Yi Ren | https://dribbble.com/shots/2343351-Countdown-Timer | 3 | It replaces the ring with a **spiral** in which a dot travels inward, which **frees space for larger centre text**. The idea to borrow: keep the ring's centre for the big number. | Search snippet only. Medium |
| 21 | Countdown Timer Page | Brittany Ross | https://dribbble.com/shots/4051369-Countdown-Timer-Page | 3 | A **radial progress bar paired with a time readout**. This is the standard pattern for our wait ring. | Search snippet only. Low–medium |
| 22 | Beauty Time (Beauty Salon Booking App) | Mostafa Farhadi | https://dribbble.com/shots/24825237-Beauty-Time-Beauty-Salon-Booking-App | 7, history | A minimalist salon app. Bookings are split into **Upcoming / Completed / Cancelled**, which suits a segmented control (e.g. Owner "Today / Week" or "Waiting / Served / Cancelled"). | Search snippet only. Medium |
| 23 | SHYN – Salon Booking App UI Design | Naapbooks Limited | https://dribbble.com/shots/25484091-SHYN-Salon-Booking-App-UI-Design | 1, 2, Light direction | A "clean, minimal" salon app with real-time scheduling and stylist profiles. It is a reference for the light direction. | Search snippet only. Low |

**Also seen in results with a title but no useful detail.** Not used for patterns:
- "Guile: Mobile UI/UX for barbershops", https://dribbble.com/shots/24202305-Guile-Mobile-UI-UX-for-barbershops. A direct fetch was blocked.
- "Barber Booking Mobile App", https://dribbble.com/shots/22904081-Barber-Booking-Mobile-App.
- "The Barber – A Barbershop Mobile Application", https://dribbble.com/shots/15039073-The-Barber-A-Barbershop-Mobile-Application.
- "Barber's App" (Purrweb), https://dribbble.com/shots/17121870-Barber-s-App.
- "TrimTime – Barbershop mobile app" (Zakariya Buhari), https://dribbble.com/shots/23786261-TrimTime-Barbershop-mobile-app.
- "Salon – Appointment booking app – Dark Theme" (SolGuruz), https://dribbble.com/shots/17638659-Salon-Appointment-booking-app-Dark-Theme.
- "Queue Display Screen for Hospital" (Pond Narongrit). It was seen only as a listing on https://dribbble.com/tags/queue, tagged *a11y, bold, display, TV*. I never saw its shot URL, so it is not listed as a shot.

**Gap worth noting:** none of the snippets described a **barber/staff-side "Start / Done" timer** screen or an actual **"Now serving" TV board** in visual detail. Screens 5 and 6 rely more on general principles (below) than on specific shots.

---

## 2. Recurring patterns worth borrowing (grouped by screen)

### Screen 1: Home (customer)
- **Queue-as-hero.** The live "6 waiting · ~50 min" card plus the "Join Queue" CTA should own the top half of the screen. Shots #2 and #10 put the waitlist or status at the top level.
- **Status chips with dot + label.** Use `● Free`, `● Busy · 12 min`, `● On break`. Always pair the colour with a word, for accessibility and for Gujarati readers.
- **Barber avatar row.** Use a horizontal strip of round photos with a status ring or dot. It doubles as a preview of the Join Queue picker (#4, #6).
- **Persistent "My spot" mini-card.** Once the user has joined, Home shows a compact token card ("S-14 · 4th · ~32 min") that links to My Status (#10).
- **Open/Closed badge** as a pill next to the salon name. When the salon is closed, the CTA turns into a disabled state with the opening time.

### Screen 2: Join Queue
- **Selectable service cards.** Each card shows the name, a "25 min" meta line and a ₹ price aligned right. The selected state uses an accent border, a tint fill and a check. Show prices upfront (#5).
- **Barber picker cards.** "Any barber (fastest)" comes first and is preselected. Photo cards follow, each with its live wait as a sub-label (#6).
- **Sticky bottom summary bar.** It shows "2 services · 45 min · ₹350 · Expected wait ~30 min" with a full-width Confirm. It updates live as cards are toggled.
- **Max-3 rule shown inline.** Use a counter chip "2/3 selected" and a gentle shake or toast when a 4th is tapped. Do not silently ignore the tap.
- **Optional "Note for barber"** with style notes, collapsed by default (#5).
- **No-install web flow later.** Reception adds a walk-in, an SMS/WhatsApp link is sent, and the link opens a live status page (#14).

### Screen 3: My Status
- **Token/ticket card.** "S-14" is set in huge tabular numerals. Ticket notches or a perforated divider separate the token from its meta (barber, services) (#12, #17).
- **Three-part status:** position ("4th in line"), estimated wait (ring) and people ahead (#8).
- **Circular countdown ring.** The thick stroke uses a rounded cap. The ring's centre holds the big number (minutes) and a small caption (#20, #21). Use react-native-svg + Reanimated.
- **"Start coming" banner** appears at a threshold (e.g. ≤ 2 ahead or ≤ 15 min), with directions and a call button (#11).
- **Full-screen takeover for "It's your turn! Go to Ravi".** It uses the accent background and a giant barber name + photo. This is the one place the accent floods the screen.
- **Cancel spot** is a quiet text button at the bottom that opens a confirmation sheet. It should not be a red primary button.

### Screen 4: Reception dashboard (tablet landscape)
- **Two-pane layout.** Barber cards sit in a row or grid on top or left. The waiting list table fills the rest (#16, #18).
- **Barber card:** photo, name and status chip; current customer + token; a "12 min left" progress bar; and a primary "Call next" button.
- **Colour per barber lane** (#18). A small colour swatch on each card is repeated in the table's "Assigned" column.
- **Table rows** show token, name, services, assigned barber, joined time and wait. Rows waiting more than 60 minutes get an **amber tint plus a clock icon** (not colour alone).
- **"+ Add walk-in"** is a persistent primary button at top right and opens a side sheet with the same service and barber pickers as Join Queue (#15).

### Screen 5: Barber view
- **One giant state-driven button.** It reads "Start" or "Done" depending on state and is about 72–88 pt tall, filling the lower third of the screen.
- **Large elapsed/remaining timer** in tabular numerals, with service chips under it.
- **"Next for you" card** shows a token, name and services, peeking from the bottom.
- **On-break toggle** in the header, which dims the whole screen into a "Break" state with a "Resume" button.

### Screen 6: Waiting area TV
- **Big-number board.** It has one row per barber: photo, name, **"NOW S-12" in a huge accent colour**, then "Up next" with 5 tokens in a smaller neutral colour (#17).
- **Always use the dark variant** on the TV, whatever the app theme. A dark board has less glare and higher perceived contrast.
- **Sizing for 5 m on a 1080p panel.** Aim for a cap height of about 8 cm. On a 55″ TV that means "Now" tokens at about **180–220 px** font size and "Up next" tokens at about **96–120 px**. Use at most 3 text sizes in total.
- **A footer ticker** with salon name, clock and "Scan to join" QR. A QR code is a cheap, high-value addition.

### Screen 7: Owner settings / admin
- **KPI stat cards** in a 2×2 grid on phone and 4-across on web: customers served, avg wait, revenue ₹, no-shows/cancels. Each shows a small delta vs yesterday (#19).
- **Per-barber mini-stats.** Rows show served, revenue and rating (#19).
- **Segmented control** for "Today / Week / Month" (#22).
- **Grouped settings list** in the iOS-settings style: Services (name, minutes, ₹, drag to reorder), Barbers on duty (toggle per row), and a prominent **Queue open/closed master switch** in its own card at the top.
- **Keep operations and analytics separate** (#16). Stats live in Owner, not on the reception screen.

---

## 3. Candidate visual directions

> All three use one token set, `bg / surface / surface-2 / border / text / muted / primary / on-primary / accent / success / warning / danger`, so switching direction is a theme swap. I computed the key contrast pairs (WCAG ratios given). **Rule for all three:** the warning (amber, used for > 60 min) must be clearly different in hue from the brand accent, and it is always paired with an icon or label.

### Direction A: "Noir & Brass" (refined charcoal + gold)
**Mood:** an after-hours gentleman's barbershop. It is warm and quiet, and the gold is rationed for the moments that matter.

| Token | Hex | Notes |
|---|---|---|
| Background | `#0F0F11` | warm near-black, not pure #000 |
| Surface (cards) | `#18181B` | |
| Surface-2 (sheets, raised) | `#222226` | |
| Border / hairline | `#2C2C31` | |
| Text | `#F4F1EA` | warm off-white |
| Muted text | `#A19D94` | about 6.5:1 on surface |
| Primary accent (brass) | `#C9A45C` | about 8:1 on bg. Desaturated, after shot #3, not the saturated yellow of #1 |
| On-primary text | `#16120A` | about 7.8:1 on brass |
| Accent tint (selected card fill) | `#2A2418` | |
| Success (Free, Done) | `#3DBE84` | |
| Warning (> 60 min) | `#F0883E` | **orange, deliberately away from the brass hue** |
| Danger | `#EF5350` | |
| Neutral status (On break) | `#8B93A7` | slate |

- **Fonts:** **Inter** for all UI. In React Native, set `fontVariant: ['tabular-nums']` on tokens and timers. Pair it with **Noto Sans Gujarati**. An optional display serif, **Playfair Display** paired with **Noto Serif Gujarati**, is for the salon name and the "It's your turn" headline only.
- **Corner radius:** cards 16, inputs 12, buttons and chips fully rounded (999), bottom sheets 28 (top corners).
- **Inspired by:** #1 Conceptzilla (dark + gold equals high-end), #3 Kirill Ushakov (muted gold/bronze palette), #2 SQUIRE (minimal dark).
- **Best for:** the customer app in dark mode and the TV. It fits the original brief.

### Direction B: "Linen & Ink" (light, minimal, warm)
**Mood:** a bright, airy modern salon. It is ivory paper with ink-black buttons and one calm cool accent, so nothing shouts.

| Token | Hex | Notes |
|---|---|---|
| Background | `#FAF8F5` | warm ivory |
| Surface (cards) | `#FFFFFF` | |
| Surface-2 | `#F3EFE9` | |
| Border / hairline | `#E8E2D9` | |
| Text | `#1C1917` | |
| Muted text | `#6B645C` | about 5.5:1 on bg |
| Primary (buttons) | `#1C1917` | ink black, as in #5's "black for sophistication" |
| On-primary text | `#FAF8F5` | |
| Accent (selection, ring, links) | `#3E5C76` | slate blue, about 7:1 on white. A nod to #5's calm blue |
| Accent tint | `#E6EDF3` | |
| Success | `#15803D` | about 5:1 |
| Warning (> 60 min) | `#B45309` (text) on `#FEF3C7` (row tint) | about 5:1 |
| Danger | `#B91C1C` | |

- **Fonts:** **Mukta** for Latin paired with **Mukta Vaani** for Gujarati. They are the same Ek Type superfamily, so weights and x-heights match. Mukta Vaani also includes Latin glyphs, so one family can cover mixed-script strings. Check its tabular figures. If it lacks them, set tokens and timers in Inter.
- **Corner radius:** cards 20, inputs 14, buttons and chips fully rounded, sheets 28.
- **Inspired by:** #4 Barber Connect (minimal light, few taps), #5 Ahsanul Islam Tapadar (light + black + calm blue), #23 SHYN, #22 Beauty Time.
- **Best for:** the reception tablet under bright salon lighting, the owner admin and the later web app. Pair it with the dark TV board.

### Direction C: "Heritage Green" (cream + bottle green + brass, light)
**Mood:** a classic British-style barbershop, with racing-green leather, cream walls and brass fittings. It is premium without the black/gold cliché and works for a unisex salon.

| Token | Hex | Notes |
|---|---|---|
| Background | `#F6F3EC` | cream |
| Surface (cards) | `#FFFFFF` | |
| Surface-2 | `#EDE8DD` | |
| Border / hairline | `#DDD6C7` | |
| Text | `#14201B` | green-black |
| Muted text | `#5E6B64` | about 5:1 on bg |
| Primary (buttons, active) | `#1F4D3A` | bottle green, about 8.7:1 with cream text |
| On-primary text | `#F6F3EC` | |
| Accent, brass (fills, big tokens) | `#C9A050` fill with `#14201B` text. Use `#8C6420` for brass text on cream (about 4.8:1) | |
| Success | `#2E7D4F` | about 4.5:1. Close to the primary on purpose ("green = go"). Always paired with an icon |
| Warning (> 60 min) | `#C2410C` | **terracotta, kept away from brass** |
| Danger | `#9F1239` | crimson-rose |
| TV / dark variant | bg `#0E1714`, surface `#16241F`, text `#F3EFE6`, accent `#D4AE62` | |

- **Fonts:** **Anek Latin** paired with **Anek Gujarati**, a variable superfamily from Ek Type with a **width axis**. Use the normal width for the UI and a semi-condensed width for big TV tokens and the reception table, so more fits per row.
- **Corner radius:** cards 12 (crisper, more "heritage"), inputs 8, buttons 12, chips fully rounded. Token cards get ticket notches.
- **Inspired by:** #12/#17 ticket metaphors, #18 colour-coded lanes. The palette itself is my own proposal; no shot showed it.
- **Best for:** a distinctive brand if the salon wants to stand out from the many black-and-gold barber apps.

**My recommendation:** use **A for the customer phone app** (with B as its light-mode counterpart, sharing the same tokens), **B for the reception tablet, admin and web**, and **A's dark variant for the TV**. If you want a single unified look, choose C.

---

## 4. Micro-interactions that fit us

1. **Position tick-down.** When "5th" becomes "4th", the number slides or rolls upward (about 300 ms) and a light haptic fires (`expo-haptics` `selectionAsync`). This echoes the motion layer in #9.
2. **Countdown ring.** The stroke animates smoothly as estimates update. Never jump. Use about 600 ms ease-out when the estimate is recomputed (#20, #21).
3. **"Start coming" banner.** It slides down from the top with a medium haptic. It can repeat as a local notification.
4. **"It's your turn" takeover.** The accent background fades in, the barber photo scales in, and a **slow pulse** of about 1.2 s per cycle runs around the token. A success-pattern haptic and sound fire too. Respect Reduce Motion: use a static view plus haptics only.
5. **Service card select.** Press-in scale to 0.97, border and check animate on, and the summary bar's numbers count up or down.
6. **Max-3 reached.** A small horizontal shake on the 4th card, a warning haptic and an inline "Up to 3 services" hint.
7. **Big button press (Barber view).** A depress animation, a heavy haptic, then the label morphs "Start" to "Done" and the timer begins.
8. **TV "token called".** The "NOW" cell inverts (accent background, dark text) and **flashes 3 times over about 3 s**, then settles. An optional soft chime plays, and the previous token slides out to the left. Keep the animation to the one cell that changed.
9. **Reception "Call next".** The row being called lifts and slides from the table into the barber card. This makes the state change visible to staff.
10. **Amber escalation.** A row that crosses 60 minutes fades to the amber tint once. It does not keep blinking, which would get noisy.
11. **Pull-to-refresh plus a live dot.** A small "● Live" indicator gently pulses when realtime is connected and turns grey when offline.

---

## 5. Do / Don't

**Do**
- Make **one hero per screen**: the queue card (Home), the summary and Confirm (Join), the token and ring (Status), the giant button (Barber) and the NOW token (TV).
- **Ration the accent.** Use it for the primary CTA, the selected state, the NOW token and the "your turn" takeover only. Everything else is neutral.
- Use **tabular numerals** for every token, timer, price and wait, so numbers do not jitter as they update.
- Put **status in words as well as colour** (Free / Busy / On break / > 60 min), with icons. This is needed for colour-blind users and bilingual readers.
- Use **progressive disclosure**: put the "note for barber", the per-barber stats and the service editor behind taps or sheets, so features exist without cluttering the screen.
- Build with **shared theme tokens** (#7) so the phone, tablet, TV and web stay consistent and light/dark is free.
- Check that **Gujarati strings** fit the space. They often render taller and wider, so give chips and buttons flexible widths and a line-height of about 1.4 or more for Gujarati.
- Design the **empty and edge states**: queue closed, nobody waiting, all barbers on break, no internet.
- Give **44–48 pt minimum touch targets**, and much larger targets on the Barber view, which is used with busy hands.

**Don't**
- Don't use **saturated yellow-gold on large areas** or gold gradients and metallic textures. They look dated and less premium than flat, desaturated brass.
- Don't let **warning amber look like the brand gold**. Shift it to orange or terracotta.
- Don't put **analytics on the reception screen**. Keep operations and stats apart (#16).
- Don't use **more than about 3 type sizes per screen**, or more than one display font.
- Don't make **Cancel spot** a big red button. Make it quiet and confirmed.
- Don't **animate the whole TV board**. Only the changed cell flashes, and nothing loops forever.
- Don't use **pure #000 / #FFF** for large backgrounds. Use near-black and ivory to cut glare and eye strain.
- Don't hide the **expected wait** until after Confirm. Show it live in the summary bar.
- Don't copy any shot's layout, illustrations or photos one-to-one. Use them for patterns only.
