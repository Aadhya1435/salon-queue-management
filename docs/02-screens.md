# Roselle — Screens & Features

Every screen: its URL, who uses it, what's on it from top to bottom, what each button does, and how it looks on phone, tablet and TV. Rules referred to here (place, wait, Call next, statuses) are defined in [03-flows-rules.md](03-flows-rules.md). Don't re-invent them in a screen.

**Mobile-first.** Design each screen at **390 px wide** first. Then:
- **Tablet:** 1024×768 landscape (Reception)
- **Desktop / web:** ≥ 1280 px (Home, Join, Status, Admin get a roomier two-column layout)
- **TV:** 1920×1080 (Display)

---

## 0. Design system

> **Chosen: "Plum & Orchid".** The owner picked this from a reference screenshot of a Dribbble healthcare-booking concept. Its style is:
> - a soft lilac background with white cards
> - deep aubergine pill buttons
> - an orchid highlight
> - playful blob shapes
>
> We borrow the **style**, not the screens: no copied layouts, names, photos or illustrations.
> Preview on our screens: https://claude.ai/artifact/JsYXBPE7wmQsxNJcaFiREo · Research: [research/dribbble.md](research/dribbble.md)

### Colour tokens (`src/styles/theme.css`; components use only these)
| Token | Value | Used for |
|---|---|---|
| `bg` | `#F3EFF4` | App background (lilac mist) |
| `surface` | `#FFFFFF` | Cards, sheets, inputs |
| `surface-2` | `#ECE5EE` | Unselected chips, ring tracks, secondary buttons |
| `border` | `#E3DAE6` | Hairlines (cards are borderless with a soft shadow) |
| `text` | `#2A1F2F` | Headings and body |
| `muted` | `#6B5F71` | Secondary text (5.3:1 on `bg`) |
| `primary` / `on-primary` | `#3F2C46` / `#FFFFFF` | Pill buttons, selected chips and tiles, dark pills |
| `hero` → `hero-2` | `#4A374F` → `#6E5276` | Home hero panel, gradient feature cards, "It's your turn" |
| `accent` / `on-accent` | `#C2439F` / `#FFFFFF` | Count badges, token pill, stars, "Start coming" dot |
| `accent-tint` | `#F7E4F2` | Banners, selected-row highlight |
| `success` / `success-tint` | `#1B6E4F` / `#DCF2E7` | Free, Done |
| `warning` / `warning-tint` | `#A04A08` / `#FDEBD8` | Waits over 60 min (orange, never pink) |
| `danger` | `#B3261E` | Errors, destructive confirm |
| `break` | `#8B8291` | On break |
| Blob colours | orchid `#E7A4EE → #B65CC4` · plum `#8C5E92` · mint `#55AC8D` · sky `#6189CF` · white | Decoration only |
| Barber colour + shape | Ravi `#A64DB5` star · Amit `#2F8A6B` clover · Imran `#4A72BC` circle · then `#8C5E92` pill | Signature avatar (shape + initial), Reception lane, TV row |
| TV board | bg `#2B2030` · surface `#3A2C40` · line `#4A3A51` · text `#F7F1F8` · muted `#B9AEBF` · accent `#E08FE6` · on-accent `#2B2030` | `/display` only (always dark) |

### Type
- **Plus Jakarta Sans** (Google Fonts), weights 400–800, fallback `system-ui, sans-serif`. One family only.
- **Scale:** 12 caption · 14 small · 16 body · 20 title · 28 heading · 40 big number · 64 token. On the TV: 180+ for NOW and 96+ for Up next.
- Big numbers and the salon name use weight 800 and letter-spacing −0.03em.
- Use `tabular-nums` on every token, timer, price and wait. If the font's tabular figures look off, fall back to Manrope for numbers.
- At most 3 sizes per screen.

### Shape and depth
- **Radius:** cards 28 · sheets 32 · inputs 18 · buttons, chips and segmented controls are pills · avatars are circles.
- **Cards:** white, no border, shadow `0 10px 30px -14px rgb(63 44 70 / .22)`.
- **Spacing:** 4 px grid; 20 px screen padding on phone.
- **Tap targets:** at least 44 px; main buttons 56 px; the Barber View's main button 72 px or more.

### Signature components
1. **Pill button with an arrow bubble:** an aubergine pill with the label on the left and a round translucent bubble with › on the right ("Confirm · ₹230 ›").
   - Secondary: a white pill with dark text.
   - On dark panels: a white pill.
2. **Round icon button:** a 44–48 px white circle (back, search, ⋯).
3. **Identity row:** an avatar or logo plus two lines ("Roselle" / "Open · until 9 PM"). On dark panels it has no background.
4. **Summary pill:** a full-width dark pill with one key fact and "View ›" (Home's "My spot").
5. **Gradient feature card:** `hero → hero-2` with white text and an avatar overlapping its top edge (the token card, the barber's current customer).
6. **Chips:** mauve pills. Selected = aubergine fill with white text (barber picker, filters).
7. **Selectable tiles:** white. Selected = a 2 px aubergine ring and a round check badge (service picker).
8. **Count badge:** a small orchid circle with a white number ("Services ②", "Barbers today ③").
9. **Blob cluster:** soft shapes (circle, pill, 4-point star, clover) in the blob colours.
   - **Home:** a small corner cluster of 3–4 shapes, cropped by the hero's top-right edge.
   - **"It's your turn", the TV's idle state, the QR poster:** the fuller cluster of 6–8 shapes.
   - **Empty states:** 3 shapes at most.
   - At most one cluster per screen.
   - They drift slowly, and stay still when *reduce motion* is on.
10. **Segmented control:** a pill track in `surface-2` with an aubergine thumb (Admin's Today | Settings).

**No bottom navigation bar.** The customer flow is linear (Home → Join → Status), and each staff screen does one job.

**Design principles** (from the research):
- **One hero per screen:** the hero panel (Home), the Confirm pill (Join), the token card and ring (Status), the giant button (Barber), the NOW token (TV).
- **Ration the orchid.**
  - Aubergine carries buttons and selections.
  - Orchid appears only on count badges, the "Start coming" highlight, stars, the token pill and the TV's NOW tokens.
- **Status in words and colour:** ● Free · ● Busy · 12 min left · ● On break · 🕒 62 min.
- **Quiet destructive actions.** Cancel my spot is a text link that opens a confirmation, never a big red button.
- **Motion with a purpose:** every animation, its trigger and its timing is listed in [Motion & delight](#motion--delight). Everything respects *reduce motion*.

**Shared pieces:**
- **Offline banner** at the top: "Offline — reconnecting…".
- **Toasts** at bottom centre, which disappear after 3 s.
- **Skeletons** while loading. Never a blank screen.
- **Confirm dialog:** a bottom sheet on phone, a centred dialog on tablet and desktop.
- **Formats:** times like `2:25 PM`; money like `₹230` (no decimals); phones like `98765 43210`.
- Every list has a friendly **empty state** (wording given per screen below).

---

## Motion & delight

Motion shows what changed and celebrates the moments that matter. It is never decoration for its own sake.
- Every effect has a *reduce motion* fallback: a plain fade, or no animation.
- On phones, only three things loop: the blob drift, the live dot, and the "your turn" pulse.

**Tools**
- **Motion for React** (`motion` package): springs, shared-layout moves and enter/exit.
- The browser's **View Transitions API** for screen-to-screen changes, where supported.
- Plain CSS for loops.

Try every moment in the interactive prototype: https://claude.ai/artifact/JsYXBPE7wmQsxNJcaFiREo (section "Plum & Orchid in motion").

### Motion tokens (`src/styles/motion.ts`)
| Token | Value | Used for |
|---|---|---|
| `fast` | 150 ms | Press feedback, chip colour |
| `base` | 250 ms | Fades, small moves |
| `slow` | 450 ms | Cards, banners, the ring |
| `celebrate` | 900 ms | Confetti, the "your turn" reveal |
| `ease-out` | `cubic-bezier(.2,.8,.2,1)` | Most transitions |
| `spring-pop` | stiffness 500, damping 22 (a small overshoot) | Taps, badges, check marks |
| `spring-soft` | stiffness 170, damping 26 | Layout shifts, sliding thumbs |

### Signature moments
| # | Screen | Trigger | What moves | Timing |
|---|---|---|---|---|
| 1 | Home | Load | Hero items fade up in turn; blob shapes pop in, then drift; the waiting count counts up from 0; barber cards rise; a busy barber's ring fills to show how much of the current service is done | Stagger 60–90 ms; drift loop 6–7 s |
| 2 | Home | Count changes (realtime) | The number rolls up or down like an odometer | 380 ms |
| 3 | Join | Tap a service | The tile squashes and springs back (0.94 → 1.03 → 1), the check badge pops, the count badge bumps, minutes and price count to the new totals; 10 ms vibration | `spring-pop` |
| 4 | Join | Tap a 4th service | The tile shakes sideways, the hint turns orchid ("Up to 3 services"); 30 ms vibration | 400 ms |
| 5 | Join | Pick a barber | The selection ring slides to the chosen barber card, the avatar pops, and "Your turn in about … min" rolls to the new value | `spring-soft` |
| 6 | Join | Confirm | The arrow bubble becomes a spinner, then a ✓ | About 1 s |
| 7 | **You're in!** | After Confirm | A plum screen: the check circle pops and its tick draws itself; blob confetti bursts from it; the token rolls through numbers like a ticket counter and lands on **S-14**; [See my spot ›] | `celebrate` |
| 8 | My Status | Place changes | The place, minutes and "call you around" time roll; the ring eases to its new value; a soft shine sweeps across the token card | `slow` |
| 9 | My Status | Reaches 2nd | The banner opens (its height animates, so nothing jumps) with a spring; the journey moves to "Coming"; 30 ms vibration | `slow` |
| 10 | My Status | Reaches 1st | The banner text cross-fades to "You're next!" and the banner glows twice | 2 × 800 ms |
| 11 | It's your turn | Waiting → Called | A plum circle grows out of the token card to fill the screen; blob shapes burst in; "It's your turn!" rises word by word; the avatar pulses; vibration 200-100-200 and a chime | 750 ms reveal; pulse loop 2.4 s |
| 12 | Done | Load, or tap a star | Stars pop in one by one. Tapping fills them in order with a pop and a small confetti burst, then "Thanks!" fades in | Stagger 70 ms |
| 13 | Any screen | Route change | Slide 36 px plus fade, in the direction of the flow (forward from the right, back from the left) | 360 ms |
| 14 | Reception | Call next | The called row lifts out of the table and flies into the barber card (shared layout); the rows below close the gap | `spring-soft` |
| 15 | Reception | New walk-in or online join | The row slides in at the end and flashes `accent-tint` once | 600 ms |
| 16 | Reception | A wait passes 60 min | The row fades to the warning tint once (no blinking) | 600 ms |
| 17 | Barber View | Start / Done | The big button squashes on press; its label morphs Start → Done; the timer digits roll; Done fires a small confetti burst | `spring-pop` |
| 18 | Barber View | On break | The screen dims and blurs slightly, and the "On break" card rises | `slow` |
| 19 | TV | Token called | Accent floods the barber's row from the left; the row glows 3 times; the token pops (1.15 → 1); a "S-14 → Amit" banner drops in for 4 s; chime | About 3 s, then still |
| 20 | TV | Up next changes | The called token slides out to the left; the rest glide up (FLIP); the new last token fades in | 450 ms |
| 21 | TV | Idle or empty | The blob cluster orbits slowly around the QR code | 20 s loop |
| 22 | Admin | Load | Stat numbers count up; chart bars grow from zero in sequence; the line draws itself | 600 ms, stagger 40 ms |
| 23 | Everywhere | Loading or live | A skeleton shimmer in `surface-2`; the `● Live` dot breathes | 1.4 s loop |

### Haptics and sound
These work on phones that support them and are never required.
- **Vibration:**
  - 10 ms when a primary button is tapped
  - 30 ms for "Start coming" and for a refused tap
  - 200-100-200 for "It's your turn"
- **Chime:**
  - The TV plays it on every call.
  - The phone plays it on "It's your turn", but only if the page has already been tapped once (a browser rule).

### Engaging touches
- **Barber signature shapes.** Each barber owns a blob shape and a colour: Ravi is an orchid star, Amit a mint clover, Imran a sky circle, and the next barber a plum pill.
  - The avatar is that shape with the barber's initial.
  - The same shape marks the barber's Reception lane and TV row.
  - While a barber is busy, a thin ring around the avatar shows how much of the current service is done.
- **Journey tracker on My Status.** Five dots, Joined · Coming · Your turn · In chair · Done, with the current one glowing orchid. Like a delivery tracker, it shows where you are at a glance.
- **"You're in!" celebration** between Confirm and My Status (moment 7).
- **"Your turn in about 15 min · around 2:25 PM"** on Join and My Status: now + the estimated wait, from the same rule as the ring.

---

## Screen 1: Home (`/`)
**Who / why:** a customer, on their phone, checks how busy the salon is and joins.

**Phone layout, top to bottom**
1. **Hero panel** (dark plum `hero` gradient, bottom corners rounded 32, white text). Keep it calm: three groups (who we are, how busy it is, join) with generous space between them.
   - **Identity row:** logo circle "R", "Roselle", and `● Open · until 9 PM` (or `● Closed · opens 10 AM`) underneath. There's no pill background and no extra buttons; Find my spot is the link below the barbers.
   - **Corner art:** a small blob cluster (3–4 shapes) tucked into the top-right corner and cropped by the panel edge. It never gets a row of its own.
   - "**6** waiting" (big number), "about **50 min** if you join now", and a small `● Live` dot (grey when offline).
   - Empty state: "No one waiting — walk right in!"
   - **[ Join the queue › ]**, a white pill button with an arrow bubble.
     - If the device already has an active spot, it becomes a **summary pill**, "S-14 · 4th · about 30 min   View ›", which opens My Status.
     - If joining is closed, the pill is disabled and the reason shows under it, e.g. "Online queue is closed. Walk-ins welcome until 9:00 PM."
2. **Barbers today** with a count badge. One white card per barber on duty, each with:
   - the barber's signature avatar (their shape and initial), with a thin ring while busy that shows how much of the current service is done
   - the name
   - a status chip: `Free` (mint), `Busy · 12 min` (mauve) or `On break` (grey)
3. **"Already in the queue? Find my spot"** opens a sheet. Enter a phone number and tap [Find]: the app opens that spot's status, or says "No active spot for this number today."
4. **Footer:** small "Staff" link to `/staff`.

**Desktop:** two columns. Left: salon, queue card and Join button. Right: barbers and a 3-step "How it works".

---

## Screen 2: Join Queue (`/join`)
**Who / why:** a customer joins the queue in under a minute.

**Phone layout**
1. **Header:** ‹ back + "Join the queue".
2. **Name** (2–30 chars) and **Phone** (a fixed `+91` prefix and the numeric keypad; formatted as you type; checked when you leave the field: "Enter a 10-digit mobile number").
3. **Services** with an orchid count badge and "up to 3".
   - A 2-column grid of white tiles, one per active service: a small blob icon, the name, and `30 min · ₹150`.
   - Selected tiles get a 2 px aubergine ring and a round check badge.
   - Tapping a 4th service shakes the tile gently and shows "Up to 3 services".
4. **Barber:** a row of equal cards: 4 across on a phone, scrolling sideways if there are more barbers. Each card shows:
   - an avatar: ★ on aubergine for **Any**, or the barber's signature shape with their initial
   - the name ("Any", "Ravi")
   - the wait if you pick them (`~50 min`), or "On break" (the card is dimmed but can still be picked)

   **Any** comes first and is preselected. The selected card gets a 2 px aubergine ring and an `accent-tint` fill, and this highlight slides from card to card.
5. **Your-turn strip** (just above the button):
   - a clock icon
   - "Your turn in about **50 min**", which rolls to the new number when the barber changes
   - "around 3:00 PM · 2 services · 45 min" underneath (now + the wait)

   If the chosen barber is on break, it says "Ravi is on break" and "No estimate until Ravi is back".
6. **Sticky footer:** the your-turn strip, then the pill button **[ Confirm · ₹230 › ]**.
   - The footer updates live as services and barber change.
   - Confirm is disabled until the form is valid.

**Buttons**
- **Confirm:**
  - Creates the spot and shows the **"You're in!"** celebration: a plum screen with a check, blob confetti, and the token rolling to S-14 (Motion moment 7).
  - Then opens My Status. [See my spot ›] skips ahead.
  - If the phone already has a spot, a dialog says "You're already in the queue as S-14" with [View my spot].
  - If joining closed meanwhile, it shows "Online queue just closed. Walk-ins welcome until 9:00 PM."

**Desktop:** the form on the left, and the summary as a sticky card on the right.

---

## Screen 3: My Status (`/status/:id`)
**Who / why:** a customer watches their place from anywhere and gets called. `:id` is the private random id of the spot, not the token.

**Waiting (phone)**
1. **Header:** a round back button, "Your spot", and `● Live`.
2. **Journey tracker:** 5 dots (Joined · Coming · Your turn · In chair · Done) on a thin track. Finished steps are aubergine; the current one glows orchid.
3. **Banner** (when it applies, see rules §4). It opens smoothly instead of pushing the page down.
   - "Start coming to the salon" (2nd)
   - "You're next! Please be at the salon" (1st)
   - "Ravi is on break…"
4. **Token card** (gradient feature card):
   - the chosen barber's avatar (or ★ for Any) overlapping the top edge
   - a small "TOKEN" label
   - **S-14** very large in white
   - "Haircut + Beard trim · Any barber"
5. **Wait card** (white), with "Your turn in about **15 min** · around **2:25 PM**" (now + the wait) under it:
   - **Left:** the **place**, "**2nd** in line · 1 ahead · joined 2:05 PM". The number rolls when it changes.
   - **Right:** the **wait ring**, an orchid circular countdown with "**15** min" in the centre. It counts down by itself and eases to new values.
6. **Install hint card** (once, dismissible): "Add to Home Screen to check your place faster."
7. **Cancel my spot**, a quiet link. It opens a confirmation, "Cancel your spot S-14? You'll lose your place.", with [Keep my spot] and [Cancel spot].

**Other states**
| State | Screen |
|---|---|
| **Called** | Full-screen plum takeover with the blob cluster drifting: the barber's avatar with a slow pulse, "**It's your turn!**", "Go to **Amit**", an orchid token pill "S-14", and "Show this screen at the desk". The phone vibrates (pattern 200-100-200 ms) where supported. |
| **In chair** | "You're with Amit", the elapsed time and the services. |
| **Done** | "Thanks for visiting Roselle!" and "How was your visit with Amit?", with 5 large stars and [Skip]. After a tap: "Thanks! See you next time" and [Join again]. |
| **Cancelled** | "Your spot was cancelled" (by you / by the salon) and [Join again]. |
| **No-show** | "You missed your turn. Please speak to reception." |
| **Unknown / old link** | "This spot isn't active any more" and [Go to home]. |

**Desktop:** the ticket and ring on the left, details and banners on the right.

---

## Screen 4: Reception Dashboard (`/reception`): tablet, Staff PIN
**Who / why:** the receptionist runs the whole queue from one screen.

**Tablet layout (1024×768 landscape)**
1. **Top bar:**
   - Salon name, `● Live`, clock
   - Online-queue pill (`Online: open until 8:30 PM` / `Online: closed`)
   - **[ + Add walk-in ]** (primary)
   - [Lock]
2. **Barber cards:** a row of up to 3–4 equal columns. Each card has:
   - a colour stripe in the barber's colour, avatar, name and status chip
   - the current customer: token, first name, services
   - the state line, either "Called · 3:12 ago" or "In chair · 12 min left" with a **progress bar**
   - one main action that depends on state: **[Call next]** · **[Start]** · **[Done]**
   - when Called: **[No-show]**, disabled with a countdown "No-show in 6:12" until 10 min have passed
   - a small **Break / Available** switch
   - when nobody is eligible for Call next, the button is disabled and reads "No one waiting for Amit"
3. **Waiting list** (a table in queue order). Columns:
   - Place
   - **Token**
   - Name
   - Services (chips)
   - Wants (barber name with their colour dot, or "Any")
   - Waiting (minutes since joining)
   - Est. wait
   - [Cancel]

   Rows waiting **over 60 min** get the warning tint, a clock icon and "62 min". The tint fades in once and never blinks.

   Empty state: "No one waiting — walk right in!"
4. **No-shows today (n):** a collapsible list under the table. Each row shows token, name and called time, with **[Re-add]** (new token, end of queue).

**Add walk-in (side sheet from the right)**
- Name, phone, services, barber: the same pickers and rules as Join, plus a live summary with the expected wait.
- **[Add to queue]** shows a success panel: the big token "S-22", a **QR code of their status link** ("Scan to follow your place"), and [Done].
- A duplicate phone shows "Already in the queue as S-14."

**Other actions**
- **Cancel** asks "Cancel S-15 (Kunal)?", with [Keep] and [Cancel spot].
- **Call next** moves the called row out of the table into the barber card with a short slide.

**Phone fallback:** barber cards stack, the table becomes a list of cards, and Add walk-in becomes a full-screen sheet.

---

## Screen 5: Barber View (`/barber/:name`, e.g. `/barber/ravi`): phone, Staff PIN
**Who / why:** a barber sees who's in the chair and who's next, with busy hands. `/barber` (no name) shows a list of barbers to pick from.

**Phone layout**
1. **Top bar:** signature avatar + "Ravi" + status chip, and a **Break / Available** switch. [Lock] is in the ⋯ menu.
2. **Hero card** (a gradient feature card with the customer's token large), which depends on state:
   - **Free, someone waiting:** "You're free" and a giant **[ Call next ]**
   - **Free, nobody waiting for you:** "No one waiting for you" (button disabled)
   - **Called:** **S-14** large, "Kunal", the service chips, "Called 2:13 ago", and a giant **[ Start ]**
   - **In chair:** **S-14**, "Kunal", the service chips, a big elapsed timer `12:40`, "of 45 min" with a progress bar, and a giant **[ Done ]**
   - **On break:** the whole screen dims and shows "On break" with **[ I'm back ]**
   - The giant button is the aubergine pill with an arrow bubble, at least 72 px tall and full width, in the lower third.
3. **Next for you** card: "S-15 · Rohan · Haircut · waiting 18 min", the customer Call next would pick.
4. **Your queue:** "3 waiting for you (1 chose you · 2 any barber)".
5. **Today:** "6 done".

**Rules shown in the UI:**
- Break can't be switched on while someone is Called or In chair; the switch is disabled with "Finish with S-14 first".
- Call next follows rules §3.

---

## Screen 6: Waiting-Area TV (`/display`): 1920×1080, public
**Who / why:** customers in the salon see who's being served and who's next, from up to 5 m away.

**Layout**
1. **Start screen:** "Tap to start display" (unlocks sound, keeps the screen awake, goes full screen).
2. **Left (≈ 65%):**
   - A header with the salon name and a clock.
   - One row per barber on duty: avatar, name, then **NOW S-12** in the accent colour (at least 180 px tall).
   - A barber who isn't busy shows "Free". A barber on break shows "On break" in muted text.
3. **Right (≈ 35%):**
   - **Up next:** 5 tokens (at least 96 px) with first name and estimated time "~2:25 PM".
   - At the bottom, a **QR code** "Scan to join · skip the wait", plus the short URL as text.
4. **Footer line:** "Online queue open until 8:30 PM", or "Walk-ins only right now".

**When a token is called:**
- That barber's row turns accent-filled and **flashes 3 times** (about 3 s).
- A soft **chime** plays.
- A banner "**S-14 → Amit**" shows across the top for 5 s.
- Only the changed row animates.

**Empty / closed:**
- "No one waiting — walk right in!" with a large QR code.
- "We're closed · Opens 10:00 AM".

**Look:**
- A dark plum board (`tv-*` tokens) with orchid NOW tokens.
- The idle and empty states show the blob cluster.
- Uses viewport units so it scales to any 16:9 screen. No scrolling, ever.

---

## Screen 7: Owner Settings & Stats (`/admin`): Owner PIN
**Who / why:** the owner sets up the day and sees how it's going.

**Layout:** a segmented control **Today | Settings**. On desktop the two sections sit side by side.

**Top (always visible):** the **Queue switch** card, a big Open/Closed toggle with a status line: "Online joining is open until 8:30 PM" or "Online joining is closed — walk-ins only".

**Today**
- **Stat cards** (2×2 on phone, 6 across on desktop):
  - Served
  - Average wait
  - No-shows
  - Cancelled
  - Est. takings ₹
  - Average rating ★
- **Charts** (simple, using theme colours):
  1. Customers per hour (bars, from 10 AM to now)
  2. Served per barber (horizontal bars, with each barber's average rating beside the bar)
  3. Average wait by hour (line)
- Empty state: "No customers yet today. Stats appear after the first visit."

**Settings**
- **Salon:** name, opening time, closing time. A note shows the auto rule: "Online joining closes 30 min before closing."
- **Barbers:**
  - Each row has an avatar/colour, name and an **On duty today** switch.
  - [+ Add barber] (name + colour); tap a name to rename.
  - If the barber still has customers waiting for them, switching them off asks to move those customers to "Any barber" first (rules §6).
- **Services:**
  - Each row shows name, minutes, ₹ price, an **On/Off** switch, and ↑ ↓ to reorder.
  - Tap a row to edit it; [+ Add service] adds one.
  - Turning a service off hides it from Join immediately.
- **QR poster:** [Open printable poster] opens `/poster`.
- **PINs:** change the Staff PIN or Owner PIN (4 digits, typed twice).

---

## Screen 8: QR Poster (`/poster`): printable, Owner PIN
An A4 portrait page for the salon door or counter:
- salon name
- "Skip the wait — join the queue from your phone"
- a large QR code pointing to `/join`
- 3 short steps (Scan → Pick services → We'll call you)
- the URL as text

A [Print] button is hidden in print.

---

## Screen 9: Staff hub and PIN (`/staff`, PIN gate)
- **`/staff`:** four big tiles: **Reception**, **Barber**, **TV display**, **Owner**. This makes the demo and daily use easy.
- **PIN gate** (shown before Reception, Barber, Poster and Admin):
  - A card "Staff only" with 4 dots and a large numeric keypad (keys at least 64 px).
  - A wrong PIN shakes the card and shows "Wrong PIN".
  - After 5 wrong tries: "Try again in 30 s".
  - The Staff PIN opens Reception and Barber; the Owner PIN opens everything.
  - The device stays signed in until [Lock].

---

## Routes at a glance
| Route | Screen | Access | Main device |
|---|---|---|---|
| `/` | Home | Public | Phone |
| `/join` | Join Queue | Public | Phone |
| `/status/:id` | My Status | Private link | Phone |
| `/reception` | Reception Dashboard | Staff PIN | Tablet |
| `/barber`, `/barber/:name` | Barber View | Staff PIN | Phone |
| `/display` | Waiting-Area TV | Public | TV |
| `/admin` | Owner Settings & Stats | Owner PIN | Phone / laptop |
| `/poster` | QR Poster | Owner PIN | Print |
| `/staff` | Staff hub | Public (links go behind PIN) | Any |
