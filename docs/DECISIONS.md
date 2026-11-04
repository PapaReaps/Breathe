# Decisions

A short record of what was decided and why, plus what is still open. Every entry notes how it fits the founding promise.

## Decided

| # | Decision | Why | Founding promise |
|---|---|---|---|
| 1 | Build as a Progressive Web App (React, TypeScript, Vite) | One free codebase for Windows, Android and iPhone, no app store fees | Free for everyone, no barriers |
| 2 | Data kept on the device only; no accounts | Privacy, and nothing to sell or lose | Never about money, always about helping |
| 3 | Money stored as whole pennies | Prevents rounding errors | Accuracy reduces worry |
| 4 | Calculation rules written before code (`CALCULATION-DESIGN.md`) | Prevents double-counting; easy to test | Trustworthy numbers reduce stress |
| 5 | Storage limits explained honestly; backups optional and encrypted (`STORAGE-AND-BACKUPS.md`) | No false sense of security | Honesty and safety |
| 6 | Logo and branding deferred and explored separately | Must suit every future app | Brand serves people, not the other way round |
| 7 | Stages kept small; first usable version at Stage 3 | Earlier feedback, less wasted work | Helping people sooner |

## Open: needed before the stage shown

| # | Question | Needed by | My suggestion |
|---|---|---|---|
| A | **Which open-source licence?** | Before sharing publicly | **Decided (4 November 2026): GNU GPL version 3 or later.** Anyone may use and change Breathe for free; anyone who shares a changed version must share their changes under the same licence |
| B | Bills due **on** payday: subtract them? | Stage 2 | Yes, subtract (cautious) |
| C | Weekend payday: which default option? | Stage 2 | No default; ask in setup, because it depends on the employer |
| D | After how many days is a balance "out of date"? | Stage 2 | 3 days, and changeable |
| E | How do we get bank holiday dates without a download? | Stage 2 | Ship a small built-in list of England/Wales dates, updated each year, with a manual override |
| F | Where do we publish? GitHub Pages shares one storage area per account | Stage 10 | A dedicated repository and address; check storage separation first |
| G | App lock: "privacy screen" only, or optional device encryption too? | Stage 9 | Privacy screen first; encryption as a later, opt-in extra |

## Founding promise check: Stage 1

Stage 1 adds one runtime dependency pair (React) and development-only tools (Vite, TypeScript, Vitest). Development tools are not shipped inside the finished app. The page loads nothing from other companies and collects nothing. Result: **in line with the promise.**

## Founding promise check: Stage 0

Nothing in Stage 0 collects data, costs money, or adds pressure. Result: **in line with the promise.**

## Licence decision

**Chosen: GPL-3.0-or-later.** The full text is in `LICENSE` at the top of the project.

Why: it keeps Breathe free for everyone and stops anyone taking it, closing it off and selling it, which fits the founding promise ("never about making money").

One thing to know: the plain GPL covers people who *share* a copy of the code or app. It does not cover someone who only runs a changed version on their own website for others to use. The AGPL (a close cousin) does cover that. If this ever matters, the licence can be moved to AGPL-3.0-or-later, because GPLv3 allows combining with AGPLv3. For now: GPL, as chosen.

Not legal advice.

## Stage 7: things that repeat

- **The calculation was left alone.** Repeating is worked out in the form layer, which hands the calculation ordinary dated bills and income. Every earlier rule and test still applies unchanged.
- **Four weeks is 28 days**, not a month. They are separate choices because people really are paid both ways.
- **A monthly payday always asks the weekend question** the first time, rather than surprising the person later in a month that happens to land on a weekend.
- **The number stays cautious after a payday.** The app does not add the new pay to an old balance. It says so, and asks for the balance.
- **Saved numbers keep working.** The save format moved from 1 to 2. Version 2 of the app reads both. An older copy of the app refuses a newer file instead of guessing.
- **The reminder is the person's choice** (every day, every 3 days, once a week, or never), because what feels like a helpful nudge to one person is pressure to another.

Founding promise check: nothing in Stage 7 collects anything, costs anything or adds pressure. The reminder can be switched off. Result: **in line with the promise.**

