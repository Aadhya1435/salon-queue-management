# Salon Queue — Flows & Rules

How people move through the app, the queue rules in plain English, and the test checklist.
**When the code and this doc disagree, this doc wins.** If we change our minds, update this doc first, then the code.

---

## 1. Flows

### Flow A — Remote customer (joins from home)
1. Opens Home (from a link or the QR code) and sees "6 waiting · about 50 min". Taps **Join Queue**.
2. Enters name and phone, picks Haircut and keeps **Any barber (fastest)**. The summary shows "30 min · ₹150 · wait about 45 min". Taps **Confirm**.
3. Gets token **S-14** ("6th in line") and lands on **My Status**. The phone remembers the spot, so reopening the app goes straight back to it.
4. Waits at home. Place and wait update on their own.
5. At **2nd in line** a banner says "Start coming to the salon". At **1st** it says "You're next!".
6. Reception taps **Call next** on Amit's card (or Amit taps it on the barber screen). S-14 becomes **Called**.
7. Within 5 s the phone shows a full-screen **"It's your turn! Go to Amit"** and vibrates where supported. The TV flashes S-14 next to Amit and plays a chime.
8. Amit taps **Start** (status **In chair**), then **Done** (status **Done**).
9. The phone shows "Thanks for visiting!" and asks for a 1–5 star rating for Amit. One tap and the visit is finished.

### Flow B — Walk-in
1. A customer arrives without the app. Reception taps **+ Add walk-in**.
2. Enters name, phone, services and barber, using the same pickers as Join, then taps **Add**.
3. The customer gets the next token at the **end** of the same queue. Walk-ins and online customers share one first-come, first-served line.
4. Reception sees the token large, with a QR code: "Scan to follow your place". The customer can scan it to track their place on their own phone.

### Flow C — Barber's cycle
Free → **Call next** (barber or reception) → customer **Called** → customer sits → **Start** (**In chair**, timer runs) → **Done** → Free → Call next …
- A barber can switch **On break** only while nobody is Called or In chair for them, and switches back with **Available**.

### Flow D — No-show, then coming back later
1. S-14 is Called at 4:10 PM but doesn't arrive.
2. From 4:20 PM (10 min after the call), reception's **No-show** button becomes active. Tapping it sets S-14 to **No-show**, and Amit is free again.
3. S-14's phone shows "You missed your turn. Please speak to reception."
4. If they turn up later, reception opens **No-shows today** and taps **Re-add**. They get a **new token** (e.g. S-23) at the **end** of the queue, with the same services and barber choice.

### Flow E — Cancel
- **Customer:** on My Status, taps **Cancel my spot**, confirms in a pop-up, and the spot becomes **Cancelled**. They can join again, with a new token at the end.
- **Reception:** taps **Cancel** on a waiting row and confirms. The customer's phone shows "Your spot was cancelled by the salon."

### Flow F — Opening and closing
- The owner sets opening hours (e.g. 10:00 AM – 9:00 PM) and can switch the online queue **Open/Closed** at any time.
- Online joining closes **automatically 30 min before closing** (8:30 PM). Reception can still add walk-ins until closing.
- Customers already in the queue keep their spot when joining closes.

### Flow G — Owner's day
Morning: open /admin, tick the barbers on duty, check services, switch the queue **Open**. During the day: watch the stats. Evening: switch the queue **Closed**.

---

## 2. Statuses

| Status | Meaning | Customer's phone shows |
|---|---|---|
| **Waiting** | In the queue | Token, place in line, wait ring |
| **Called** | A barber is ready for them | Full-screen "It's your turn! Go to Amit" |
| **In chair** | Being served | "You're with Amit" and time so far |
| **Done** | Finished | "Thanks for visiting!" and rating |
| **Cancelled** | Removed before being called | "Your spot was cancelled" and [Join again] |
| **No-show** | Called but didn't come | "You missed your turn. Please speak to reception." |

**Allowed moves.** A status never goes backwards. Any other move is refused.

```
Waiting ──Call next──► Called ──Start──► In chair ──Done──► Done
   │                      │
   └──Cancel──► Cancelled └──No-show (≥ 10 min after Called)──► No-show
```

| Move | Who can do it |
|---|---|
| Waiting → Called | Reception (Call next on a barber card), or the barber (Call next on their screen) |
| Called → In chair | Barber (Start), or reception |
| In chair → Done | Barber (Done), or reception |
| Waiting → Cancelled | The customer (own spot only), or reception |
| Called → No-show | Reception only, and only 10 min or more after Called |

---

## 3. Who's next ("Call next" for barber X)
1. Allowed only if X is **on duty**, **Available** (not on break) and has **nobody Called or In chair**. Otherwise the button is disabled and says why.
2. It picks the **earliest-joined Waiting customer who chose X or "Any barber"**.
3. A customer who chose Ravi is **never** given to another barber, even if Ravi is on break and others are free.
4. If nobody is eligible, it shows "No one waiting for Amit" and nothing changes.
5. If two people tap Call next at the same moment, a customer can still only be called once. The database handles one call at a time.
6. A barber has at most **one** customer Called or In chair at a time.
7. **Queue order = time of joining.** A re-added no-show or a customer who rejoins after cancelling goes to the end.

---

## 4. Place in line and waiting time (the "play it forward" rule)

One calculation powers every number about waiting:
- Home's "about 50 min"
- Join's "Expected wait"
- My Status place and ring
- the barber picker's waits
- the TV's "Up next" times

It lives in **one function** (`src/lib/queue/`) and has unit tests.

**Step 1: when is each working barber free?** Only barbers who are on duty and Available count.
- Free now: **0 min**
- Has a customer Called but not started: that customer's **full service time** (they're about to sit)
- Has a customer In chair: **service time minus minutes since Start**, never less than 2 min, even when running late

**Step 2: play the waiting list forward, in queue order.** For each waiting customer, look at the barbers they accept: their chosen barber, or every working barber for "Any". Take the one who is **free soonest**; on a tie, take the one listed first. That customer's **wait** is that barber's free-in time. Then add the customer's service minutes to that barber's free-in time. This is the same rule Call next uses, run ahead of time.

**Step 3: place in line** = 1 + the number of waiting customers whose predicted start is earlier than yours (on a tie, queue order decides). So place and wait always agree.

> Sanity check: if everyone picks "Any barber", this works out to the guide's rule: **total minutes of services ahead ÷ barbers working**.

**Worked example.** At 2:00 PM, Ravi has a customer in the chair with 10 min left, Amit is free, and Imran is on break.

| Token | Wants | Service | Barber free-in times before this customer | Goes to | Wait | Place |
|---|---|---|---|---|---|---|
| S-11 | Any | Haircut 30 | Ravi 10 · Amit 0 | Amit | 0 min → "Any moment now" | 1st |
| S-12 | Ravi | Beard trim 15 | Ravi 10 | Ravi | 10 min | 2nd |
| S-13 | Any | Haircut + Beard 45 | Ravi 25 · Amit 30 | Ravi | 25 min | 3rd |
| S-14 | Any | Haircut 30 | Ravi 70 · Amit 30 | Amit | 30 min | 4th |
| S-15 | Imran | Shave 20 | Imran on break | — | "Imran is on break" | 1st for Imran |

**How the wait is shown**
- 0 min and 1st in line: "Any moment now"
- 1–4 min: "under 5 min"
- Otherwise: "about N min", with N rounded **up** to the next 5
- Never "0 min" while someone is ahead of you
- Recalculated on every change **and every 30 seconds**, so it counts down by itself
- The TV's "Up next" shows a clock time (now + wait), e.g. "~2:25 PM"

**Banners on My Status**
- Place 2: "Start coming to the salon"
- Place 1: "You're next! Please be at the salon"
- Called: full-screen "It's your turn! Go to Amit"
- Chosen barber on break: "Ravi is on break. Your wait will update when Ravi is back." There's no countdown and no "Start coming" banner in this case.
- If the customer chose a barber who is on break, their place is counted only among customers waiting for that barber.

**Numbers on Home and Join**
- Home: "**6** waiting · about **50** min" = the number of people Waiting, plus the wait a new "Any barber" customer joining now would get.
- Join "Expected wait": the wait if you joined right now with the barber you've picked. It updates as you change the barber.
- Each card in the barber picker shows the expected wait if you pick that barber.

---

## 5. Joining rules
- **Name:** 2–30 characters. **Phone:** 10 digits starting with 6–9 (Indian mobile), shown as `98765 43210`.
- **Services:** at least 1, at most 3. Only services the owner has switched On appear.
- **Barber:** "Any barber (fastest)" (the default) or one barber on duty today. A barber on break can still be chosen but shows "On break".
- **One active spot per phone.** If this phone already has a Waiting, Called or In-chair spot today, no new spot is created. The app shows "You're already in the queue as S-14" with [View my spot]. The same check applies to walk-ins at reception.
- **Online joining is open only when** the owner's switch is Open, AND the time is between opening and 30 min before closing, AND at least one barber is on duty. Otherwise the Join button is disabled and shows the reason:
  - "Online queue is closed right now. Walk-ins welcome until 9:00 PM."
  - "We open at 10:00 AM."
  - "No barbers available right now."
- **Walk-ins** can be added any time before closing, even when online joining is closed.
- **Tokens** are S-1, S-2 … and restart at S-1 every morning. Walk-ins use the same series. A token is never reused within a day.
- **Today only.** Only today's customers (India time) appear anywhere.

## 6. Breaks and duty
- **On break** is allowed only when the barber has nobody Called or In chair. While on break:
  - Call next is disabled on that barber's card.
  - Customers who chose that barber see "Ravi is on break".
  - "Any barber" customers go to the others.
  - The TV shows "On break".
- The owner **can't take a barber off duty** while customers are waiting specifically for that barber. The app asks: "Imran still has 2 customers waiting. Move them to 'Any barber'?" Tapping [Move & turn off] moves them and keeps their places.
- Barbers who are off duty don't appear in Join, the Home chips or the TV.

## 7. No-show and cancel
- The No-show button becomes active 10 min after Called. Before that it shows a countdown, "No-show in 6:12".
- Re-add creates a **new spot with a new token at the end**. The old spot stays No-show so the stats count it.
- A customer can cancel only while **Waiting**, with a confirmation pop-up. Once they're Called, only reception can act.

## 8. Rating
- Shown once on My Status after Done: "How was your visit with Amit?", with 1–5 stars and [Skip].
- One rating per visit, and it can't be changed. It is stored with the visit so the owner sees an average per barber.

## 9. Staff access and privacy
- /reception, /barber/…, and /admin ask for a **4-digit PIN** once per device.
  - The **Staff PIN** opens the reception and barber screens.
  - The **Owner PIN** opens everything.
  - **[Lock]** signs the device out.
  - After 5 wrong PINs, the device must wait 30 s.
- Customers never log in. Their status page uses a private random link, not the token number.
- Public screens (Home, TV, My Status) show **token + first name only**. Phone numbers appear only on staff screens.
- The browser never edits the database directly. Every change goes through a server function that checks the rules (and the PIN for staff actions).

## 10. Today's stats (owner)
"Today" means since midnight, India time.
- **Served:** visits marked Done today
- **Average wait:** the average of (Called time − Joined time) for customers called today
- **No-shows, Cancelled:** counts for today
- **Est. takings:** the sum of service prices for Done visits (the app takes no payments)
- **Average rating:** overall, and per barber
- **Charts:** customers joined per hour, customers served per barber, and average wait by hour

## 11. Sync and connection
- Every screen updates within **5 seconds** of any change, without a refresh.
- If the connection drops:
  - A banner shows "Offline — reconnecting…".
  - Buttons that change data are disabled.
  - Everything reloads on reconnect.
- **TV sound:** browsers block sound until someone taps the page, so the TV opens on a "Tap to start display" screen.

---

## 12. Test checklist
Run on the live site with three windows: phone (390 px), tablet (1024×768) and TV (1920×1080).

**Join and status**
- [ ] 1. Join with 2 services → correct total time and price (Haircut + Beard trim = 45 min · ₹230)
- [ ] 2. Tap a 4th service → blocked, with "Up to 3 services"
- [ ] 3. Phone with 9 digits, or starting with 1–5 → error, can't confirm
- [ ] 4. Same phone joins twice → shown the existing spot, no duplicate
- [ ] 5. Close and reopen the app → goes straight back to My Status
- [ ] 6. 2nd in line → "Start coming" banner; 1st → "You're next!"
- [ ] 7. Call next → the customer's phone shows "It's your turn! Go to Amit" within 5 s, and the TV flashes the token
- [ ] 8. Cancel my spot → confirm → the spot disappears from reception and the TV

**Queue rules**
- [ ] 9. Call next for Amit skips a customer who chose Ravi
- [ ] 10. Ravi on break → Ravi's card can't Call next, Ravi's customers see "Ravi is on break", and "Any" customers go to others
- [ ] 11. Call next is disabled while that barber has someone Called or In chair
- [ ] 12. No-show is disabled before 10 min; after that, No-show then Re-add → new token at the end
- [ ] 13. A walk-in added after online customers goes to the end, not the top
- [ ] 14. Set up the worked example in §4 → the waits match exactly; the wait goes down as customers finish and never shows 0 min with people ahead
- [ ] 15. Waits over 60 min are highlighted amber on reception

**Owner**
- [ ] 16. Turn a service off → it disappears from Join
- [ ] 17. Close the online queue → Join is disabled with a message, and reception can still add walk-ins
- [ ] 18. Set closing time to 25 min from now → online joining closes automatically
- [ ] 19. Serve 2, no-show 1 → stats show served 2, no-shows 1, and takings = the sum of their prices
- [ ] 20. Rate a visit 4 stars → the owner sees that barber's average update
- [ ] 21. Try to take a barber off duty while customers chose them → the app asks to move them to "Any barber" first

**Staff, sync and deploy**
- [ ] 22. /reception without a PIN → PIN screen; wrong PIN refused; Staff PIN can't open /admin
- [ ] 23. Start/Done on Barber View updates Reception and the TV within 5 s
- [ ] 24. Phone, tablet and TV windows stay in sync with no refresh
- [ ] 25. Scan the TV's QR code with a real phone → opens Join
- [ ] 26. Refresh a deep link on the live site (e.g. /status/…, /reception) → no 404
- [ ] 27. Every screen works at 360 px wide with tap targets ≥ 44 px; the app installs via "Add to Home Screen"
