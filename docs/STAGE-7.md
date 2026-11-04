# Stage 7: things that repeat

Not everyone is paid once a month, and many bills come round on a pattern. This stage lets you say so, once.

## What is new

**How often are you paid?** (Menu → Payday, or the setup walk-through)
- *Just this one date* (as before), *every week*, *every 2 weeks*, *every 4 weeks*, or *every month*.
- Give any one payday date. Once it has gone by, the app moves on to the next by itself, so there is no "your payday has passed" to fix every month.
- If your payday sometimes lands on a weekend or bank holiday, you choose what usually happens, as before. For *every month* the app asks straight away, because some months will.

**Bills and money coming in can repeat** (a new **How often?** choice on each one)
- *Just once*, *every week*, *every 2 weeks*, *every 4 weeks*, or *every month*.
- Only the times that come round **before your payday** are counted. A weekly bill may count once or twice. A bill on the 31st uses the last day of shorter months.
- The list shows it: `Mum   £100.00 · every month from Fri 13 Nov`.
- Your main wages don't need adding here. That is what the payday setting is for.

**A kind note when a payday has gone by**
If a payday has passed since you last updated your balance, the home screen says so and offers **Update my balance**. The number stays cautious: it does not add the new pay to an old balance.

**Balance reminder** (Menu → Settings)
*Every day*, *Every 3 days* (the usual choice), *Once a week*, or *Don't remind me*. It only controls the gentle "your balance may have changed" note under the number.

## Your saved numbers

Numbers saved before this stage open exactly as they were. Everything old is treated as "one date only". New saves use format 2, so an *older* copy of the app will refuse a backup from this one with its usual "made by a newer version" message rather than guessing.

## What did not change

The calculation itself. Repeats are turned into ordinary dated bills and income *before* the calculation, so every earlier rule and test still applies.

## Tests (written first)

- Repeating dates: weekly, 2-weekly, 4-weekly, monthly, month ends, 29th/30th/31st, leap years, 2100, year boundaries, a first date long ago, and 20,000 random cases checked against a slow day-by-day method.
- Repeating payday, bills and money coming in, including the weekend answer, bills on payday, a balance from before the last payday, and 10,000 random months checked to the penny against a slow day-by-day count.
- Old saves still open; unknown values in a backup are refused.
- Everything from earlier stages still passes.

See `docs/CALCULATION-DESIGN.md`, rules R16 to R20.

## Things to try

1. Set *How often are you paid?* to *every week* with last Friday's date. The next Friday should appear, with no warning.
2. Add a bill with *Every week*. Open the list and check the line, then check the number moves as you'd expect.
3. Change your balance date to a week ago (or wait a few days) and see the "paid since" note.
4. In Settings, try each reminder choice.
