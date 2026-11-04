# Storage and backups

Written in plain English. The privacy we promise must be **honest**, so this document spells out what browser storage can and cannot do.

## Where Breathe will keep your information

Inside your web browser, in a storage area called **IndexedDB**. It is attached to the website address (the "origin") the app is running from. There is no Breathe server, so nothing is sent anywhere.

## The limitations (please read)

**1. It is NOT automatically encrypted.**
Browser storage is saved as ordinary files in your browser's profile folder on your device. Anyone who can open your computer or phone while you are logged in, or who can read your user files, could find and read it with the right tools. Breathe does not change that by default.

**2. What does protect you, and what does not.**
- *Helps:* a password or PIN on your device, and full-disk encryption (on Windows, BitLocker or Device Encryption where available).
- *Does not help:* an app lock inside Breathe, on its own. A PIN screen stops casual snooping, but if the stored data is not encrypted it does not stop a determined person. We will describe it honestly as a "privacy screen", not as encryption.

**3. Other software on the same device.**
Malware, or a browser extension with broad permissions, may be able to read browser storage. Install extensions sparingly.

**4. Any script on the page can read the data.**
That is why Breathe will not load code from other companies, will have a strict content security policy, and will keep dependencies to a minimum.

**5. The data can disappear.**
- Clearing "cookies and site data" removes it.
- Private or incognito windows delete it when closed.
- Browsers may remove stored data when a device is very low on space. Breathe will ask the browser to keep it ("persistent storage"), but the browser may refuse.
- Each browser and each browser profile has its own separate copy, and nothing syncs between them.
- Uninstalling or resetting the browser, or replacing the device, loses it.

**6. Shared website addresses.**
If Breathe is published on GitHub Pages, every project under the same `username.github.io` shares one origin, and so potentially one storage area. We will avoid this by using a dedicated address for Breathe, or by checking how storage is separated before we publish (see `DECISIONS.md`).

**7. Shared computers.**
Anyone using the same device login can open the same browser data. A clear "Delete all my data" button will be provided, and the app will advise against using it on shared computers.

The app itself will say the key points in plain words, once, during setup, and always in its privacy page.

## Backups: optional, secure, yours

**Principles**
- Optional. The app works without ever making a backup.
- You hold the file. Breathe does not upload it anywhere and has no copy.
- A backup file is an ordinary file you can store where you like (USB stick, your own cloud folder, and so on).
- Gentle, optional reminders only. No guilt, no streaks.

**Two kinds of backup**

| | Encrypted backup (recommended) | Plain backup |
|---|---|---|
| Protected by | A passphrase you choose | Nothing |
| Anyone who finds the file can read it? | No, not without the passphrase | **Yes** |
| If you forget the passphrase | **Cannot be recovered. Nobody can help.** | Not applicable |
| When | Stage 8 | Stage 4 (simple, with a clear warning) |

**How encryption will work (technical summary for contributors)**
- Uses the browser's built-in **Web Crypto API**. No extra encryption library.
- **AES-256-GCM** to encrypt and to detect tampering.
- A key derived from your passphrase with **PBKDF2-SHA-256**, using a high iteration count (at least the current OWASP recommendation, reviewed whenever it changes), plus a random salt for every backup.
- A fresh random value (IV) for every backup.
- The file records a format version, the salt, the IV and the settings used, so old backups can always be restored later.
- The passphrase is never stored or sent anywhere.
- Restoring checks the file before changing anything, and asks before replacing current data.
- Before this ships, the design will be reviewed by someone with security experience, and we will seek that review from the open-source community.

**Passphrase wording.** The app must explain, kindly and clearly: *"If you forget this passphrase, nobody, including us, can open this backup."*

**Later option: encrypting data on the device itself.**
It would be possible to encrypt the stored data with a passphrase. The trade-off is serious: forget it and the data is gone, and it must be typed every time. We will offer it only as an optional, clearly explained choice, and decide after real feedback.

## Honest limits of this design

We cannot promise protection against a device that is already compromised, or against someone who has your unlocked device. Breathe's job is to collect as little as possible, never send it anywhere, and be clear about the rest.
