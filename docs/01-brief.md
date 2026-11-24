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
| Barber | Own phone | See current and next customer, Start / Done, go on break |
| Owner | Phone or laptop | Services, barbers on duty, open/close the queue, today's stats |
| Waiting area | TV (1080p, landscape) | Now serving, up next, QR code to join |

## Must-have features
1. **Join from your phone.** Name, phone, 1–3 services, a barber or "Any barber (fastest)". You get a token like **S-14**. You can also scan the QR code in the salon.
2. **Live status.** Token, place in line, an estimated wait that counts down, "Start coming" at 2nd in line, and a full-screen "It's your turn! Go to Ravi".
3. **Reception dashboard.** Barber cards with Call next, the waiting list in order, + Add walk-in, No-show, Cancel. Waits over 60 min are highlighted.
4. **Barber screen.** Current customer with a timer, a big Start → Done button, "Next for you", and On break / Available.
5. **Waiting-area TV.** Each barber's current token, the next 5 tokens with estimated times, a flash and chime when a token is called, and a "Scan to join" QR code.
6. **Owner settings.** Services (name, minutes, price, on/off), barbers on duty today, queue Open/Closed, opening hours, and a printable QR poster.
7. **Today's stats and charts.** Served, average wait, no-shows, estimated takings and average rating. Charts show customers per hour, customers served per barber, and average wait through the day.
8. **Rate your visit.** After Done, the customer taps 1–5 stars for their barber.

## Quality bar
- Mobile-first, installable **PWA** ("Add to Home Screen"). It also works in tablet, desktop and TV browsers.
- All screens stay in sync within 5 seconds with no refresh.
- Staff screens (reception, barber, owner) sit behind a 4-digit PIN. Customers never create an account.
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
- **Salon:** Roselle · open 10:00 AM – 9:00 PM · online joining closes 8:30 PM
  - The hosted demo starts with hours of 12:00 AM – 11:59 PM, so the TA can test it at any time.
  - To show the closing rules, switch to 10:00 AM – 9:00 PM in Owner settings.
- **Barbers:** Ravi, Amit, Imran
- **Services:** Haircut 30 min ₹150 · Beard trim 15 min ₹80 · Shave 20 min ₹100 · Kids cut 20 min ₹120 · Head massage 15 min ₹120 · Hair spa 45 min ₹400 · Facial 40 min ₹350 · Hair colour 60 min ₹600
- **Test PINs:** Staff **1234** (reception and barbers) · Owner **9999** (everything)
