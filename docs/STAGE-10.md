# Stage 10: installable, offline, and free on the web

Breathe Money can now be opened from a web link, added to a phone's home screen, and used with no internet.

## What is new

- **A web link.** The app is published for free on GitHub Pages. Every time something is pushed to `main`, the tests run, and only if they all pass is the new version published.
- **Add it to your home screen.** It opens full screen like a normal app, with its own icon.
- **Works offline.** After the first visit, the app's own files are kept on your device (by a small helper called a "service worker", in `apps/money/public/sw.js`). Your numbers were already kept on the device and still are.
- **A placeholder icon.** A plain teal square with a soft circle, until branding is agreed. The files are in `apps/money/public/`.

## What it does *not* do

- It never contacts any other website, and sends nothing anywhere.
- It never reads or stores your numbers. They stay in the browser's own storage.
- No tracking, no adverts, no cookies. See `PRIVACY.md`.

## Turning it on (one time)

1. Apply the zip, check the tests, and push (the same steps as before).
2. On GitHub, open your **Breathe** repository, then **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open the **Actions** tab. You should see "Publish Breathe Money" running. It takes a minute or two. A green tick means it is live.
5. Go back to **Settings → Pages**. The web address is shown at the top. It looks like `https://YOUR-USERNAME.github.io/Breathe/`.

If the publish step shows a red cross, open it and read the message. The most likely cause is a test failing, which is the recipe doing its job. If your main branch isn't called `main`, change `branches: [main]` in `.github/workflows/deploy.yml`.

## Adding it to your phone

- **Android (Chrome):** open the web address, tap the three dots, then **Install app** or **Add to Home screen**.
- **iPhone (Safari):** open the web address, tap the Share button, then **Add to Home Screen**.

## Things to know

- **Numbers belong to a web address.** Numbers you typed while testing on your own computer are not on the published copy. To move them, use **Menu → Your data and backups → Save a backup file** on the old copy, then **Use a backup file** on the new one. Backup files are not encrypted, so keep them private.
- **Phones can tidy away website data.** Safari on iPhone may remove a website's saved data if you haven't visited for a while. Adding the app to your home screen helps, and a backup file is the safety net. (Passphrase-encrypted backups are Stage 8.)
- **Updates.** When a new version is published, the app picks it up the next time it is opened with internet. Closing and reopening it once is enough.
- **Still testing on your own computer?** `npm run dev` works exactly as before. The offline helper only runs in the published version, so you never get stuck with old files while developing.

## Things to try

1. Open the published address on your phone and add it to your home screen.
2. Set it up with your numbers (or restore a backup file).
3. Turn on airplane mode and open it again. It should open, with your numbers.
4. Push a small change, wait for the green tick, then close and reopen the app. The change should appear.

## Tests

- `tests/pwa.test.ts`: the manifest and its icons (they exist and are exactly the size they say), the page's links, relative addresses, that the offline helper never mentions another website or your numbers, and that the publish recipe runs the tests before building and needs no secrets.
- A real-browser check, run from a sub-folder like GitHub Pages: the helper installs, keeps the right files, the app opens offline (including in a brand new tab), a published update is picked up and old copies are removed, and nothing is ever requested from another address.

I couldn't run Vite's own build in my workspace (no internet). The build above was a faithful stand-in, so the first real publish on GitHub is the final proof. The "Things to try" list above is the checklist for it.
