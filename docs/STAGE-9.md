# Stage 9: privacy and accessibility

## What is new

All in **Menu → Settings**:

- **Privacy screen** (optional, off unless you switch it on). Choose a PIN of 4 to 12 numbers. Breathe Money then asks for it when it opens, and when you come back after a minute away. **Lock now** shows it straight away.
- **Text size**: Standard, Larger or Largest. Everything grows together, including buttons, and it adds to your phone or browser's own text size.
- **Contrast**: Match my device, or Higher contrast (darker writing and stronger outlines, in light and dark mode). "Match my device" turns on higher contrast by itself if your device asks for it.

## The privacy screen, honestly

It is a **privacy screen, not encryption** (decision G in `DECISIONS.md`). It stops someone glancing at your numbers. It does not stop a determined person with your device, because the numbers are still stored unencrypted in the browser. The app says this in Settings.

- The PIN itself is never stored. Only a one-way fingerprint of it is kept (PBKDF2-SHA-256 with a random salt).
- Nothing about your numbers is put on the page until the PIN matches.
- After 5 wrong tries in a row there's a calm 30-second pause, and after 10 a 5-minute pause, so guessing is slow.
- **Forgotten your PIN?** The lock can be removed, but that also clears your numbers from this device, so the lock still means something. A backup file brings them back.

## Accessibility checklist

Checked for this stage:

- [x] Every text box, choice and button has a visible label that screen readers also read.
- [x] Hints and problems are linked to their box (`aria-describedby`), and problem boxes are marked (`aria-invalid`).
- [x] Messages that appear (wrong PIN, saving, wrong passphrase) are announced (`aria-live`).
- [x] The lock screen puts the cursor straight in the PIN box. The passphrase box does the same when a protected backup is chosen.
- [x] Everything works with the keyboard alone: Tab to move, Enter to submit, Escape to close the menu (the browser's own `<dialog>` keeps focus inside and hands it back).
- [x] A clear focus ring on everything, thicker in higher contrast. Windows high contrast mode keeps outlines.
- [x] All sizes are in `rem`, so text size (the app's and the device's) scales the whole layout.
- [x] Animations are switched off for people who ask for reduced motion (already in place since Stage 6).
- [x] Calm wording, checked by `tests/wording.test.ts`.

Still worth checking by hand on real devices (we can't fully test these automatically):

- [ ] VoiceOver on iPhone: open the app, set up, read the number, use the menu.
- [ ] TalkBack on Android: the same.
- [ ] NVDA or Narrator on Windows: the same.
- [ ] 200% browser zoom plus **Largest** text size: nothing is cut off.
- [ ] Higher contrast in both light and dark mode, with each app colour.

## Tests

`tests/appLock.test.ts`: the right PIN matches and nothing else does; the PIN is never stored; same PIN gives different records; saved locks are checked before use; PIN rules; pauses after wrong tries; text size and contrast choices are kept, and anything unknown falls back to the default.
