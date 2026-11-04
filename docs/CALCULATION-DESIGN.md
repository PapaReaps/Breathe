# How "safe to spend" will be calculated

This is the design for Stage 2. It is written **before any code** so we can agree the rules first. The tests listed at the bottom will be written to match it.

## The one big rule: one home for every pound

Double-counting happens when the same money is counted in two places. For example, a bill is subtracted, and then the money leaving your account is also already missing from your balance. So:

> **Every amount is counted in exactly one place. If it is already reflected in your balance, it is not counted again.**

## The basic sum

```
Balance you entered
+ reliable income that has not yet reached your balance, arriving before payday
- bills due before (or on) payday that your balance has not yet paid
- pending payments that your balance does not yet show
- planned food and travel until payday
- your rainy-day pot
- savings you have genuinely committed to, not yet moved
= SAFE TO SPEND
```

## Key idea: the balance "snapshot"

When you type in your balance, the app records **the amount and the moment you entered it**. Everything else is judged against that moment.

## Rules

**R1. Money is whole pennies, behind the scenes.** The app stores £12.50 as 1250 and uses whole numbers in every calculation, because computers make tiny rounding errors with decimals. People never see this. They type and read normal amounts such as £12.50, and the app converts in both directions. Typed amounts like `12`, `12.5`, `£12.50` and `12,50` should all be understood kindly.

**R2. The window.** The calculation covers *from your balance snapshot until payday*.

**R3. Anything before the snapshot is already in your balance.** Bills, income and payments dated before the snapshot day are ignored, because their effect is already in the balance. Items dated *on* the snapshot day are ambiguous, so the app asks once: "Is this already in your balance?" Items after the snapshot are counted.

**R4. Bills.**
- A bill due inside the window is subtracted once.
- **A bill due on payday itself is subtracted.** This is the cautious choice, because the payday money may not have arrived at the moment the bill is taken. *(To be confirmed by you; see `DECISIONS.md`.)*
- Marking a bill "paid" **after** the snapshot does not remove it, because your balance still includes that money until you update it. Updating your balance settles everything you marked as paid before then.
- A bill marked "my balance already shows this" is not subtracted.

**R5. Pending payments.** Banks differ: some "available balances" already take pending payments off, some do not. At setup the app asks which one you are typing in. Each pending item has a single yes/no: "Is this already taken off the balance I entered?" Only "no" items are subtracted. A pending item can be **linked to a bill**, so one real-world payment is never both a bill and a pending item.

**R6. Income.**
- **Reliable income** (you are sure it is coming, and when) dated inside the window and not yet in your balance is added once.
- **Uncertain income** is *never* added. It is shown separately: "Might arrive: £X (not counted)".
- Your main payday income belongs to the *next* period and is not added to this one.

**R7. Payday on a weekend or bank holiday.** You choose what usually happens: *paid on the working day before*, *paid on the day anyway*, or *paid on the next working day*. The app works out the effective payday from that. Bank holidays need a list of dates, which is a data decision (see `DECISIONS.md`). Stage 2 will accept a list of non-working days, so the logic is testable now.

**R8. Bills due on a weekend.** Dates are used as you enter them. Optionally, a bill can be marked "usually taken the next working day", which may move it in or out of the window. The cautious default: a bill is counted if *either* its due date or its working-day date falls inside the window.

**R9. Planned essentials (food, travel).** Entered as a **weekly amount**. The app spreads it evenly over the days from the balance snapshot until payday (that many days out of 7) and **rounds up to the next penny**, so the figure can never be overstated. For example, £63 a week over 16 days is exactly £144, and £10 a week over 1 day is 143p. The calculator can also take a daily amount or a lump sum. To avoid overlap with bills, a monthly travel pass is a bill, not an essential.

**R10. Rainy-day pot** (called the "buffer" in the code). A **one-off amount** you keep aside. It does not change with the number of days until payday. It is subtracted once, always. It is yours and the app never "spends" it.

**R11. Savings.**
- Your savings balance is **never** added to safe-to-spend.
- A savings transfer is subtracted only if it is *committed* (you marked it as definitely happening), falls inside the window, and has not already left your balance.
- A transfer that has already happened is already in your balance, so it is not subtracted again.

**R12. Negative results.** The calculation returns the true figure, even if it is negative. The screen decides the wording ("Things are tight until payday"), and never shames.

**R13. Breakdown, not just a number.** The calculation also returns every line it used, plus any warnings (old balance, uncertain income present, items needing a yes/no). The screen can then show "where this number came from". This also makes it much easier to test.

**R14. Out-of-date warnings.** If the balance snapshot is older than a set number of days, a gentle flag is attached. The number of days is to be agreed (see `DECISIONS.md`).

**R15. The calculation changes nothing.** It takes information in and gives an answer out. It never alters saved data.

## Test plan (written in Stage 2, before the calculation code)

All examples use fictional people and figures.

**Payday dates**
- P1. Payday is tomorrow, and bills are due today, tomorrow and the day after.
- P2. Payday is today (zero days left).
- P3. Payday already passed. The app flags that the date needs updating and does not guess.
- P4. Month-end payday (28th/29th/30th/31st), including a leap year February.
- P5. Payday crossing a year boundary (December to January).

**Bills due on payday**
- B1. Bill due on payday is subtracted (R4).
- B2. Bill due the day *before* payday is subtracted.
- B3. Bill due the day *after* payday is not subtracted.
- B4. Two bills on payday are both subtracted, but each only once.
- B5. A bill marked "balance already shows this" is not subtracted.

**Weekends and bank holidays**
- W1. Payday on Saturday and "paid the working day before" gives the Friday window.
- W2. Payday on Saturday and "paid next working day" gives the Monday window.
- W3. Payday on Sunday, then a bank holiday Monday, gives Tuesday.
- W4. A bill due on Saturday that is "taken next working day" falls inside or outside the window correctly.
- W5. Payday on Friday with a bill due on Saturday: the bill is outside the window.

**Uncertain income**
- U1. Uncertain income is never added.
- U2. Uncertain income is listed separately and flagged.
- U3. Reliable income dated before the snapshot is not added (already in the balance).
- U4. Reliable income arriving after payday is not added.
- U5. Reliable income inside the window is added exactly once.
- U6. A negative result caused only by uncertain income missing shows the right warning.

**Double-counting**
- D1. A pending payment already in the balance is not subtracted.
- D2. A pending payment not in the balance is subtracted once.
- D3. A pending payment linked to a bill gives one deduction, not two.
- D4. A bill paid after the snapshot is still subtracted until the balance is updated.
- D5. Updating the balance settles every item marked as paid before it.
- D6. Items dated on the snapshot day without a yes/no produce a "needs an answer" warning and not a guess.

**Savings**
- S1. Savings balance never affects the result.
- S2. A committed transfer inside the window is subtracted once.
- S3. An uncommitted "I would like to save" transfer is not subtracted.
- S4. A transfer already made is not subtracted again.

**Weekly amounts (food, travel) and the rainy-day pot**
- X1. A whole number of weeks is exact.
- X2. £63 a week over 16 days is exactly £144.
- X3. Part-weeks round up to the next penny.
- X4. Payday today means nothing weekly is taken.
- X5. Rounding never overstates the safe-to-spend figure and never loses more than a penny, across many amounts and day counts.
- X6. The one-off rainy-day pot is the same however many days are left.
- X7. No pot means no pot line.
- X8. The breakdown still adds up exactly with weekly amounts and a rainy-day pot in it.
- X9. Unusable weekly amounts and pot amounts are refused.

**Money maths and edge cases**
- M1. Pennies add up exactly (for example 0.10 + 0.20 gives exactly 30p).
- M2. Zero balance. M3. Zero bills. M4. Everything zero.
- M5. Result exactly zero. M6. Result negative, and the true figure is returned.
- M7. Very large numbers do not break.
- M8. Rainy-day pot larger than the balance.
- M9. Old balance triggers the out-of-date warning. A fresh one does not.
- M10. The same inputs always give the same answer, and the inputs are not changed.
