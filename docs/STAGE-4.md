# Stage 4: Remember my numbers

## What changed, in plain English

- Your numbers are now **saved on your device automatically**, a split second after you type. Close the page, come back tomorrow, and they are still there.
- A new menu page, **Your data and backups**, explains honestly where the numbers live and what the limits are.
- You can **save a backup file**, **use a backup file** to restore (you see what is in it first), and **clear your numbers** (asks twice).
- If the browser can't save (for example some private windows), the app still works and says so gently.

## Where the numbers are kept

In the browser's built-in database (IndexedDB), database `breathe-money`, one record. Nothing is sent anywhere: the app makes no network requests apart from loading itself. `localStorage`, `sessionStorage` and cookies are not used (checked in the browser test).

## The honest limits (also shown in the app)

1. **Not encrypted.** Anyone who can open that browser on that device could see the numbers.
2. **The browser can remove them** (clearing browsing data, low space). After the first save the app politely asks the browser to keep them (`navigator.storage.persist()`), and the data page shows the answer.
3. **Backup files are not encrypted either.** The page says so right beside the button, and the file says `"encrypted": false` inside. Passphrase-encrypted backups are Stage 8.
4. A change typed in the last tenth of a second before the tab is closed may not be saved. Saving starts 0.1s after the last keystroke, and also when the page is hidden or closed.

## One safety fix saving needed

The date a balance is from is saved too, and typing a balance sets it to **today**. Without this, a balance saved last week would look "fresh" when reopened. Checked in the browser test: six days later the home screen says the balance is from 6 days ago.

## Treat saved data and backup files as untrusted

Anything read back from the device or from a file is rebuilt field by field. Anything unexpected is refused, not guessed at: wrong types, over-long text, unknown payday rule, bad ids, duplicate ids, more than 100 rows, files over 1,000,000 characters, a newer file format. Extra fields are ignored. Failing files leave your current numbers untouched.

Saved data that can't be read: the app starts fresh with a gentle note, and does **not** overwrite the old copy until you change something.

## Tests

- `tests/savedData.test.ts`: round trip, only-known-fields, refusals, unique ids, balance date rule, backup make/parse, tampering.
- Browser test (not part of `npm test`; run by hand over http://localhost): survives reload; nothing in other storage; change before closing kept; stale balance stays stale; backup name and contents; not-encrypted notice; clear (two steps); restore with bad, foreign and good files; unreadable saved data; storage unavailable; only requests to localhost.

## Founding-promise check

Did anything move away from "always about helping people"? No. No accounts, tracking or money motive added. The new page tells people the limits plainly instead of hiding them, and "Clear my numbers" was pulled forward from Stage 9 so people stay in control of their own data.

## Not done yet (on purpose)

Encrypted backups (Stage 8), app lock (Stage 9), friendly one-question setup (Stage 5).
