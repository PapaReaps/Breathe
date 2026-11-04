# Stage 7c: built-in bank holidays

Bank holidays used to be typed in by hand, which was fiddly. Now you choose where you live and the app already knows them.

## What is new

**Menu → Bank holidays → "Where do you live?"**
- *England and Wales*, *Scotland*, *Northern Ireland*, or *I'll type my own* (what it was before).
- The official bank holidays for that part of the UK are used automatically for the weekend-payday question and for moving a payday that lands on a bank holiday. This works for repeating paydays too.
- The box for typing days is still there, now labelled as **extra days** (for example, a day your workplace is shut). These are added on top of the list.
- The Menu shows your choice: `Bank holidays: Scotland`, or `Scotland + 2 extra`.

**When the built-in list runs out**
The list covers up to the end of 2028. If your payday is past that, the home screen says so kindly and links to Bank holidays, rather than quietly treating those days as ordinary. This is covered in `docs/UPDATING-BANK-HOLIDAYS.md`.

## Where the dates come from

The official GOV.UK list (https://www.gov.uk/bank-holidays.json), copied in on 4 November 2026. Nothing is looked up online: the dates are part of the app, so it still works offline and nothing leaves your device.

## Your saved numbers

Numbers saved earlier open as *I'll type my own*, with your typed dates kept. New saves use format 3. An older copy of the app will refuse a newer backup instead of guessing, as before.

## What did not change

The calculation itself. It is simply given a fuller list of days when money does not move.

## Tests (written first)

- The list: every date is real, in order, with no repeats, never on a weekend, with a full set of holidays for every region and every year up to the last day covered.
- Facts checked against the official list: substitute days (Boxing Day 2026 on Monday 28 December, Christmas 2027 on Monday 27 December), Easter 2027, and the differences between regions (St Andrew's Day, 2nd January, Scottish summer holiday, St Patrick's Day, the Battle of the Boyne, Easter Monday).
- A payday on a regional holiday asks the weekend question only in the right region, and moves to the right day. A weekly payday skips Christmas Day correctly.
- Typed days are added to the region's list without repeats.
- The "list ended" note, the Menu summary, saving and restoring, and old saves without a region.

## Things to try

1. Menu → Bank holidays → Scotland. Set your payday to Monday 30 November 2026 (St Andrew's Day). It should ask the weekend question. Switch to England and Wales and it shouldn't.
2. Choose your own region and look at the Menu line.
3. Type an extra day and check it still counts.
