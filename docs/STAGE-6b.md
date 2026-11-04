# Stage 6b: tidy lists, the rainy-day pot, and Settings

Changes asked for after trying Stage 6.

## Bills and money coming in: one line each

- Each bill is one short line: `Mum    £100.00 · Fri 13 Nov`. Tap a line to change it. Only one is open at a time, and **Done** or **Remove** are right there.
- A one-line total sits at the top (`6 bills · £510.00 in total`).
- Rows are kept in date order. A row never jumps away while you are typing in it; it moves into place when you press Done.
- Anything unfinished says so kindly on its line (`no amount yet · no date yet`), in the calm "needs a look" colour.
- Money that "might come" says so on its line.
- A new form now starts with **no** bill rows (it used to start with one empty row). Completely empty rows are dropped when saved numbers are loaded, which also tidies earlier saves.

## Rainy-day pot

- The Menu shows the amount (`Food, rainy-day pot £50.00`).
- The home screen shows one quiet line under payday when a pot is set: `Rainy-day pot: £50.00 kept aside`. This is the only addition to the home screen; it is easy to remove if it feels like too much.

## Settings

- New **Settings** page in the Menu, starting with **Appearance**: *Match my device* (default), *Light*, *Dark*.
- Saved on this device, in its own record, separate from your numbers. **Clear my numbers does not reset it**, and backups do not carry it.
- Dark mode is now a real choice, not only a device setting. Choosing Light overrides a dark device, and vice versa.
- If you pick something other than "Match my device", the page may show the device's look for a split second when it opens, before your choice is read from the device.
- More settings (text size and so on) can be added to this page later (Stage 9).

## Tests

- `tests/rows.test.ts`: one-line summaries, missing details, totals, date order, appearance setting validation.
- `tests/savedData.test.ts`: new form has no rows; empty rows dropped on load.
- Browser test: six bills in jumbled order shown as six tidy lines in date order, total, only one open, no jump while typing, removing, pot in the menu and on the home screen, dark/light/match-device choices, kept after reload, not reset by clearing numbers. Stages 4 and 5 browser tests still pass.

## Founding-promise check

No move away from "always about helping people". Fewer things on screen at once, more control for the person, nothing new collected.

## Follow-up fixes (after testing on a phone)

- **Spacing:** the "Add a bill" and "Add money coming in" buttons were touching the Back / Next buttons below. Fixed, and every page was photographed and checked on a phone-sized screen.
- **Empty rows:** opening a row and pressing Done without typing no longer leaves an empty "Unnamed item" line behind. Pressing Add twice no longer stacks up empty rows.
- **Repeated hints:** the setup no longer says the same thing twice on the bills, food and pot questions.
- **Pence check:** with a balance containing pence and everything else in whole pounds, 20,000 random cases were compared with a separate calculation done in whole pennies. Every one matched to the penny. The same check now runs as part of `npm test` (`tests/safeToSpend.pence.test.ts`, 1,000 repeatable cases plus a worked example).
- **Where pence can appear from whole pounds:** weekly food and travel. A weekly amount spread over the days until payday rarely divides evenly (£50 a week for 9 days is £64.2857...), and it is deliberately rounded **up** to the next penny so the number is never too generous. "Where this number comes from" now shows the working: `Food and everyday spending (9 days of £50.00 a week)`.

## Rainy-day pot gets its own page, and a brighter look

- **Separate pages:** the Menu now has **Food and travel** and **Rainy-day pot** as two items. (The setup walk-through already asked about them separately.) The data page's backup preview lists them separately too.
- **A warm glow for the pot:** on the home screen the pot is a small warm badge (`✦ Rainy-day pot £250.00 kept aside`) with the amount in a brighter gold, so seeing it feels like a pat on the back. In the Menu the pot's amount is gold too. The colours are named variables (`--joy`, `--joy-bg`, `--joy-label`) at the top of `src/styles.css`, with light and dark versions.
- **Still readable:** the gold on its soft background measures 5.9:1 in light mode and 9.4:1 in dark mode (the target for normal text is 4.5:1).
- The badge only appears when you have a pot, and it is not a warning colour: no red or alarm colours are used anywhere.

## Cleaner Menu, and colour choices in Settings

- **Menu:** the extra "Kept on this device" line on *Your data and backups* is gone (the page itself explains it, and the long line made the Menu look uneven).
- **Settings now has three groups:** *Light or dark*, *App colour* (Teal, Blue, Plum, Rose, Green) and *Rainy-day pot colour* (Gold, Rose, Green, Blue, Lilac), with a small preview of the pot badge. The two colour choices are independent, work with light, dark and "match my device", and each option has its own readable light and dark version.
- Every option name is written out (the coloured circle is never the only clue), and every choice was checked for readable contrast (4.5:1 or better) in light and dark.
- Saved on this device with the other settings. Clearing numbers does not reset them. A bad or unknown saved value falls back to the default for that one setting; older saves (light/dark only) still load.
- Tests: `tests/rows.test.ts` (settings reading and defaults) and a browser test covering each choice, reload, dark mode with colours, clearing numbers, and a damaged saved value.
