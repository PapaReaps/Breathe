# Roadmap

Each stage is small, ends with something you can run or read, and **waits for your approval** before the next begins.

The big change from the first plan: **you can try a working (plain-looking) calculator at the end of Stage 3**, and the look and feel comes afterwards.

| Stage | Name | What you get | You can test it by |
|---|---|---|---|
| **0** | Foundations | Promises, plans, design notes, folder structure, GitHub set-up | Reading the docs; pushing to GitHub |
| **1** | Hello Breathe | A tiny app that opens in your browser, and a working test command | `npm run dev` and `npm test` |
| **2** | The calculator | Safe-to-spend logic with the full test suite (see `CALCULATION-DESIGN.md`) | `npm test` (all green) |
| **3** | First working version | A very simple main screen (just your safe-to-spend number) with a Menu for your numbers, and a breakdown | Using it on your computer and phone |
| **4** | Remember my numbers | Saves on your device. A "Your data and backups" page: simple backup file (clearly marked not encrypted), restore, and "Clear my numbers" (pulled forward from Stage 9) | Closing and reopening the app |
| **5** | Friendly setup | One question per screen, every one skippable, plain wording, saved as you go | Clearing your numbers, then setting up from scratch |
| **6** | Home screen | Calm look for the simple home screen: soft colours, large readable text, automatic dark mode. Kept to the number and a Menu button, as you asked (no logo) | Daily use, in light and dark mode |
| **7** | Everyday use | Update balance, edit bills, payday rolling over, out-of-date warnings | A week of real use |
| **8** | Secure backups | Optional passphrase-encrypted backup and restore (see `STORAGE-AND-BACKUPS.md`) | Back up, wipe, restore |
| **9** | Privacy and accessibility | Optional app lock, screen reader, text size, contrast, keyboard checks | Accessibility checklist |
| **10** | Installable and shareable | Works offline, installs like an app, published free | Installing it on your phone |

## Running alongside the stages: branding

Branding is explored **separately**, in its own conversations, not hidden inside a coding stage. Until it is agreed, the app uses plain neutral styling and **no logo**. See `docs/BRANDING.md`.

## Founding promise check

At the end of each stage we ask: did anything in this stage move away from "always about helping people"? The answer is noted in `docs/DECISIONS.md`.

## Later

Breathe Medication, Breathe Travel, Breathe Daily, and an optional Breathe Home dashboard. Each is a separate project, started only after Breathe Money is in good shape.
