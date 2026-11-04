# Stage 8: secure backups

Backup files can now be protected with a passphrase. Without it, nobody can read what's in the file.

## What is new

- **Menu → Your data and backups → Save a backup file** now offers two kinds:
  - **Protected with a passphrase (recommended).** Choose a passphrase (at least 10 characters), type it twice, and save. The file is encrypted.
  - **Plain backup (not protected).** The Stage 4 file, still clearly marked as not encrypted.
- **Use a backup file** works with both. A protected file asks for its passphrase first, then shows what's inside before anything changes, exactly as before.
- Protected files are named `breathe-money-backup-YYYY-MM-DD-protected.breathe-backup.json`, so they're easy to tell apart.

The app says plainly, every time: *"If you forget this passphrase, nobody, including us, can open this backup."*

## How it works (for contributors)

All in `apps/money/src/storage/encryptedBackup.ts`, following `STORAGE-AND-BACKUPS.md`:

- The browser's own **Web Crypto**. No extra library.
- **AES-256-GCM**, which also detects any change to the file.
- Key from the passphrase with **PBKDF2-SHA-256, 600,000 rounds** (the current OWASP figure), and a **fresh random salt** (16 bytes) for every backup.
- A **fresh random IV** (12 bytes) for every backup.
- The file records its format, salt, IV and settings. Those settings are also bound into the encryption as "additional data", so changing any of them stops the file opening.
- Reading refuses rounds below 100,000 (a doctored file can't quietly weaken itself) or above 10,000,000 (it can't freeze the app).
- Once opened, the contents are an ordinary backup and go through the same careful checks as a plain one.
- The passphrase is never stored or sent anywhere. It only lives in the box while you type.

Protected backups need a secure web address (`https://`, or `localhost` on your own computer). The published GitHub Pages copy is fine. If you use `npm run dev:phone` over your home network, protected backups won't be available there, and the app says so.

## Not done yet, on purpose

- **An independent security review.** `STORAGE-AND-BACKUPS.md` promises that someone with security experience will review the design before we rely on it. That hasn't happened yet. Please ask for it (for example, in a GitHub issue asking for review).

## Things to try

1. Add a few fictional numbers.
2. Save a protected backup. Try a short passphrase first and see the kind note.
3. Open the file in a text editor: none of your numbers are readable.
4. **Clear my numbers**, then **Use a backup file**. Try a wrong passphrase, then the right one, then **Replace my numbers**.

## Tests

`tests/encryptedBackup.test.ts`: round trip; the real strength is used by default; nothing readable in the file; fresh salt and IV each time; wrong passphrases (including different capital letters) refused; any change to the file refused; weak or absurd settings refused; newer formats recognised; protected and plain files told apart; accents and emoji in passphrases.
