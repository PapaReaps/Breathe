# Privacy

**Current status (Stage 10):** Breathe Money keeps your numbers **on your own device**, inside your web browser (in a built-in browser database called IndexedDB). Breathe collects nothing. There is no server to send anything to, and the app makes no requests to other websites.

**Published copy (Stage 10):** if you open Breathe Money from its web address, your browser also keeps a copy of the app's own files (not your numbers) so it can open without internet. The web address is hosted for free by GitHub Pages, which, like any website host, can see that a page was requested. Breathe itself adds no tracking, no analytics and no cookies. Your numbers never leave your device, and they are kept separately for each web address, so numbers typed on your own computer are not on the published copy. Use a backup file to move them.

**Where your numbers live, and what that means:**

- Only on the device and browser you typed them into.
- **Not encrypted.** Anyone who can open that browser on that device could see them.
- The browser can remove them (for example if you clear your browsing data). A backup file is the safety net.
- A backup file is **also not encrypted** (passphrase-encrypted backups are planned for Stage 8). The app says so before it makes one.
- "Clear my numbers" in the app removes them from the device.

## Our promises

1. **No accounts.** No username, no password, no name, no address.
2. **Your data stays on your device.** There is no Breathe server and no cloud database.
3. **No tracking.** No analytics, no advertising, no third-party scripts, no fonts loaded from other companies.
4. **No bank logins. Ever.** Breathe will never ask for your real bank details. Version one has no bank connections.
5. **Honest about the limits.** Information saved in a browser is **not automatically encrypted**. We explain exactly what that means in [docs/STORAGE-AND-BACKUPS.md](docs/STORAGE-AND-BACKUPS.md), and the app will say it in plain words too.
6. **Fictional data only** in demonstrations, screenshots, tests and documentation.

## Not financial advice

Breathe is an organisation tool. It helps you see your own numbers more clearly. It does not give financial advice.
