# Stage 3: first working version (simple home screen)

The main screen answers one question: **how much do I have to spend?** It shows your safe-to-spend number, one gentle line, and your payday. Everything else lives behind the **Menu** button. Nothing is saved yet (that is Stage 4), so refreshing the page clears it.

## Why it looks like this

The first version of Stage 3 put every form on the main page, and it felt like too much. The main screen is now deliberately quiet, in line with the brief ("a helpful conversation, not opening a bank account").

## The main screen

- Title, the big number, one reassuring line, and the payday with days to go.
- A **Menu** button at the top right.
- At most one small extra: a note if your balance may be out of date, or a "A quick question is waiting" button. Both are optional and only appear when needed.
- First time: a short welcome and one button, **Add your numbers**.

## The menu

A full-screen panel on a phone, a centred card on a computer. Each item shows a short summary, such as "£420.00" or "1 bill", and opens one small page:

| Item | What it holds |
|---|---|
| Your account | Balance, and the date it is from |
| Payday | Next payday date (the weekend question appears here only if needed) |
| Bills | Bills before payday |
| Money coming in | Things arriving before payday, "sure" or "might come" |
| Food, travel and rainy-day pot | Food and travel as **weekly** amounts, and a one-off rainy-day pot |
| Bank holidays | Typed dates (optional) |
| Where this number comes from | The breakdown, notes, and any quick questions |
| About Breathe Money | The founding promise, privacy, "not financial advice" |

While you edit, a line at the bottom of each page shows the effect: "Safe to spend now: £106.00".

The menu uses the browser's own `<dialog>`, so Escape closes it, keyboard focus stays inside, and focus returns to the Menu button afterwards.

## Weekly amounts

Food and travel are typed as amounts **per week**. The app spreads each one evenly across the days until payday and rounds up to the next penny, so it never overstates what is safe to spend. For example, £63 a week over 16 days is exactly £144. A monthly travel pass is a bill, so it goes under Bills.

The **rainy-day pot** is different: it is a one-off amount you keep aside and don't count as spendable, and it stays the same however many days are left. (Inside the code it is still called the "buffer".) See rules R9 and R10 in `CALCULATION-DESIGN.md`.

## Not in this stage (on purpose)

- Saving anything (Stage 4).
- Savings transfers and pending payments. The calculator handles both; the screens will get them when real use shows they are needed.
- The built-in England and Wales bank holiday list.
- Branding. The styling is plain and neutral.

## How amounts are read

`12.50`, `12.5`, `12`, `£12.50` and `12,50` all work, as does `1,234.56`. `12.505` and `12 50` get a gentle "I couldn't read that" message instead of being guessed at. Everything is stored as whole pence behind the scenes.

## Trying it on your phone (home Wi-Fi only)

1. In PowerShell, inside `apps\money`, run `npm run dev:phone`.
2. Look for the **Network** address it prints, such as `http://192.168.1.23:5173/`.
3. Type that address into your phone's browser. Your phone must be on the same Wi-Fi as the computer (not mobile data, not a guest network).
4. If Windows asks about the firewall for Node.js, allow **private networks only**.
5. Stop it with `Ctrl+C` when you have finished.

While it is running, anyone on the same Wi-Fi could open the page. Nothing is stored on the computer, but only do this at home.

## Checks

97 automatic checks (`npm test`), including the amount reader, the wording scan (no shame, guilt or pressure words anywhere on the screen) and the conversion from form to calculator.

The screens were also tried in a real headless browser at phone width and on a wide screen: the first-time set-up, each menu page, the live line, the quick-question flow, the weekend question, a tight month, an out-of-date balance, Escape and click-outside to close, tap-target sizes and no sideways scrolling.

## Founding promise check

No new tools, nothing loaded from other companies, nothing saved, stored or sent anywhere. The main screen is quieter, tight months get a calm title and no blame. Result: **in line with the promise.**
