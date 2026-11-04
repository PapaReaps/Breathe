# Stage 2: the calculator

The safe-to-spend calculation now exists as plain code with automatic checks. There are no screens yet. See `CALCULATION-DESIGN.md` for the rules.

## Decisions made (from the open list in DECISIONS.md)

| # | Decision | Result |
|---|---|---|
| B | Bills due **on** payday | Subtracted (cautious) |
| C | Weekend payday default | No default. The person chooses: working day before, on the day, or next working day |
| D | When a balance is "out of date" | More than 3 days old, changeable (`staleAfterDays`) |
| E | Bank holiday dates | The calculator accepts a list of non-working days. **The built-in England and Wales list is not built yet**; it comes with the screens |

## Where things are

| File | What it does |
|---|---|
| `apps/money/src/logic/safeToSpend.ts` | The calculation |
| `apps/money/src/logic/dates.ts` | Working days, weekends, leap years |
| `apps/money/src/logic/types.ts` | The shapes of the information |
| `apps/money/tests/` | The automatic checks, grouped by topic |

## Choices made while building, to review

- **Days of food and travel** run from the balance date up to, but not including, payday. Payday's own spending belongs to the next period.
- **Money coming in** counts only *before* payday. Income on payday itself is left for the next period.
- **Items dated on the day the balance was entered** can't be judged. Bills and savings are subtracted (cautious), income is not added (cautious), and the result includes a "needs an answer" note so the screen can ask.
- **Pending payments** are subtracted when "not yet off the balance". They are not checked against dates. A pending payment linked to a bill replaces that bill.
- **If payday has already passed**, the calculator returns "can't work it out yet" rather than guessing.
- **Bad information** (a decimal amount of pence, an impossible date, a negative bill) is refused with an error. The screens will check input first, so this protects against bugs.

## Checks

61 automatic checks across payday dates, bills on payday, weekends and bank holidays, uncertain income, double-counting, savings, and money maths. Run them with `npm test` in `apps/money`.

## Founding promise check

Stage 2 adds no new tools and nothing leaves the device. The calculator never changes saved information and never blames the person: negative results are returned as honest figures, and the screens will word them kindly. Result: **in line with the promise.**
