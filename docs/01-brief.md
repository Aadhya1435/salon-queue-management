# Roselle — Project Brief & Scope

> One page: the *why* and the boundaries. If a feature isn't under **Must-have**, don't build it. If it's under **Don't build**, never build it.

## Problem
On weekends customers sit in the salon for 1–2 hours without knowing when their turn will come. Some give up and leave; others argue about who came first. The receptionist keeps the order on paper or in their head, so mistakes happen.

## Goal
One live, shared queue. Customers join from their phone and wait wherever they like; staff run the queue from a tablet and their phones; a TV in the waiting area shows who's next. Every screen agrees within 5 seconds.

## Users
| User | Device | Main job |
|---|---|---|
| Customer | Own phone (browser or installed app) | Join, watch place and wait, get called, rate the visit |
| Receptionist | 10" tablet, landscape | Add walk-ins, call next, mark no-show / cancel |
| Stylist | Own phone | See current and next customer, Start / Done, go on break |
| Owner | Phone or laptop | Services, stylists on duty, open/close the queue, today's stats |
| Waiting area | TV (1080p, landscape) | Now serving, up next, QR code to join |

## Must-have features
1. **Join from your phone.** Name, phone, 1–3 services, a stylist or "Any stylist". You get a token like **S-14**. You can also scan the QR code in the salon.
2. **Live status.** Token, place in line, an estimated wait that counts down, "Start coming" at 2nd in line, and a full-screen "It's your turn! Go to Neha".
3. **Reception dashboard.** Stylist cards with Call next, the waiting list in order, + Add walk-in, No-show, Cancel. Waits over 60 min are highlighted.
4. **Stylist screen.** Current customer with a timer, a big Start → Done button, "Next for you", and On break / Available.
5. **Waiting-area TV.** Each stylist's current token, the next 5 tokens with estimated times, a flash and chime when a token is called, and a "Scan to join" QR code.
6. **Owner settings.** Services (name, minutes, price, on/off), stylists on duty today, queue Open/Closed, opening hours, and a printable QR poster.
7. **Today's stats and charts.** Served, average wait, no-shows, estimated takings and average rating. Charts show customers per hour, customers served per stylist, and average wait through the day.
8. **Rate your visit.** After Done, the customer taps 1–5 stars for their stylist.

## Quality bar
- Mobile-first, installable **PWA** ("Add to Home Screen"). It also works in tablet, desktop and TV browsers.
- All screens stay in sync within 5 seconds with no refresh.
- Staff screens (reception, stylist, owner) sit behind a 4-digit PIN. Customers never create an account.
- Tap targets are at least 44 px. Text is readable in a bright salon, and the TV is readable from 5 m.
- Free hosting only. The live link opens on any phone with no setup.

## Don't build
- Online payment, bills or invoices
- Appointments for a future date, or time-slot booking (today's queue only)
- SMS, WhatsApp, email or push notifications
- Loyalty points, coupons, memberships or referrals
- Multiple branches or multiple salons
- Customer accounts, passwords or social login
- Languages other than English
- App-store (native) apps; the PWA install is enough
- Staff payroll, commissions, inventory or product sales
- Chat between customer and salon, or written reviews (stars only)

## Look & feel
Friendly and modern ("Plum & Orchid"), mobile-first:
- soft lilac background with white rounded cards
- deep aubergine pill buttons and an orchid highlight
- playful blob shapes
- a dark plum board on the TV

Details are in [02-screens.md → Design system](02-screens.md).

## Demo data
- **Salon:** Roselle · open 10:00 AM – 11:00 PM (India time) · online joining closes 10:30 PM
  - The hosted demo uses these same hours. Online joining works 10:00 AM – 10:30 PM IST; reception can add walk-ins until 11:00 PM.
- **Stylists:** Neha, Ayesha, Simran. Roselle is a salon for women, so the app says "stylist" where the guide says "barber". The database and code keep the word `barber` (e.g. `barbers` table, `/barber/:name` still works next to `/stylist/:name`).
- **Services (a salon for women):** Haircut & blow-dry 45 min ₹600 · Blow-dry & styling 30 min ₹400 · Hair spa 45 min ₹900 · Global hair colour 90 min ₹2,500 · Highlights 120 min ₹3,500 · Facial 60 min ₹1,200 · Eyebrow threading 10 min ₹60 · Waxing (full arms) 20 min ₹400 · Manicure 30 min ₹500 · Pedicure 40 min ₹700
- **Test PINs:** Staff **1234** (reception and stylists) · Owner **9999** (everything)
  - On the hosted demo, changing a PIN is turned off so the published PINs always work.
