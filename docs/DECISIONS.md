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

## Android app and the opening breath

- **Both a web link and an Android app.** The web link stays the main way in (every phone, updates by itself). The Android app (an APK on GitHub Releases) is for people who prefer a download.
- **Capacitor**, free and open source, wraps the same built app. Nothing extra is collected.
- **Built by GitHub**, never on someone's own computer: tests first, then a test copy on every push, and a signed copy for every version tag.
- **Signing key in GitHub secrets only**, never in the code. The same key must sign every version.
- **Google Drive backup switched off** for the app, because the promise is that numbers never leave the device.
- **Not yet:** Google Play ($25 once) and the App Store ($99 a year). iPhones use the web link.
- **The opening breath:** one slow breath of about two seconds (lengthened from under a second, so the breath can actually be seen and felt), the same on the web and in the app. It respects "reduce motion", follows light and dark, plays only on a fresh start, and uses the placeholder circle (no logo) until branding is agreed.

Founding promise check: free, nothing collected, no pressure, and the opening is short and skipped for anyone who asks for less motion. Result: **in line with the promise.**

## The opening becomes "a deep breath" (branding idea 4d)

- **Chosen from the branding sketches:** the word "breathe" itself takes a deep breath (light, then full and slightly lifted, then settled), with a soft shadow like a chest rising and falling. About three seconds. It replaces the breathing circle on the web and in the Android app.
- **Font:** Nunito, a soft rounded font, free under the SIL Open Font Licence. It is bundled inside the app (`public/fonts/`), never loaded from Google, so it works offline and nothing is sent anywhere. For now it is used for the opening only; the rest of the app keeps the device's own font.
- **Still for people who ask for less motion**, and plays only on a fresh start.
- **Logo and icon are still open.** This settles the opening animation and the wordmark's feeling, not the icon.

Founding promise check: free font, nothing fetched, nothing collected, and it respects "reduce motion". Result: **in line with the promise.**

## Android app: an optional check for updates

- **Why:** an APK installed from a file never updates itself, and nobody hears about new versions.
- **What:** Settings → Updates (Android app only). **Off by default.** "Check now", or "check once a day when I open the app". When a newer version is out, a calm note on the home screen and in Settings links to the release page.
- **Honest about it:** this is the only time the app contacts anything. It asks GitHub's public releases address one question. It sends no numbers, account or cookies, and no referrer; GitHub can see the request came from a phone's internet address. The app says this in Settings.
- **Careful with the answer:** only a version number in the expected form is accepted, drafts and test versions are ignored, and the link the app opens is built by the app.
- **The web version doesn't need it:** it already updates itself.

Founding promise check: optional, off by default, nothing about the person sent, plainly explained. Result: **in line with the promise.**

## November 2026: changes after Stage 10 (v0.13.0 to v0.17.0)

Each of these was asked for by the person who uses Breathe Money every day, and shown as pictures first.

- **Money coming in, not payday (v0.13.0).** Not everyone has a payday. The first question is now when your main money next comes in (wages, Universal Credit, a pension or PIP). The sums are unchanged; saved numbers carry over.
- **Savings (v0.13.0).** The "rainy-day pot" is now called Savings. A switch can hide its badge (v0.14.1); the savings are still kept aside.
- **A tidier menu (v0.13.0).** Setup, App options, data, share, report and About sit in one Settings folder.
- **Download and install (v0.14.0).** The Android app can download a new version and hand it to Android's installer. Only Breathe Money's own GitHub release files can be downloaded; the file must be Breathe Money; Android refuses any update not signed with the same key. This replaces "a link to the release page" above. Uses the REQUEST_INSTALL_PACKAGES permission for this alone; it would be removed for the Play Store.
- **The app icon, "Breathing out", and eight more colours (v0.15.0).** Every colour is tested to stay easy to read in light and dark.
- **Sounds and vibration when you tap (v0.16.0).** Twelve sounds made inside the app (nothing downloaded) and three vibration strengths. Both off by default. Uses the VIBRATE permission for this alone.
- **Coming up (v0.17.0).** Bills and money day from today, as a list first or a month. Money that might come is left off, by choice.
- **Calmer Settings (after v0.17.1).** App options is now a short list of seven groups, each on its own small page, showing the current choice. The Settings folder went from six items to four: Share, Report a problem and About sit in Help and sharing.
- **A safety check (after v0.17.0).** Nothing serious found. Fixed: PIN pauses now survive reopening the app, and the downloaded update file is tidied away.

Founding promise check: everything is optional or off by default where it does something new, nothing about the person is sent, and every new permission is used for one thing and explained. Result: **in line with the promise.**
- **All money is money coming in (v0.28.0).** People asked why Universal Credit had to be "the main" one. Now everyone just lists all their money, and the number plans until the biggest regular payment by itself (changeable under *Plan until*). Simpler for people with several payments, and just as cautious.
