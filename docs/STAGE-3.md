# Stage 3: first working version

One plain page. Type in your numbers and see your safe-to-spend figure, with a breakdown of where it came from. Nothing is saved yet (that is Stage 4), so refreshing the page clears it.

## What the page asks for

1. What is in your everyday account now (a minus sign is allowed for overdrawn), and the date that balance is from (today by default).
2. Your next payday. The "weekend or bank holiday?" question only appears if that date really is one.
3. Bills before payday (name, amount, due date).
4. Money coming in before payday, marked "I'm sure it is coming" or "It might come". Maybe-money is never counted.
5. Food per day, travel in total, and a safety buffer. All optional.
6. Bank holidays, typed by hand (optional, tucked away).

If an item is dated on the same day as the balance, the page asks "Has this already come out of the balance you entered?" rather than guessing.

## Not in this stage (on purpose)

- Saving anything (Stage 4).
- Savings transfers and pending payments. The calculator handles both; the screen will get them when real use shows they are needed.
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

85 automatic checks (`npm test`), including the amount reader, the wording scan (no shame, guilt or pressure words anywhere on the screen) and the conversion from form to calculator.

The screen was also tried in a real headless browser at phone width: typing in numbers, the weekend question, the "quick question" flow, a tight month, adding and removing rows, tap-target sizes and no sideways scrolling.

## Founding promise check

Stage 3 adds no new tools and loads nothing from other companies. Nothing is saved, stored or sent anywhere. Tight months get a calm title and no blame. Result: **in line with the promise.**
