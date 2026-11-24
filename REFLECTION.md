# Reflection

**What the agent got wrong.** I asked the agent to "update the application name to Roselle" (prompt 17). It renamed the app everywhere in the code: page titles, the PWA manifest, storage keys and the realtime channel. The build passed and it reported the job done. But when I opened the app, the Home screen still said **"Kesh Studio"**.

**How I noticed.** I checked the running app instead of trusting the summary. Nothing had failed: the build and tests passed, because the code was correct. The mistake only showed on screen.

**Why it happened.** My prompt and my own docs led it there. In the code, the "application name" is the product's name. Customers, though, see the *salon's* name, which is stored in the database. And `docs/01-brief.md` still listed "Kesh Studio" as the demo salon. Our rules make the docs the source of truth, so the agent did exactly what my prompt and my brief said.

**How I fixed my prompt and docs.**
- I asked, "Why does it still say 'Kesh Studio' instead of 'Roselle'?" (prompt 19). The agent explained the two names, renamed the salon in the database, removed a hard-coded name from the loading screen, and updated the brief.
- After that I named every place a change had to reach. For the women's-salon change I asked it to "rename barbers to stylists with female names" and "remove the old names everywhere" (prompt 27).
- Then I ran a QA audit to find anything still left behind (prompt 30). It found an "Add barber" button and docs that still described Ravi and Amit. So I had every doc changed to say stylist first, and only then the app (prompt 32).

**What I learned.** For an AI agent, the docs are the specification. An out-of-date doc is a bug, because the agent will faithfully rebuild the old version. A passing build only proves the code compiles; you have to look at the real app.
