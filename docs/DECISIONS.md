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
| G | App lock: "privacy screen" only, or optional device encryption too? | Stage 9 | **Decided (Stage 9): privacy screen only**, described honestly. Encryption on the device stays a possible later, opt-in extra |

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

## Stage 7c: built-in bank holidays

- **Source:** the official GOV.UK list, copied into the app as a plain list of dates. The app never fetches anything, so it works offline and nothing leaves the device.
- **Three regions** (England and Wales, Scotland, Northern Ireland), plus "I'll type my own". Extra typed days are always added on top.
- **The list has an end.** When it runs out the app says so instead of guessing. Someone refreshes it about once a year (`docs/UPDATING-BANK-HOLIDAYS.md`).
- **Only dates are stored**, from 2024 onwards, to keep it small and simple.
- Saved numbers moved to format 3; formats 1 and 2 are still read.

Founding promise check: nothing collected, nothing costs money, no pressure added. Result: **in line with the promise.**

## Stage 10: installable, offline and published free

- **Hosting:** GitHub Pages, which is free and needs no account beyond the one the project already has. A short "publish recipe" (`.github/workflows/deploy.yml`) builds and publishes every time something is pushed to `main`, and **only after the tests pass**.
- **Relative addresses:** the app works at any web address, so it does not depend on the repository's name or a custom domain.
- **Offline helper kept simple and hand-written (`public/sw.js`):** no extra packages. It keeps only the app's own files, never contacts other sites, and never touches your numbers. Tests check this.
- **Numbers belong to a web address.** Numbers typed on your own computer's test copy are not on the published copy. The existing backup and restore moves them across.
- **Placeholder icon:** a plain teal square with a soft circle, until branding is agreed. It is one set of files to swap.
- **Not done on purpose:** notifications, accounts, analytics.

Founding promise check: free to publish, free to use, nothing collected, no pressure added. Result: **in line with the promise.**


## Stage 8: secure backups

- **Passphrase-protected backups are the recommended kind**, shown first. Plain backups stay available, clearly marked, because some people need a file they can read.
- **Web Crypto only:** AES-256-GCM, with PBKDF2-SHA-256 at 600,000 rounds, a fresh salt and a fresh IV every time. The settings are written in the file and bound into the encryption.
- **At least 10 characters** for a passphrase, with a gentle suggestion to use a short sentence, rather than rules about symbols.
- **No recovery, on purpose.** Forget the passphrase and nobody can open the file. The app says so every time.
- **Still to do:** an independent security review of the design (promised in `STORAGE-AND-BACKUPS.md`).

Founding promise check: nothing collected, nothing sent, nothing costs money, no pressure added. Result: **in line with the promise.**

## Stage 9: privacy and accessibility

- **Question G decided:** the app lock is a **privacy screen only**, described honestly as such. Encrypting the numbers on the device stays a possible later, opt-in extra.
- **PIN, not password:** 4 to 12 numbers, quick on a phone. Only a salted PBKDF2 fingerprint is kept.
- **Forgotten PIN clears the numbers**, so the lock still means something, and backup files are the way back.
- **Locks again after a minute in the background**, so a phone left on a table is covered.
- **Text size and contrast are Settings, not separate modes.** They add to the device's own settings rather than replacing them, and "Match my device" follows the device's own contrast request.

Founding promise check: all optional, nothing collected, nothing costs money, no pressure added. Result: **in line with the promise.**
